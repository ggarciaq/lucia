/**
 * @file
 * Solo Menu Diagnostic Tool - User-Friendly Debugging
 *
 * This diagnostic tool is designed for end-users and support staff.
 * It tracks menu interactions and generates easy-to-understand reports.
 *
 * Usage:
 * 1. User clicks menus that aren't working
 * 2. User runs: generateSoloReport() in console
 * 3. Report is copied to clipboard automatically
 * 4. User sends report to developer
 */

((Drupal, drupalSettings) => {
  'use strict';

  // Only run in debug mode
  if (!drupalSettings?.solo?.debug) {
    return;
  }

  console.log('%c🔍 Solo Menu Diagnostic Loaded', 'color: #2196F3; font-weight: bold; font-size: 12px');

  /**
   * Diagnostic System
   */
  class SoloDiagnostic {
    constructor() {
      this.startTime = Date.now();
      this.data = {
        environment: this.captureEnvironment(),
        clicks: [],
        errors: [],
        stateSnapshots: [],
        doubleClicks: 0,
        lastClickTime: 0
      };

      this.init();
    }

    init() {
      this.setupClickMonitoring();
      this.setupErrorMonitoring();
      this.scheduleStateChecks();
      this.detectExtensions();
      this.exposeAPI();
      this.showInstructions();
    }

    /**
     * Capture environment information
     */
    captureEnvironment() {
      const ua = navigator.userAgent;
      return {
        timestamp: new Date().toISOString(),
        browser: this.detectBrowser(ua),
        userAgent: ua,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1
        },
        extensions: [], // Populated later
        drupalSettings: {
          soloAnimations: drupalSettings?.solo?.animations || {},
          breakpoint: Drupal?.solo?.getBreakpointNumber?.('mn') || 'unknown'
        }
      };
    }

    detectBrowser(ua) {
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Edg')) return 'Edge';
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
      return 'Unknown';
    }

    /**
     * Setup click monitoring
     */
    setupClickMonitoring() {
      document.addEventListener('click', (e) => {
        const button = this.findMenuButton(e.target);
        if (!button) return;

        const now = Date.now();
        const timeSinceLastClick = now - this.data.lastClickTime;

        // Detect double-clicks
        const isDoubleClick = timeSinceLastClick < 300;
        if (isDoubleClick) {
          this.data.doubleClicks++;
        }

        const submenu = button.nextElementSibling;
        const clickData = {
          timestamp: now - this.startTime,
          timeSinceLastClick,
          isDoubleClick,
          button: {
            text: (button.innerText || button.textContent || '').trim().substring(0, 30),
            className: button.className,
            id: button.id || null,
            tagName: button.tagName
          },
          submenu: submenu ? {
            found: true,
            className: submenu.className,
            wasToggled: submenu.classList.contains('toggled'),
            display: window.getComputedStyle(submenu).display,
            visibility: window.getComputedStyle(submenu).visibility
          } : { found: false },
          aria: {
            expanded: button.getAttribute('aria-expanded'),
            controls: button.getAttribute('aria-controls')
          },
          state: this.captureGlobalState()
        };

        // Check if click worked (after animation delay)
        setTimeout(() => {
          if (submenu) {
            const nowToggled = submenu.classList.contains('toggled');
            clickData.afterClick = {
              isToggled: nowToggled,
              display: window.getComputedStyle(submenu).display,
              ariaExpanded: button.getAttribute('aria-expanded')
            };
            clickData.success = clickData.submenu.wasToggled !== nowToggled;

            if (!clickData.success) {
              console.warn('❌ Menu click failed:', clickData.button.text || clickData.button.className);
            }
          }

          this.data.clicks.push(clickData);
        }, 150);

        this.data.lastClickTime = now;
      }, true);
    }

    /**
     * Find menu button from click target
     */
    findMenuButton(target) {
      // Direct button
      if (target.matches('button.dropdown-toggler')) return target;

      // Parent button
      const button = target.closest('button.dropdown-toggler');
      if (button) return button;

      // Sibling approach (for icons inside buttons)
      const parent = target.closest('.nav__menubar-item, li');
      if (parent) {
        const btn = parent.querySelector('button.dropdown-toggler');
        if (btn) return btn;
      }

      return null;
    }

    /**
     * Capture global state
     */
    captureGlobalState() {
      return {
        menuStateExists: typeof Drupal?.solo?.menuState !== 'undefined',
        isClicked: window.state?.isClicked || false,
        activeOperations: Drupal?.solo?.menuState?.activeOperations?.size || 0
      };
    }

    /**
     * Setup error monitoring
     */
    setupErrorMonitoring() {
      window.addEventListener('error', (e) => {
        this.data.errors.push({
          timestamp: Date.now() - this.startTime,
          message: e.message,
          filename: e.filename,
          line: e.lineno,
          column: e.colno
        });
      });
    }

    /**
     * Schedule periodic state checks
     */
    scheduleStateChecks() {
      // Check immediately
      this.captureStateSnapshot();

      // Check after 2 seconds
      setTimeout(() => this.captureStateSnapshot(), 2000);

      // Check after 10 seconds
      setTimeout(() => this.captureStateSnapshot(), 10000);
    }

    captureStateSnapshot() {
      const buttons = document.querySelectorAll('button.dropdown-toggler, .dropdown-toggler');
      const snapshot = {
        timestamp: Date.now() - this.startTime,
        totalButtons: buttons.length,
        buttonsWithHandlers: 0,
        animations: Drupal?.solo?.animations || {},
        globalStateStuck: window.state?.isClicked === true
      };

      buttons.forEach(btn => {
        if (btn.onclick ||
            btn.hasAttribute('data-solo-click-handler') ||
            Drupal?.solo?.eventHandlers?.clickHandlers?.has?.(btn)) {
          snapshot.buttonsWithHandlers++;
        }
      });

      this.data.stateSnapshots.push(snapshot);

      if (snapshot.globalStateStuck) {
        console.error('⚠️ Global state.isClicked is stuck at TRUE - this blocks all menu clicks!');
      }
    }

    /**
     * Detect browser extensions
     */
    detectExtensions() {
      setTimeout(() => {
        const extensions = [];
        if (document.querySelector('[data-grammarly-shadow-root]')) extensions.push('Grammarly');
        if (document.querySelector('[data-lastpass-root]')) extensions.push('LastPass');
        if (document.querySelector('#gdx-bubble-host')) extensions.push('Google Dictionary');
        if (window.___browserSync___) extensions.push('BrowserSync');
        if (document.querySelector('[class*="adblock"]')) extensions.push('AdBlocker');

        this.data.environment.extensions = extensions;
      }, 1000);
    }

    /**
     * Generate report
     */
    generateReport() {
      const latest = this.data.stateSnapshots[this.data.stateSnapshots.length - 1] || {};
      const failedClicks = this.data.clicks.filter(c => c.success === false);
      const successfulClicks = this.data.clicks.filter(c => c.success === true);

      const report = `
==========================================
SOLO MENU DIAGNOSTIC REPORT
==========================================
Date: ${new Date().toISOString()}
Browser: ${this.data.environment.browser}
Screen: ${this.data.environment.screenSize.width}x${this.data.environment.screenSize.height}
Mobile: ${this.data.environment.isMobile}
Extensions: ${this.data.environment.extensions.join(', ') || 'none detected'}

CLICK SUMMARY:
--------------
Total Menu Clicks: ${this.data.clicks.length}
Successful: ${successfulClicks.length}
Failed: ${failedClicks.length}
Double-clicks: ${this.data.doubleClicks}
JavaScript Errors: ${this.data.errors.length}

MENU STATE:
-----------
Total Buttons: ${latest.totalButtons || 0}
Buttons with Handlers: ${latest.buttonsWithHandlers || 0}
Global State Stuck: ${latest.globalStateStuck ? 'YES - CRITICAL!' : 'No'}

ANIMATION SETTINGS:
-------------------
${JSON.stringify(this.data.environment.drupalSettings.soloAnimations, null, 2)}

${failedClicks.length > 0 ? this.formatFailedClicks(failedClicks) : '✅ All clicks worked successfully!'}

${this.data.errors.length > 0 ? this.formatErrors() : '✅ No JavaScript errors detected'}

==========================================
DIAGNOSIS:
${this.generateDiagnosis(failedClicks)}
==========================================

RAW DATA (for developer):
${JSON.stringify({
  clicks: this.data.clicks,
  state: this.data.stateSnapshots,
  errors: this.data.errors
}, null, 2)}
==========================================
`;

      this.copyToClipboard(report);
      return report;
    }

    formatFailedClicks(failedClicks) {
      return `
FAILED CLICKS:
--------------
${failedClicks.map((click, i) => `
${i + 1}. Button: "${click.button.text || click.button.className}"
   Time: ${click.timestamp}ms
   Double-click: ${click.isDoubleClick ? 'YES' : 'No'}
   Time since last: ${click.timeSinceLastClick}ms
   State blocked: ${click.state.isClicked ? 'YES' : 'No'}
`).join('')}`;
    }

    formatErrors() {
      return `
JAVASCRIPT ERRORS:
------------------
${this.data.errors.map(e => `- ${e.message} (${e.filename}:${e.line})`).join('\n')}`;
    }

    generateDiagnosis(failedClicks) {
      const diagnosis = [];

      if (failedClicks.length === 0 && this.data.clicks.length > 0) {
        diagnosis.push('✅ All menu clicks are working correctly.');
      }

      if (this.data.doubleClicks > 0) {
        diagnosis.push('⚠️  User appears to be double-clicking menus. This may cause issues.');
      }

      if (failedClicks.some(c => c.state.isClicked)) {
        diagnosis.push('🔴 CRITICAL: Global click state is stuck. This prevents all menu interactions.');
      }

      const latest = this.data.stateSnapshots[this.data.stateSnapshots.length - 1];
      if (latest?.buttonsWithHandlers === 0 && latest?.totalButtons > 0) {
        diagnosis.push('🔴 CRITICAL: No event handlers found on menu buttons. JavaScript may not be loading.');
      }

      if (this.data.environment.extensions.length > 0) {
        diagnosis.push(`ℹ️  Browser extensions detected: ${this.data.environment.extensions.join(', ')}. These may interfere with menus.`);
      }

      if (this.data.errors.length > 0) {
        diagnosis.push(`⚠️  ${this.data.errors.length} JavaScript error(s) detected. Check console for details.`);
      }

      return diagnosis.length > 0 ? diagnosis.join('\n\n') : 'No issues detected.';
    }

    copyToClipboard(text) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        console.log('%c📋 Report copied to clipboard!', 'color: green; font-size: 16px; font-weight: bold');
      } catch (error) {
        console.error('Could not copy to clipboard:', error);
      }
    }

    /**
     * Pretty console display
     */
    showReport() {
      const failedClicks = this.data.clicks.filter(c => c.success === false);
      const successfulClicks = this.data.clicks.filter(c => c.success === true);
      const latest = this.data.stateSnapshots[this.data.stateSnapshots.length - 1] || {};

      console.log('%c╔═══════════════════════════════════════╗', 'color: #888');
      console.log('%c║   SOLO MENU DIAGNOSTIC RESULTS     ║', 'color: white; background: #333; font-weight: bold');
      console.log('%c╚═══════════════════════════════════════╝', 'color: #888');

      const status = failedClicks.length === 0 ? '✅ ALL MENUS WORKING' : `❌ ${failedClicks.length} CLICKS FAILED`;
      console.log(`%c${status}`, failedClicks.length === 0 ? 'color: green; font-size: 16px; font-weight: bold' : 'color: red; font-size: 16px; font-weight: bold');

      console.table({
        'Total Clicks': this.data.clicks.length,
        'Successful': successfulClicks.length,
        'Failed': failedClicks.length,
        'Double-clicks': this.data.doubleClicks,
        'Total Buttons': latest.totalButtons || 0,
        'With Handlers': latest.buttonsWithHandlers || 0
      });

      console.log('%cEnvironment:', 'font-weight: bold; color: blue');
      console.log(`Browser: ${this.data.environment.browser}`);
      console.log(`Screen: ${this.data.environment.screenSize.width}x${this.data.environment.screenSize.height}`);
      console.log(`Extensions: ${this.data.environment.extensions.join(', ') || 'none'}`);

      if (failedClicks.length > 0) {
        console.log('%c⚠️ Failed Clicks:', 'font-weight: bold; color: red');
        failedClicks.forEach((click, i) => {
          console.log(`${i+1}. Button: "${click.button.text}"`);
          console.log(`   Double-click: ${click.isDoubleClick ? 'YES' : 'No'}`);
          console.log(`   Time since last: ${click.timeSinceLastClick}ms`);
        });
      }

      console.log('%c╚═══════════════════════════════════════╝', 'color: #888');
    }

    /**
     * Expose API
     */
    exposeAPI() {
      window.generateSoloReport = () => this.generateReport();
      window.showReport = () => this.showReport();
    }

    /**
     * Show instructions
     */
    showInstructions() {
      console.log('%c📋 Instructions:', 'font-weight: bold; color: blue; font-size: 12px');
      console.log('1. Click dropdown menus (especially ones that fail)');
      console.log('2. Type: showReport() - for console display');
      console.log('3. Type: generateSoloReport() - to copy full report');
      console.log('4. Send report to developer for analysis');
    }
  }

  // Initialize diagnostic system
  window.soloDiagnostic = new SoloDiagnostic();

})(Drupal, drupalSettings);
