/**
 * @file
 * Solo Menu Debugger - FIXED VERSION
 *
 * Changes:
 * - Fixed double logging in animation batching
 * - Added component detection cache
 * - Removed unnecessary validation interval
 * - Added verbosity control
 */
((Drupal) => {
  'use strict';

  if (!drupalSettings?.solo?.debug) {
    return;
  }

  console.log('%cSolo Menu Debugger: Enabled', 'color: green; font-weight: bold');

  Drupal.solo = Drupal.solo || {};
  Drupal.solo.debugger = {
    stateLog: [],
    conflicts: [],
    performance: {
      resizeCount: 0,
      animationCount: 0,
      stateChangeCount: 0
    },

    // FIX 1: Add component detection cache
    componentCache: new WeakMap(),

    /**
     * Detect component from stack trace with caching
     */
    detectComponent(element = null) {
      // Try cache first if element provided
      if (element && this.componentCache.has(element)) {
        return this.componentCache.get(element);
      }

      try {
        const stack = new Error().stack;
        if (!stack) return 'system';

        const patterns = [
          { regex: /solo-menu-mobile\.js/i, component: 'mobile' },
          { regex: /solo-menu-side\.js/i, component: 'sidebar' },
          { regex: /solo-menu\.js(?!-)/i, component: 'main' },
          { regex: /solo-menu-scripts\.js/i, component: 'scripts' },
          { regex: /solo-keyboard/i, component: 'keyboard' },
          { regex: /solo-menu-repositions/i, component: 'repositions' },
          { regex: /solo-menu-state-manager/i, component: 'state-manager' }
        ];

        for (const { regex, component } of patterns) {
          if (regex.test(stack)) {
            // Cache if element provided
            if (element) {
              this.componentCache.set(element, component);
            }
            return component;
          }
        }

        return 'system';
      } catch (error) {
        return 'system';
      }
    },

    /**
     * Log state changes with verbosity control
     */
    logStateChange(component, action, element, details) {
      if (!component || component === 'unknown' || component === 'default') {
        component = this.detectComponent(element);
      }

      const entry = {
        timestamp: new Date().toISOString(),
        component,
        action,
        element: element?.id || element?.className || 'unknown',
        details,
        stackTrace: new Error().stack
      };

      this.stateLog.push(entry);
      this.performance.stateChangeCount++;

      // FIX 2: Proper verbosity control
      const verbosity = drupalSettings?.solo?.debug_verbosity || 'normal';
      const shouldLog =
        verbosity === 'verbose' ||
        (verbosity === 'normal' && component !== 'system') ||
        (verbosity === 'minimal' && (action.includes('conflict') || action.includes('error')));

      if (shouldLog) {
        console.groupCollapsed(
          `%c[${component}] ${action}`,
          'color: white; font-weight: bold'
        );
        console.log('Element:', element);
        console.log('Details:', details);
        console.trace();
        console.groupEnd();
      }
    },

    logConflict(type, components, element, details) {
      const conflict = {
        timestamp: new Date().toISOString(),
        type,
        components,
        element: element?.id || element?.className || 'unknown',
        details
      };

      this.conflicts.push(conflict);

      console.groupCollapsed(
        `%c⚠️ CONFLICT: ${type}`,
        'color: red; font-weight: bold; font-size: 14px'
      );
      console.warn('Components involved:', components);
      console.warn('Element:', element);
      console.warn('Details:', details);
      console.trace();
      console.groupEnd();
    },

    monitorAria() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' &&
              mutation.attributeName?.startsWith('aria-')) {

            const oldValue = mutation.oldValue;
            const newValue = mutation.target.getAttribute(mutation.attributeName);

            const recentChanges = this.stateLog.filter(log =>
              log.element === (mutation.target.id || mutation.target.className) &&
              log.action === 'aria-change' &&
              Date.now() - new Date(log.timestamp).getTime() < 100
            );

            if (recentChanges.length > 0) {
              this.logConflict(
                'Rapid ARIA Change',
                recentChanges.map(c => c.component),
                mutation.target,
                {
                  attribute: mutation.attributeName,
                  oldValue,
                  newValue,
                  changeCount: recentChanges.length + 1
                }
              );
            }
          }
        });
      });

      document.querySelectorAll('.solo-menu').forEach(menu => {
        observer.observe(menu, {
          attributes: true,
          attributeOldValue: true,
          subtree: true,
          attributeFilter: ['aria-expanded', 'aria-hidden', 'aria-controls']
        });
      });
    },

    /**
     * FIX 3: Optimized tabindex monitoring with cache
     */
    monitorTabindex() {
      let tabindexQueue = [];
      let tabindexTimer = null;

      const flushTabindexQueue = () => {
        if (tabindexQueue.length === 0) return;

        const component = tabindexQueue[0].component;

        // Log as batch (like animations)
        if (tabindexQueue.length > 5) {
          // Many changes - just log summary
          console.log(
            `%c[${component}] tabindex-change x${tabindexQueue.length} (batch)`,
            'color: #9E9E9E; font-size: 11px'
          );

          // Still log to stateLog as batch
          this.stateLog.push({
            timestamp: new Date().toISOString(),
            component,
            action: 'tabindex-change-batch',
            batchSize: tabindexQueue.length,
            elements: tabindexQueue.map(item => ({
              element: item.element?.className || 'unknown',
              oldValue: item.details.oldValue,
              newValue: item.details.newValue
            })),
            stackTrace: new Error().stack
          });

          this.performance.stateChangeCount += tabindexQueue.length;
        } else {
          // Few changes - log individually
          tabindexQueue.forEach(item => {
            this.logStateChange(item.component, item.action, item.element, item.details);
          });
        }

        tabindexQueue = [];
      };

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' &&
              mutation.attributeName === 'tabindex') {

            const component = this.detectComponent(mutation.target);

            // Add to queue instead of logging immediately
            tabindexQueue.push({
              component,
              action: 'tabindex-change',
              element: mutation.target,
              details: {
                oldValue: mutation.oldValue,
                newValue: mutation.target.getAttribute('tabindex')
              }
            });

            // Debounce - flush after 50ms of no new changes
            clearTimeout(tabindexTimer);
            tabindexTimer = setTimeout(flushTabindexQueue, 50);
          }
        });
      });

      document.querySelectorAll('.solo-menu a, .solo-menu button').forEach(element => {
        observer.observe(element, {
          attributes: true,
          attributeOldValue: true,
          attributeFilter: ['tabindex']
        });
      });
    },

    monitorResize() {
      let resizeCount = 0;
      const originalAddEventListener = window.addEventListener;

      window.addEventListener = function(event, handler, options) {
        if (event === 'resize') {
          resizeCount++;
          console.log(
            `%c🔍 Resize listener #${resizeCount} added`,
            'color: orange',
            new Error().stack
          );
        }
        return originalAddEventListener.call(this, event, handler, options);
      };
    },

    /**
     * FIX 4: Fixed animation monitoring - NO DOUBLE LOGGING
     */
    monitorAnimations() {
      const originalSlideUp = Drupal.solo.slideUp;
      const originalSlideDown = Drupal.solo.slideDown;

      let animationQueue = [];
      let animationTimer = null;

      const flushAnimationQueue = () => {
        if (animationQueue.length === 0) return;

        const component = animationQueue[0].component;
        const action = animationQueue[0].action;

        // Single batch entry to stateLog (not individual entries)
        const batchEntry = {
          timestamp: new Date().toISOString(),
          component,
          action: `${action}-batch`,
          batchSize: animationQueue.length,
          elements: animationQueue.map(item => ({
            className: item.element?.className || 'unknown',
            id: item.element?.id || null
          })),
          stackTrace: new Error().stack
        };

        this.stateLog.push(batchEntry);
        this.performance.stateChangeCount += animationQueue.length;
        this.performance.animationCount += animationQueue.length;

        // Console output for visibility
        if (animationQueue.length === 1) {
          console.log(
            `%c[${component}] ${action}`,
            'color: #FF9800; font-weight: bold',
            animationQueue[0].element?.className || 'element'
          );
        } else {
          console.groupCollapsed(
            `%c[${component}] ${action} x${animationQueue.length} (batch)`,
            'color: #FF9800; font-weight: bold'
          );
          animationQueue.forEach((item, index) => {
            console.log(`${index + 1}. ${item.element?.className || 'element'}`);
          });
          console.groupEnd();
        }

        animationQueue = [];
      };

      Drupal.solo.slideUp = (element, ...args) => {
        const component = this.detectComponent(element);

        animationQueue.push({
          component,
          action: 'slideUp',
          element,
          details: { args }
        });

        clearTimeout(animationTimer);
        animationTimer = setTimeout(flushAnimationQueue, 50);

        return originalSlideUp(element, ...args);
      };

      Drupal.solo.slideDown = (element, ...args) => {
        const component = this.detectComponent(element);

        animationQueue.push({
          component,
          action: 'slideDown',
          element,
          details: { args }
        });

        clearTimeout(animationTimer);
        animationTimer = setTimeout(flushAnimationQueue, 50);

        return originalSlideDown(element, ...args);
      };
    },

    generateReport() {
      console.group('%c📊 Solo Menu Debug Report', 'color: green; font-size: 16px; font-weight: bold');

      console.group('Summary');
      console.log('Total state changes:', this.performance.stateChangeCount);
      console.log('Total conflicts:', this.conflicts.length);
      console.log('Animation calls:', this.performance.animationCount);
      console.groupEnd();

      console.group('Changes by Component');
      const byComponent = this.stateLog.reduce((acc, log) => {
        acc[log.component] = (acc[log.component] || 0) + 1;
        return acc;
      }, {});
      console.table(byComponent);
      console.groupEnd();

      if (this.conflicts.length > 0) {
        console.group('Conflicts by Type');
        const conflictsByType = this.conflicts.reduce((acc, conflict) => {
          acc[conflict.type] = (acc[conflict.type] || 0) + 1;
          return acc;
        }, {});
        console.table(conflictsByType);
        console.groupEnd();

        console.group('Recent Conflicts (last 5)');
        this.conflicts.slice(-5).forEach(conflict => {
          console.log(`${conflict.timestamp}: ${conflict.type}`, conflict);
        });
        console.groupEnd();
      }

      console.group('Performance Metrics');
      console.log('State changes per minute:',
        (this.performance.stateChangeCount / (Date.now() - this.startTime) * 60000).toFixed(2)
      );
      console.groupEnd();

      console.groupEnd();
    },

    start() {
      this.startTime = Date.now();
      this.monitorAria();
      this.monitorTabindex();
      this.monitorResize();
      this.monitorAnimations();

      window.soloMenuReport = () => this.generateReport();

      // FIX 5: Manual validation only (no automatic interval)
      window.soloValidateState = () => {
        if (Drupal.solo.menuState) {
          console.log('Running Solo Menu state validation...');
          const isValid = Drupal.solo.menuState.validateState();
          if (isValid) {
            console.log('✓ All states are valid');
          } else {
            console.log('✗ Issues found (see warnings above)');
          }
          return isValid;
        }
        return true;
      };

      // Run validation only on load and unload
      window.addEventListener('load', () => {
        if (Drupal.solo.menuState) {
          Drupal.solo.menuState.validateState();
        }
      });

      window.addEventListener('beforeunload', () => {
        if (this.conflicts.length > 0) {
          console.warn('Solo Menu: Conflicts detected during session:', this.conflicts);
        }
        if (Drupal.solo.menuState) {
          Drupal.solo.menuState.validateState();
        }
      });

      console.log('%cSolo Menu Debugger started. Type soloMenuReport() in console for report.',
        'color: green; font-style: italic'
      );
      console.log('%cValidation runs automatically on load/unload. Run soloValidateState() for manual check.',
        'color: blue; font-style: italic'
      );
    },

    showVisualIndicator(element, type) {
      if (!element || !element.style) return;

      const originalOutline = element.style.outline;
      element.style.outline = '3px solid red';
      element.setAttribute('data-solo-conflict', type);

      setTimeout(() => {
        element.style.outline = originalOutline;
        element.removeAttribute('data-solo-conflict');
      }, 2000);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      Drupal.solo.debugger.start();
    });
  } else {
    Drupal.solo.debugger.start();
  }

  // Improved console API
  window.soloDebug = {
    logs: () => Drupal.solo.debugger.stateLog,
    conflicts: () => Drupal.solo.debugger.conflicts,
    report: () => Drupal.solo.debugger.generateReport(),
    clear: () => {
      Drupal.solo.debugger.stateLog = [];
      Drupal.solo.debugger.conflicts = [];
      console.log('Solo debugger cleared');
    },
    components: () => {
      const byComponent = Drupal.solo.debugger.stateLog.reduce((acc, log) => {
        acc[log.component] = (acc[log.component] || 0) + 1;
        return acc;
      }, {});
      console.table(byComponent);
      return byComponent;
    },
    filter: (component) => {
      return Drupal.solo.debugger.stateLog.filter(log => log.component === component);
    },
    animations: () => {
      return Drupal.solo.debugger.stateLog.filter(log =>
        log.action === 'slideUp' || log.action === 'slideDown' ||
        log.action === 'slideUp-batch' || log.action === 'slideDown-batch'
      );
    },
    animationSummary: () => {
      const animations = Drupal.solo.debugger.stateLog.filter(log =>
        log.action === 'slideUp' || log.action === 'slideDown' ||
        log.action === 'slideUp-batch' || log.action === 'slideDown-batch'
      );
      const summary = animations.reduce((acc, log) => {
        const key = `${log.component}-${log.action}`;
        acc[key] = (acc[key] || 0) + (log.batchSize || 1);
        return acc;
      }, {});
      console.table(summary);
      return summary;
    }
  };

})(Drupal);
