/**
 * @file
 * Solo theme JavaScript functionality.
 *
 * Filename:     solo-scripts.js
 * Website:      https://www.flashwebcenter.com
 * Developer:    Alaa Haddad https://www.alaahaddad.com.
 */

((Drupal, drupalSettings, once) => {
  'use strict';

  /**
   * Breakpoint configuration.
   *
   * Defines the thresholds for region width classes.
   * Single source of truth for all responsive breakpoints.
   */
  const BREAKPOINTS = {
    xxs: 260,
    xs: 320,
    s: 576,
    m: 768,
    l: 992,
    xl: 1200
  };

  /**
   * Human-readable labels for landmark sections.
   *
   * Maps section IDs to translatable, user-friendly labels for screen reader
   * announcements. These are used by skip links to announce navigation targets.
   *
   * @type {Object<string, Function>}
   */
  const SECTION_LABELS = {
    'header-content': () => Drupal.t('Header'),
    'main-navigation-content': () => Drupal.t('Main navigation'),
    'main-content': () => Drupal.t('Content'),
    'footer-content': () => Drupal.t('Footer')
  };

  /**
   * Gets a human-readable label for a section element.
   *
   * Priority order:
   * 1. aria-label attribute (most specific, already translatable)
   * 2. Predefined translatable label from SECTION_LABELS
   * 3. Formatted ID as fallback for custom sections
   * 4. Generic "Target section" fallback
   *
   * @param {HTMLElement} element
   *   The target section element.
   *
   * @return {string}
   *   The translated human-readable label.
   */
  const getSectionLabel = (element) => {
    // Priority 1: Use aria-label if present (most specific).
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }

    // Priority 2: Use predefined translatable label.
    const id = element.getAttribute('id');
    if (id && Object.prototype.hasOwnProperty.call(SECTION_LABELS, id)) {
      return SECTION_LABELS[id]();
    }

    // Priority 3: Fallback - format ID as readable text.
    // Removes common suffixes and formats for readability.
    if (id) {
      const cleanId = id
        .replace(/-content$/i, '')
        .replace(/-/g, ' ');
      return cleanId.charAt(0).toUpperCase() + cleanId.slice(1);
    }

    // Priority 4: Generic fallback.
    return Drupal.t('Target section');
  };

  /**
   * Gets the current viewport width.
   *
   * @return {number}
   *   The current width in pixels.
   */
  const getCurrentWidth = () => window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

  /**
   * Checks and updates region width classes.
   *
   * Assigns responsive classes to regions based on their current width.
   * Adds two types of classes:
   * 1. Exact breakpoint classes (region-xs, region-s, etc.) for precise targeting
   * 2. Cumulative max-width classes (region-max-768, etc.) for range-based styling
   *
   * The cumulative classes mirror CSS max-width media queries, allowing
   * mobile-first responsive patterns.
   */
  const checkRegionsWidth = () => {
    const regions = document.querySelectorAll('.region-inner, .copyright-inner, .footer-menu-inner');

    regions.forEach(region => {
      const regionWidth = region.getBoundingClientRect().width;

      // Build arrays of classes to remove (prevents manual maintenance)
      const exactClasses = ['region-xxs', 'region-xs', 'region-s', 'region-m', 'region-l', 'region-xl', 'region-xxl'];
      const maxClasses = Object.values(BREAKPOINTS).map(bp => `region-max-${bp}`);

      // Remove all previous responsive classes
      region.classList.remove(...exactClasses, ...maxClasses);

      // Determine exact breakpoint class
      // Note: Using 'region-xxs' to match removal array (original had 'region-xss' which appears to be a typo)
      let exactClass = 'region-xxl'; // Default for widest regions
      if (regionWidth <= BREAKPOINTS.xxs) {
        exactClass = 'region-xxs';
      } else if (regionWidth <= BREAKPOINTS.xs) {
        exactClass = 'region-xs';
      } else if (regionWidth <= BREAKPOINTS.s) {
        exactClass = 'region-s';
      } else if (regionWidth <= BREAKPOINTS.m) {
        exactClass = 'region-m';
      } else if (regionWidth <= BREAKPOINTS.l) {
        exactClass = 'region-l';
      } else if (regionWidth <= BREAKPOINTS.xl) {
        exactClass = 'region-xl';
      }
      region.classList.add(exactClass);

      // Add cumulative max-width classes
      Object.entries(BREAKPOINTS).forEach(([key, value]) => {
        if (regionWidth <= value) {
          region.classList.add(`region-max-${value}`);
        }
      });
    });
  };

  /**
   * Updates body classes based on viewport size.
   *
   * Adds responsive classes to body element for global responsive styling.
   * Works in conjunction with checkRegionsWidth for comprehensive responsive control.
   */
  const mediaSize = () => {
    const currentWidth = getCurrentWidth();
    const bodyTag = document.body;

    // Remove all previous size classes to prevent class duplication
    bodyTag.classList.remove('small-screen', 'medium-screen', 'large-screen');

    if (currentWidth >= BREAKPOINTS.l) {
      bodyTag.classList.add('large-screen');
    } else if (currentWidth >= BREAKPOINTS.s && currentWidth < BREAKPOINTS.l) {
      bodyTag.classList.add('medium-screen');
    } else if (currentWidth < BREAKPOINTS.s) {
      bodyTag.classList.add('small-screen');
    }

    // Update region classes whenever viewport changes
    checkRegionsWidth();
  };

  /**
   * Debounced resize handler.
   *
   * Prevents excessive function calls during window resize.
   * Uses requestAnimationFrame for smooth, performant updates.
   *
   * @return {Function}
   *   The debounced resize handler function.
   */
  const createResizeHandler = () => {
    let resizeTimeout;
    return () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Use requestAnimationFrame to align with browser paint cycle
        requestAnimationFrame(mediaSize);
      }, 200); // Conservative 200ms debounce
    };
  };

  /**
   * Handles skip link clicks for improved accessibility.
   *
   * Improved implementation for mobile screen reader (TalkBack) support:
   * - Uses scrollIntoView() for better SR compatibility
   * - Adds delay before focus for DOM/SR synchronization
   * - Provides ARIA live announcement for explicit feedback
   * - Maintains tabindex for screen reader focus state
   *
   * @param {string} skipLinkSelector
   *   CSS selector for the skip link element.
   * @param {string} targetSelector
   *   CSS selector for the target element.
   */
  const handleSkipLinkClick = (skipLinkSelector, targetSelector) => {
    const skipLink = document.querySelector(skipLinkSelector);
    const targetElement = document.querySelector(targetSelector);

    if (skipLink && targetElement) {
      skipLink.addEventListener('click', (event) => {
        event.preventDefault();

        // Make the target element focusable if it isn't already.
        // Using -1 allows programmatic focus without adding to tab order.
        if (!targetElement.hasAttribute('tabindex')) {
          targetElement.setAttribute('tabindex', '-1');
        }

        const announcement = getSectionLabel(targetElement);
        console.log('Announcement:', announcement);

        // Use scrollIntoView for better screen reader compatibility.
        // 'start' alignment works better with TalkBack than other options.
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Small delay before focusing helps TalkBack register the target.
        // 100ms is enough for DOM/SR sync without noticeable UX delay.
        setTimeout(() => {
          targetElement.focus();

          // Get translatable, human-friendly section label.
          const announcement = getSectionLabel(targetElement);

          // Create temporary live region for announcement.
          const liveRegion = document.createElement('div');
          liveRegion.setAttribute('role', 'status');
          liveRegion.setAttribute('aria-live', 'polite');
          liveRegion.className = 'visually-hidden';
          liveRegion.textContent = Drupal.t('Navigated to @section', {'@section': announcement});
          document.body.appendChild(liveRegion);

          // Remove live region after announcement.
          setTimeout(() => {
            if (liveRegion.parentNode) {
              document.body.removeChild(liveRegion);
            }
          }, 1000);
        }, 100);
      });
    }
  };

  /**
   * Solo theme behavior.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches Solo theme behaviors.
   */
  Drupal.behaviors.soloTheme = {
    attach: function(context, settings) {

      // Add file extension classes to file field spans.
      // Uses once() to prevent duplicate processing on AJAX updates.
      once('solo-file-extensions', '.field--type-file span.file', context).forEach(span => {
        const link = span.querySelector('a');
        if (link && span.contains(link)) {
          const url = link.getAttribute('href');
          const urlParts = url.split('.');
          const fileExtension = urlParts[urlParts.length - 1];
          if (fileExtension) {
            span.classList.add(`file--${fileExtension}`);
          }
        }
      });

      // Style footer menu forms to match footer menu colors.
      // Uses once() to prevent duplicate processing.
      once('solo-footer-menu-form', '#footer-menu', context).forEach(footerMenu => {
        const footerFormBg = window.getComputedStyle(footerMenu).backgroundColor;
        const footerFormTxt = window.getComputedStyle(footerMenu).color;
        const footerMenuForm = footerMenu.querySelector('form');

        if (footerMenuForm) {
          footerMenuForm.style.background = footerFormBg;
          footerMenuForm.style.color = footerFormTxt;
        }
      });

      // Remove 'open' attribute from details in theme settings.
      // This prevents all fieldsets from being expanded by default.
      once('solo-theme-settings-details', '#system-theme-settings details', context).forEach(element => {
        element.removeAttribute('open');
      });

      // Add clickable class to images/pictures inside links.
      // Excludes specific contexts like logos and user pictures.
      once('solo-clickable-images', 'a > img, a > picture', context).forEach(el => {
        // Check if any parent has specific classes to exclude.
        let ancestor = el.parentElement;
        let shouldExclude = false;

        while (ancestor && ancestor !== document.body) {
          if (ancestor.matches('.site-logo, .field--name-user-picture, .field--type-text-long, .field--type-text-with-summary')) {
            shouldExclude = true;
            break;
          }
          ancestor = ancestor.parentElement;
        }

        // Exclude elements with "icon" in their class or parent's class.
        if (el.classList.contains('icon') || (el.parentElement && el.parentElement.classList.contains('icon'))) {
          shouldExclude = true;
        }

        if (!shouldExclude) {
          el.parentElement.classList.add('img--is-clickable');
        }
      });

      // Handle broken images by adding placeholder.
      // Only triggers for images that actually fail to load.
      once('solo-broken-images', 'img', context).forEach(img => {
        if (img.complete && img.naturalHeight > 0) {
          return;
        }

        img.addEventListener('error', function() {
          if (!this.classList.contains('broken-image') && this.complete) {
            this.classList.add('broken-image');

            const placeholder = document.createElement('div');
            placeholder.className = 'img-placeholder';

            // ONLY set dimensions if image actually has them
            if (this.offsetWidth > 0) {
              placeholder.style.width = this.offsetWidth + 'px';
            }
            if (this.offsetHeight > 0) {
              placeholder.style.height = this.offsetHeight + 'px';
            }

            // Copy CSS classes to inherit responsive behavior
            if (this.className) {
              placeholder.className = 'img-placeholder ' + this.className;
            }

            placeholder.textContent = Drupal.t('Image not available');
            placeholder.setAttribute('role', 'img');
            placeholder.setAttribute('aria-label', Drupal.t('Image not available'));

            this.style.display = 'none';
            this.parentNode.insertBefore(placeholder, this);

            if (Drupal.announce) {
              Drupal.announce(Drupal.t('An image failed to load'));
            }
          }
        }, { once: true });
      });

      // Setup skip links for accessibility.
      // Uses once() to prevent duplicate event listeners on AJAX updates.
      once('solo-skip-links', 'body', context).forEach(() => {
        handleSkipLinkClick('.skip-link[href="#header-content"]', '#header-content');
        handleSkipLinkClick('.skip-link[href="#main-navigation-content"]', '#main-navigation-content');
        handleSkipLinkClick('.skip-link[href="#main-content"]', '#main-content');
        handleSkipLinkClick('.skip-link[href="#footer-content"]', '#footer-content');
      });

      // Initialize media size detection.
      // Uses once() to prevent duplicate resize listeners.
      once('solo-media-size', 'body', context).forEach(() => {
        // Run initial check
        mediaSize();

        // Create and attach resize handler
        const resizeHandler = createResizeHandler();
        window.addEventListener('resize', resizeHandler);

        // Store handler reference for cleanup
        if (!window.soloResizeHandlers) {
          window.soloResizeHandlers = [];
        }
        window.soloResizeHandlers.push(resizeHandler);
      });
    },

    /**
     * Detaches Solo theme behaviors.
     *
     * This is called when content is removed from the page.
     * Proper cleanup prevents memory leaks in AJAX-heavy applications.
     *
     * @param {HTMLElement} context
     *   The context element being removed.
     * @param {object} settings
     *   Settings object.
     * @param {string} trigger
     *   The trigger for detachment.
     */
    detach: function(context, settings, trigger) {
      // Clean up resize event listeners when content is removed.
      if (trigger === 'unload' && window.soloResizeHandlers) {
        window.soloResizeHandlers.forEach(handler => {
          window.removeEventListener('resize', handler);
        });
        window.soloResizeHandlers = [];
      }
    }
  };

})(Drupal, drupalSettings, once);
