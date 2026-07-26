/**
 * @file
 * Contains utility functions for Solo module.
 *
 * Filename: solo-utils.js
 * Website: https://www.flashwebcenter.com
 * Developer: Alaa Haddad https://www.alaahaddad.com.
 */
((Drupal, drupalSettings, once) => {
  'use strict';

  /**
   * Solo helper functions namespace.
   *
   * @namespace
   */
  Drupal.solo = Drupal.solo || {};

  /**
   * Safely escapes CSS selectors with IE11 fallback
   */
  Drupal.solo.escapeSelector = (str) => {
    if (!str) return '';

    if (typeof CSS !== 'undefined' && CSS.escape) {
      try {
        return CSS.escape(str);
      } catch (e) {
        console.warn('Solo: CSS.escape failed', e);
      }
    }

    // Fallback for IE11 and edge cases
    return str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
  };

  /**
   * Animation queue with automatic cleanup
   */
  Drupal.solo.animationQueue = (() => {
    const queue = new Map();
    const cleanupHandlers = new Map();

    const add = (elementKey, type, duration) => {
      queue.set(elementKey, type);

      // Auto-cleanup after duration + buffer
      const timeoutId = setTimeout(() => {
        queue.delete(elementKey);
        cleanupHandlers.delete(elementKey);
      }, duration + 100);

      // Cleanup on page navigation
      const cleanup = () => {
        clearTimeout(timeoutId);
        queue.delete(elementKey);
        cleanupHandlers.delete(elementKey);
      };

      cleanupHandlers.set(elementKey, cleanup);
      window.addEventListener('pagehide', cleanup, { once: true });

      return cleanup;
    };

    const has = (elementKey) => queue.has(elementKey);

    const clear = (elementKey) => {
      const cleanup = cleanupHandlers.get(elementKey);
      if (cleanup) cleanup();
    };

    const clearAll = () => {
      cleanupHandlers.forEach(cleanup => cleanup());
      queue.clear();
      cleanupHandlers.clear();
    };

    return { add, has, clear, clearAll };
  })();

  /**
   * Observes DOM mutations and cleans up orphaned event listeners
   */
  Drupal.solo.setupListenerCleanup = (handlerMap) => {
    if (!handlerMap || typeof MutationObserver === 'undefined') return null;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.querySelectorAll) {
            // Clean up event listeners on removed elements
            const buttons = node.querySelectorAll('.dropdown-toggler');
            buttons.forEach(btn => {
              const handler = handlerMap.get(btn);
              if (handler) {
                btn.removeEventListener('click', handler);
                handlerMap.delete(btn);
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  };

  /**
   * Sets inert state with fallback for Safari < 15.5
   */
  Drupal.solo.setInert = (element, value) => {
    if (!element || !(element instanceof HTMLElement)) return;

    if ('inert' in HTMLElement.prototype) {
      element.inert = value;
    } else {
      // Fallback for older browsers
      element.setAttribute('aria-hidden', value ? 'true' : 'false');

      if (value) {
        element.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(el => {
          const currentTabindex = el.getAttribute('tabindex');
          el.setAttribute('data-original-tabindex', currentTabindex || '0');
          el.setAttribute('tabindex', '-1');
        });
      } else {
        element.querySelectorAll('[data-original-tabindex]').forEach(el => {
          const original = el.getAttribute('data-original-tabindex');
          if (original === '0' || original === null) {
            el.removeAttribute('tabindex');
          } else {
            el.setAttribute('tabindex', original);
          }
          el.removeAttribute('data-original-tabindex');
        });
      }
    }
  };

  Drupal.solo.animations = {
    slideUp: drupalSettings.solo?.slideUpSpeed || 350,
    slideDown: drupalSettings.solo?.slideDownSpeed || 500,
    megaMenu: drupalSettings.solo?.megaMenuSpeed || 800,
    reset: drupalSettings.solo?.slideUpSpeed || 350,
    clickDelay: 500
  };

  const animations = Drupal.solo.animations;
  const prefersReducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const BREAKPOINTS = {
    XS: 576,
    SM: 768,
    MD: 992,
    LG: 1200,
    XL: 1400
  };

  const SELECTORS = {
    PAGE_WRAPPER: '.page-wrapper',
    SOLO_MENUS: '.solo-inner nav ul:not(.field ul)',
    SOLO_MENUS_ALL: '.solo-inner nav ul',
    FILE_UPLOAD_WRAPPER: '.solo-file-upload-wrapper',
    FILE_INPUT: '.solo-file-native',
    FILE_NAME: '.solo-file-name',
    SEARCH_DETAILS: '.search-form details.search-advanced',
    DETAILS_WRAPPER: '.details-wrapper'
  };

  // Store active animations for cleanup (Map instead of WeakMap so cleanup() can iterate).
  const activeAnimations = new Map();

  /**
   * CSS styles for collapsed state.
   * @const {Object}
   */
  const cssStyles = {
    overflow: 'hidden',
    height: '0',
    paddingTop: '0',
    paddingBottom: '0',
    marginTop: '0',
    marginBottom: '0'
  };

  /**
   * Removes inline styles from an element.
   * @param {HTMLElement} target - The target element.
   */
  const removeStyles = (target) => {
    if (!target || !(target instanceof HTMLElement)) {
      console.warn('Solo: Invalid target element provided to removeStyles');
      return;
    }

    // Hyphenated property names for removeProperty(); transform for iOS compositor layer cleanup.
    const props = ['height', 'padding-top', 'padding-bottom', 'margin-top', 'margin-bottom', 'overflow', 'transition-duration', 'transition-property', 'transition-timing-function', 'box-sizing', 'transform', '-webkit-transform'];

    try {
      props.forEach((p) => target.style.removeProperty(p));
    } catch (error) {
      console.error('Solo: Error removing styles', error);
    }
  };
  Drupal.solo.removeStyles = removeStyles;

  /**
   * Updates tabindex for menu items based on state.
   * Uses state manager for coordination.
   * @param {HTMLElement} target - The target container element.
   * @param {boolean} isOpen - Whether the menu is open.
   * @param {string} componentName - The component making the change.
   */
  const updateTabindex = (target, isOpen, componentName = 'utils') => {
    if (!target || !(target instanceof HTMLElement)) {
      return;
    }

    try {
      if (Drupal.solo.menuState) {
        Drupal.solo.menuState.updateMenuTabindex(target, isOpen, componentName);
      } else {
        // Fallback for backward compatibility
        const firstLevelItems = target.querySelectorAll(':scope > li > a, :scope > li > button');
        firstLevelItems.forEach(item => {
          item.setAttribute('tabindex', isOpen ? '0' : '-1');
        });
      }
    } catch (error) {
      console.error('Solo: Error updating tabindex', error);
    }
  };

  /**
   * Clears animation timeout for an element.
   * @param {HTMLElement} element - The element with active animation.
   */
  const clearAnimationTimeout = (element) => {
    const timeoutId = activeAnimations.get(element);
    if (timeoutId) {
      clearTimeout(timeoutId);
      activeAnimations.delete(element);
    }
  };

  /**
   * Slides up an element with animation.
   * @param {HTMLElement} target - The target element to slide up.
   * @param {number} [duration=600] - Animation duration in milliseconds.
   * @param {string} [componentName='utils'] - The component making the change.
   * @returns {boolean} Success status.
   */
  /**
   * Slides up an element with animation.
   * @param {HTMLElement} target - The target element to slide up.
   * @param {number} [duration=600] - Animation duration in milliseconds.
   * @param {string} [componentName='utils'] - The component making the change.
   * @param {boolean} [announce=false] - Whether to announce state change to screen readers.
   * @returns {boolean} Success status.
   */
  const slideUp = (target, duration = animations.slideUp, componentName = 'utils', announce = false) => {
    if (!target || !(target instanceof HTMLElement)) {
      console.warn('Solo: Invalid target element provided to slideUp');
      return false;
    }

    // Clear any existing animation
    clearAnimationTimeout(target);

    if (prefersReducedMotion()) {
      target.classList.remove('toggled');
      if (Drupal.solo.menuState) {
        Drupal.solo.menuState.setHidden(target, true, componentName);
      } else {
        target.setAttribute('aria-hidden', 'true');
      }
      updateTabindex(target, false, componentName);
      target.style.display = 'none';
      removeStyles(target);
      
      // FIXED: Only announce if explicitly requested
      if (announce && Drupal.announce) {
        Drupal.announce(Drupal.t('Content collapsed'));
      }
      return true;
    }

    try {
      target.style.transitionProperty = 'height, margin, padding';
      target.style.transitionDuration = `${duration}ms`;
      target.style.transitionTimingFunction = 'ease-in-out';
      target.style.boxSizing = 'border-box';
      target.style.height = `${target.offsetHeight}px`;
      target.style.webkitTransform = 'translateZ(0)';
      target.style.transform = 'translateZ(0)';
      void target.offsetHeight;

      target.classList.remove('toggled');
      if (Drupal.solo.menuState) {
        Drupal.solo.menuState.setHidden(target, true, componentName);
      } else {
        target.setAttribute('aria-hidden', 'true');
      }
      updateTabindex(target, false, componentName);

      // iOS Safari: apply collapse in next frame so "from" state is painted and transition runs.
      const applySlideUpEnd = () => {
        Object.keys(cssStyles).forEach(style => {
          target.style[style] = cssStyles[style];
        });
      };
      requestAnimationFrame(applySlideUpEnd);

      const timeoutId = setTimeout(() => {
        if (target && target.parentNode) {
          target.style.display = 'none';
          removeStyles(target);
          activeAnimations.delete(target);

          // FIXED: Only announce if explicitly requested
          if (announce && Drupal.announce) {
            Drupal.announce(Drupal.t('Content collapsed'));
          }
        }
      }, duration + 20);

      activeAnimations.set(target, timeoutId);
      return true;
    } catch (error) {
      console.error('Solo: Error in slideUp animation', error);
      return false;
    }
  };
  Drupal.solo.slideUp = slideUp;

  /**
   * Slides down an element with animation.
   * @param {HTMLElement} target - The target element to slide down.
   * @param {number} [duration=600] - Animation duration in milliseconds.
   * @param {string} [menuDisplay='block'] - Display value when shown.
   * @param {string} [componentName='utils'] - The component making the change.
   * @param {boolean} [announce=false] - Whether to announce state change to screen readers.
   * @returns {boolean} Success status.
   */
  const slideDown = (target, duration = animations.slideDown, menuDisplay = 'block', componentName = 'utils', announce = false) => {
    if (!target || !(target instanceof HTMLElement)) {
      console.warn('Solo: Invalid target element provided to slideDown');
      return false;
    }

    // Clear any existing animation
    clearAnimationTimeout(target);

    if (prefersReducedMotion()) {
      target.style.display = menuDisplay;
      target.classList.add('toggled');
      if (Drupal.solo.menuState) {
        Drupal.solo.menuState.setAriaAttribute(target, 'aria-hidden', 'false', componentName);
      } else {
        target.setAttribute('aria-hidden', 'false');
      }
      updateTabindex(target, true, componentName);
      removeStyles(target);
      
      // FIXED: Only announce if explicitly requested
      if (announce && Drupal.announce) {
        Drupal.announce(Drupal.t('Content expanded'));
      }
      return true;
    }

    try {
      target.style.removeProperty('display');
      let currentDisplay = window.getComputedStyle(target).display;

      if (currentDisplay === 'none') {
        currentDisplay = menuDisplay;
      }

      target.style.display = menuDisplay;
      let height = target.offsetHeight;
      height = Math.round(height);

      // Apply collapsed "from" state without transition.
      Object.keys(cssStyles).forEach(style => {
        target.style[style] = cssStyles[style];
      });
      target.style.boxSizing = 'border-box';

      // Force reflow to paint the collapsed state before enabling transition.
      void target.offsetHeight;

      // Now enable transition and GPU layer promotion.
      target.style.transitionProperty = 'height, margin, padding';
      target.style.transitionDuration = `${duration}ms`;
      target.style.transitionTimingFunction = 'ease-in-out';
      target.style.webkitTransform = 'translateZ(0)';
      target.style.transform = 'translateZ(0)';

      // iOS Safari: set expanded height in next frame so transition runs from 0 → target.
      const applySlideDownEnd = () => {
        if (!target.parentNode) return;
        target.style.height = `${height}px`;
        target.classList.add('toggled');
        if (Drupal.solo.menuState) {
          Drupal.solo.menuState.setAriaAttribute(target, 'aria-hidden', 'false', componentName);
        } else {
          target.setAttribute('aria-hidden', 'false');
        }
        updateTabindex(target, true, componentName);
        ['padding-top', 'padding-bottom', 'margin-top', 'margin-bottom'].forEach(property => {
          target.style.removeProperty(property);
        });
      };
      requestAnimationFrame(applySlideDownEnd);

      const timeoutId = setTimeout(() => {
        if (target && target.parentNode) {
          ['height', 'overflow', 'transition-duration', 'transition-property', 'transition-timing-function', 'box-sizing', 'transform', '-webkit-transform'].forEach(property =>
            target.style.removeProperty(property));
          activeAnimations.delete(target);
          if (announce && Drupal.announce) {
            Drupal.announce(Drupal.t('Content expanded'));
          }
        }
      }, duration + 20);
      activeAnimations.set(target, timeoutId);
      return true;
    } catch (error) {
      console.error('Solo: Error in slideDown animation', error);
      return false;
    }
  };
  Drupal.solo.slideDown = slideDown;

  /**
   * Toggles slide animation on an element.
   * @param {HTMLElement} target - The target element to toggle.
   * @param {number} [duration=500] - Animation duration in milliseconds.
   * @param {string} [componentName='utils'] - The component making the change.
   * @returns {boolean} Success status.
   */
  const slideToggle = (target, duration = animations.slideUp, componentName = 'utils') => {
    if (!target || !(target instanceof HTMLElement)) {
      console.warn('Solo: Invalid target element provided to slideToggle');
      return false;
    }

    // Prevent rapid toggling during animation
    if (activeAnimations.has(target)) {
      return false;
    }

    if (!target.classList.contains('toggled')) {
      return slideDown(target, duration, 'flex', componentName);
    } else {
      return slideUp(target, duration, componentName);
    }
  };
  Drupal.solo.slideToggle = slideToggle;

  /**
   * Gets the current viewport width.
   * Uses state manager if available for consistency.
   * @returns {number} Current width in pixels.
   */
  const getCurrentWidth = () => {
    if (Drupal.solo.menuState) {
      return Drupal.solo.menuState.getCurrentWidth();
    }
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0;
  };

  /**
   * Calculates the depth of a menu element.
   * @param {HTMLElement} element - The menu element.
   * @returns {number} The depth level (starts at 1).
   */
  const calculateDepth = (element) => {
    if (!element || !(element instanceof HTMLElement)) {
      return 1;
    }

    let depth = 1;
    let parent = element.parentElement;

    while (parent) {
      if (parent.tagName.toLowerCase() === 'ul') {
        depth++;
      }
      parent = parent.parentElement;
    }

    return depth;
  };
  Drupal.solo.calculateDepth = calculateDepth;

  /**
   * Adds depth-based classes to menu elements.
   * @param {HTMLElement} element - The menu element.
   * @param {number} depth - The depth level.
   */
  const addClassAccordingToDepth = (element, depth) => {
    if (!element || !(element instanceof HTMLElement)) {
      return;
    }

    try {
      element.classList.add(`ul-${depth}`);

      const children = element.children;
      for (let i = 0; i < children.length; i++) {
        if (children[i] instanceof HTMLElement) {
          children[i].classList.add(`li-${depth}`);
        }
      }
    } catch (error) {
      console.error('Solo: Error adding depth classes', error);
    }
  };

  /**
   * Gets breakpoint value from element classes.
   * @param {HTMLElement} element - The element to check.
   * @param {string} mn - The breakpoint prefix.
   * @returns {number} The breakpoint value in pixels.
   */
  const getMyBreakpoints = (element, mn) => {
    if (!element || !(element instanceof HTMLElement)) {
      return BREAKPOINTS.MD; // Default breakpoint
    }

    const classes = [
      `${mn}-${BREAKPOINTS.XS}`,
      `${mn}-${BREAKPOINTS.SM}`,
      `${mn}-${BREAKPOINTS.MD}`,
      `${mn}-${BREAKPOINTS.LG}`,
      `${mn}-${BREAKPOINTS.XL}`
    ];

    const classList = Array.from(element.classList);
    const foundClass = classList.find(c => classes.includes(c));

    if (foundClass) {
      const parts = foundClass.split('-');
      const value = parseInt(parts[parts.length - 1], 10);
      return isNaN(value) ? BREAKPOINTS.MD : value;
    }

    return BREAKPOINTS.MD;
  };
  Drupal.solo.getMyBreakpoints = getMyBreakpoints;

  /**
   * Gets the Solo page wrapper when the current response includes one.
   *
   * Ajax/modal responses can attach Solo libraries without rendering the full
   * page template, so the wrapper is optional in those contexts.
   *
   * @returns {HTMLElement|null} The page wrapper element.
   */
  const getPageWrapper = () => document.querySelector(SELECTORS.PAGE_WRAPPER);

  /**
   * Get breakpoint number based on the specified class and breakpoint prefix.
   * @param {string} [breakpointPrefix='mn'] - The prefix for the breakpoint.
   * @returns {number} The numeric breakpoint value.
   */
  Drupal.solo.getBreakpointNumber = (breakpointPrefix = 'mn') => {
    return Drupal.solo.getMyBreakpoints(getPageWrapper(), breakpointPrefix);
  };

  /**
   * Determines the current layout based on breakpoints.
   * @returns {string} 'large' if layout is large, 'small' otherwise.
   */
  const getLayout = () => {
    const pageClass = getPageWrapper();
    if (!pageClass) {
      return 'small';
    }

    const brNum = Drupal.solo.getMyBreakpoints(pageClass, 'mn');
    const currentWidth = getCurrentWidth();

    return currentWidth > brNum ? 'large' : 'small';
  };
  Drupal.solo.getLayout = getLayout;

  /**
   * Drupal behavior to add classes based on menu depth.
   */
  Drupal.behaviors.soloMenuDepth = {
    attach: (context, settings) => {
      try {
        // Option 1: Use the :not() selector (default)
        const allMenus = once('soloMenuDepth', SELECTORS.SOLO_MENUS_ALL, context);
        const menus = allMenus.filter((menu) => !menu.closest('.field'));

        menus.forEach((element) => {
          const depth = calculateDepth(element);
          addClassAccordingToDepth(element, depth);
        });
      } catch (error) {
        console.error('Solo: Error in soloMenuDepth behavior', error);
      }
    },
    detach: (context, settings, trigger) => {
      if (trigger === 'unload') {
        try {
          const allProcessed = once.filter('soloMenuDepth', SELECTORS.SOLO_MENUS_ALL, context);
          const processedMenus = allProcessed.filter((menu) => !menu.closest('.field'));

          processedMenus.forEach((element) => {
            Array.from(element.classList).forEach((cn) => {
              if (/^ul-\d+$/.test(cn)) element.classList.remove(cn);
            });
            Array.from(element.children).forEach((child) => {
              if (child instanceof HTMLElement) {
                Array.from(child.classList).forEach((cn) => {
                  if (/^li-\d+$/.test(cn)) child.classList.remove(cn);
                });
              }
            });
          });

          once.remove('soloMenuDepth', SELECTORS.SOLO_MENUS_ALL, context);
        } catch (error) {
          console.error('Solo: Error in soloMenuDepth detach', error);
        }
      }
    }

  };

  /**
   * Drupal behavior for file upload enhancement.
   */
  Drupal.behaviors.soloFileUpload = {
    handlers: new WeakMap(),

    attach(context) {
      try {
        const wrappers = once('solo-file-upload', SELECTORS.FILE_UPLOAD_WRAPPER, context);

        wrappers.forEach(wrapper => {
          const input = wrapper.querySelector(SELECTORS.FILE_INPUT);
          const fileName = wrapper.querySelector(SELECTORS.FILE_NAME);

          if (!input || !fileName) {
            console.warn('Solo: File upload elements not found in wrapper');
            return;
          }

          const handler = (event) => {
            try {
              if (input.files && input.files.length > 0) {
                const file = input.files[0];
                fileName.textContent = file.name;
                // Announce file selection to screen readers
                Drupal.announce(Drupal.t('File selected: @filename', {'@filename': file.name}));
              } else {
                fileName.textContent = Drupal.t('No file chosen');
              }
            } catch (error) {
              console.error('Solo: Error handling file selection', error);
              fileName.textContent = Drupal.t('Error selecting file');
            }
          };

          // Store handler reference for cleanup
          this.handlers.set(input, handler);
          input.addEventListener('change', handler);
        });
      } catch (error) {
        console.error('Solo: Error in soloFileUpload behavior', error);
      }
    },

    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        try {
          const wrappers = once.filter('solo-file-upload', SELECTORS.FILE_UPLOAD_WRAPPER, context);

          wrappers.forEach(wrapper => {
            const input = wrapper.querySelector(SELECTORS.FILE_INPUT);
            if (input) {
              const handler = this.handlers.get(input);
              if (handler) {
                input.removeEventListener('change', handler);
                this.handlers.delete(input);
              }
            }
          });

          once.remove('solo-file-upload', SELECTORS.FILE_UPLOAD_WRAPPER, context);
        } catch (error) {
          console.error('Solo: Error in soloFileUpload detach', error);
        }
      }
    }
  };

  /**
   * Drupal behavior for search form animation.
   */
  Drupal.behaviors.soloSearchAnimation = {
    handlers: new WeakMap(),

    attach: (context, settings) => {
      const behavior = Drupal.behaviors.soloSearchAnimation; // capture

      try {
        const detailsElements = once('soloDetailsAnimation', SELECTORS.SEARCH_DETAILS, context);
        detailsElements?.forEach((detail) => {
          const wrapper = detail.querySelector(SELECTORS.DETAILS_WRAPPER);
          if (!wrapper) {
            console.warn('Solo: Details wrapper not found');
            return;
          }

          // Always ensure transition is defined (whether open or closed initially)
          wrapper.style.transition = 'height 0.3s ease-in-out, opacity 0.3s ease-in-out';

          // Initial state
          if (!detail.open) {
            wrapper.style.height = '0';
            wrapper.style.opacity = '0';
            wrapper.style.overflow = 'hidden';
          } else {
            // Ensure we don't end up with "auto" + no transition on first toggle.
            wrapper.style.overflow = 'hidden';
            wrapper.style.height = 'auto';
            wrapper.style.opacity = '1';
          }

          const transitionEndHandler = (event) => {
            if (event.target === wrapper && detail.open) {
              wrapper.style.height = 'auto';
            }
          };

          const toggleHandler = () => {
            try {
              if (detail.open) {
                const contentHeight = wrapper.scrollHeight + 'px';
                // From 0 -> actual height
                wrapper.style.height = contentHeight;
                wrapper.style.opacity = '1';
                // Defer announcement to avoid timing conflicts
                setTimeout(() => {
                  Drupal.announce(Drupal.t('Search options expanded'));
                }, 100);
                wrapper.addEventListener('transitionend', transitionEndHandler, { once: true });
              } else {
                // From current height -> 0
                wrapper.style.height = wrapper.scrollHeight + 'px';
                requestAnimationFrame(() => {
                  wrapper.style.height = '0';
                  wrapper.style.opacity = '0';
                });
                // Defer announcement to avoid timing conflicts
                setTimeout(() => {
                  Drupal.announce(Drupal.t('Search options collapsed'));
                }, 100);
              }
            } catch (error) {
              console.error('Solo: Error in search animation', error);
            }
          };

          // Store handlers for cleanup
          behavior.handlers.set(detail, { toggleHandler, transitionEndHandler });
          detail.addEventListener('toggle', toggleHandler);
        });
      } catch (error) {
        console.error('Solo: Error in soloSearchAnimation behavior', error);
      }
    },

    detach: (context, settings, trigger) => {
      if (trigger === 'unload') {
        const behavior = Drupal.behaviors.soloSearchAnimation;

        try {
          const detailsElements = once.filter('soloDetailsAnimation', SELECTORS.SEARCH_DETAILS, context);
          detailsElements?.forEach((detail) => {
            const handlers = behavior.handlers.get(detail);
            if (handlers) {
              detail.removeEventListener('toggle', handlers.toggleHandler);
              const wrapper = detail.querySelector(SELECTORS.DETAILS_WRAPPER);
              if (wrapper) {
                wrapper.removeEventListener('transitionend', handlers.transitionEndHandler);
              }
              behavior.handlers.delete(detail);
            }
          });
          once.remove('soloDetailsAnimation', SELECTORS.SEARCH_DETAILS, context);
        } catch (error) {
          console.error('Solo: Error in soloSearchAnimation detach', error);
        }
      }
    }
  };

  // Cleanup function for module unload
  if (typeof Drupal.solo.cleanup === 'undefined') {
    Drupal.solo.cleanup = () => {
      // Clear all active animations
      activeAnimations.forEach((timeoutId, element) => {
        clearTimeout(timeoutId);
      });
      activeAnimations.clear();
    };
  }

})(Drupal, drupalSettings, once);
