/**
 * @file
 * Solo Menu State Manager - Centralized state and conflict resolution
 *
 * This module provides centralized state management and coordination
 * between different Solo menu components to prevent conflicts.
 */
((Drupal, drupalSettings) => {
  'use strict';

  // Initialize Solo namespace if not exists
  Drupal.solo = Drupal.solo || {};

  // Add early JavaScript detection class
  // This runs immediately when the state manager loads
  try {
    if (document.documentElement) {
      document.documentElement.classList.add('solo-state-manager-loaded');
      document.documentElement.classList.remove('no-js');
    }
  } catch (e) {
    console.error('Solo Menu: Could not set state manager class', e);
  }

  /**
   * Centralized State Manager for Solo Menus
   */
  Drupal.solo.menuState = {
    // Track active components
    activeComponents: new Set(),

    // Track resize handlers
    resizeHandlers: new Map(),
    resizeTimeout: null,
    resizeObserver: null,

    // Track ARIA states - Use WeakMap for automatic cleanup when elements are removed
    ariaStates: new WeakMap(),
    ariaStateKeys: new Map(), // Track keys for validation

    // Track tabindex states - Use WeakMap for automatic cleanup
    tabindexStates: new WeakMap(),
    tabindexStateKeys: new Map(), // Track keys for validation

    activeOperations: new Map(),

    // Screen size cache
    screenSize: {
      width: 0,
      breakpoint: null,
      isSmallScreen: false
    },

    /**
     * Safe execution wrapper with error handling
     */
    safeExecute(operation, context = 'Unknown', fallback = null) {
      try {
        return operation();
      } catch (error) {
        console.error(`Solo Menu Error [${context}]:`, error);
        if (drupalSettings?.solo?.debug) {
          console.trace();
        }
        return fallback;
      }
    },

    /**
     * Safe selector builder with CSS.escape
     */
    buildSafeSelector(id, additionalSelector = '') {
      if (!id) {
        console.warn('Solo Menu: Empty ID provided to buildSafeSelector');
        return null;
      }

      const escapedId = Drupal.solo.escapeSelector(id);
      if (!escapedId) {
        console.error('Solo Menu: Invalid ID for selector', id);
        return null;
      }

      return `#${escapedId}${additionalSelector}`;
    },

    /**
     * Register a component
     */
    registerComponent(componentName, component) {
      this.activeComponents.add(componentName);
      if (drupalSettings?.solo?.debug) {
        console.log(`Solo Menu: Registered component ${componentName}`);
      }
    },

    /**
     * Unregister a component
     */
    unregisterComponent(componentName) {
      this.activeComponents.delete(componentName);
      this.resizeHandlers.delete(componentName);

      if (drupalSettings?.solo?.debug) {
        console.log(`Solo Menu: Unregistered component ${componentName}`);
      }
    },

    /**
     * Get current width (single source of truth)
     */
    getCurrentWidth() {
      return window.innerWidth ||
             document.documentElement.clientWidth ||
             document.body.clientWidth ||
             0;
    },

    /**
     * Update screen size cache
     */
    updateScreenSize() {
      const pageWrapper = document.querySelector('.page-wrapper');
      if (!pageWrapper) return;

      this.screenSize.width = this.getCurrentWidth();
      this.screenSize.breakpoint = Drupal.solo.getMyBreakpoints(pageWrapper, 'mn');
      this.screenSize.isSmallScreen = this.screenSize.width <= this.screenSize.breakpoint;
    },

    /**
     * Initialize ResizeObserver for more efficient resize detection
     * Falls back to window resize events if not supported
     */
    initResizeObserver() {
      // Check if ResizeObserver is available
      if (typeof ResizeObserver === 'undefined') {
        if (drupalSettings?.solo?.debug) {
          console.debug('Solo Menu: ResizeObserver not available, using window resize events');
        }
        return false;
      }

      const pageWrapper = document.querySelector('.page-wrapper, body');
      if (!pageWrapper) {
        if (drupalSettings?.solo?.debug) {
          console.debug('Solo Menu: No page wrapper found for ResizeObserver');
        }
        return false;
      }

      // Create ResizeObserver
      this.resizeObserver = new ResizeObserver(entries => {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.updateScreenSize();

          // Call all registered handlers
          this.resizeHandlers.forEach(({ handler }) => {
            try {
              handler(this.screenSize);
            } catch (error) {
              console.error('Solo Menu: Error in ResizeObserver handler', error);
            }
          });
        }, 150);
      });

      // Start observing
      this.resizeObserver.observe(pageWrapper);

      if (drupalSettings?.solo?.debug) {
        console.log('Solo Menu: ResizeObserver initialized successfully');
      }

      return true;
    },

    /**
     * Add resize handler with deduplication
     * Uses ResizeObserver if available, falls back to window resize events
     */
    addResizeHandler(componentName, handler, delay = 250) {
      this.resizeHandlers.set(componentName, { handler, delay });

      // Try to use ResizeObserver first (more efficient)
      if (!this.resizeObserver) {
        const observerInitialized = this.initResizeObserver();

        // If ResizeObserver initialized successfully, we're done
        if (observerInitialized) {
          return;
        }
      }

      // Fallback: Use traditional window resize events
      // Remove existing global handler
      if (this.globalResizeHandler) {
        window.removeEventListener('resize', this.globalResizeHandler);
      }

      // Create new debounced global handler
      this.globalResizeHandler = () => {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.updateScreenSize();

          // Call all registered handlers
          this.resizeHandlers.forEach(({ handler }) => {
            try {
              handler(this.screenSize);
            } catch (error) {
              console.error('Solo Menu: Error in resize handler', error);
            }
          });
        }, Math.max(...Array.from(this.resizeHandlers.values()).map(h => h.delay)));
      };

      window.addEventListener('resize', this.globalResizeHandler);
    },

    /**
     * Set ARIA attribute with conflict resolution
     * Uses WeakMap for automatic cleanup when elements are removed from DOM
     */
    setAriaAttribute(element, attribute, value, componentName) {
      if (!element || !(element instanceof HTMLElement)) {
        if (drupalSettings?.solo?.debug) {
          console.warn('Solo Menu: Invalid element in setAriaAttribute', { attribute, componentName });
        }
        return;
      }

      // Get or create state object for this element
      let elementStates = this.ariaStates.get(element);
      if (!elementStates) {
        elementStates = {};
        this.ariaStates.set(element, elementStates);
      }

      const currentOwner = elementStates[attribute];

      // Log conflicts for debugging (only in dev mode)
      if (currentOwner && currentOwner !== componentName && drupalSettings?.solo?.debug) {
        console.debug(`Solo Menu: ARIA conflict - ${attribute} on element, current: ${currentOwner}, new: ${componentName}`);
      }

      // Set the attribute and track ownership
      element.setAttribute(attribute, value);
      elementStates[attribute] = componentName;

      // Track for validation (using unique key)
      const key = `${attribute}_${element.id || 'elem_' + Date.now() + '_' + Math.random()}`;
      this.ariaStateKeys.set(key, {
        element,
        attribute,
        component: componentName,
        timestamp: Date.now()
      });

      // Notify other components of the change
      this.notifyAriaChange(element, attribute, value, componentName);
    },

    /**
     * Simplified ARIA expanded helper
     */
    setExpanded(element, isExpanded, componentName = 'unknown') {
      this.setAriaAttribute(element, 'aria-expanded', isExpanded ? 'true' : 'false', componentName);
    },

    /**
     * Simplified ARIA hidden helper
     */
    setHidden(element, isHidden, componentName = 'unknown') {
      this.setAriaAttribute(element, 'aria-hidden', isHidden ? 'true' : 'false', componentName);
    },

    /**
     * Set tabindex with conflict resolution
     * Uses WeakMap for automatic cleanup
     */
    setTabindex(element, value, componentName) {
      if (!element || !(element instanceof HTMLElement)) {
        if (drupalSettings?.solo?.debug) {
          console.warn('Solo Menu: Invalid element in setTabindex', { componentName });
        }
        return;
      }

      // Get or create state object for this element
      let elementState = this.tabindexStates.get(element);

      // Priority rules
      const priorities = {
        'keyboard': 3,  // Keyboard navigation has highest priority
        'mobile': 2,
        'sidebar': 2,
        'default': 1
      };

      const newPriority = priorities[componentName] || 1;

      if (elementState) {
        const currentPriority = priorities[elementState.component] || 1;

        // Only update if new component has equal or higher priority
        if (newPriority < currentPriority) {
          if (drupalSettings?.solo?.debug) {
            console.debug(`Solo Menu: Tabindex blocked - current priority ${currentPriority} (${elementState.component}) > new ${newPriority} (${componentName})`);
          }
          return;
        }
      }

      // Set tabindex and track state
      element.setAttribute('tabindex', value);
      this.tabindexStates.set(element, {
        component: componentName,
        value: value,
        timestamp: Date.now()
      });

      // Track for validation
      const key = element.id || `elem_${Date.now()}_${Math.random()}`;
      this.tabindexStateKeys.set(key, {
        element,
        component: componentName,
        timestamp: Date.now()
      });
    },

    /**
     * Unified menu tabindex helper
     */
    updateMenuTabindex(container, isOpen, componentName = 'unknown') {
      if (!container) return;

      const items = container.querySelectorAll(':scope > li > a, :scope > li > button');
      items.forEach(item => {
        this.setTabindex(item, isOpen ? '0' : '-1', componentName);
      });
    },

    /**
     * Unified hide submenu helper
     */
    hideSubmenu(subMenu, componentName = 'unknown') {
      if (!subMenu) return;

      Drupal.solo.slideUp(subMenu, Drupal.solo.animations.slideUp, componentName);
      this.setHidden(subMenu, true, componentName);

      const toggler = subMenu.previousElementSibling;
      if (toggler?.classList.contains('dropdown-toggler')) {
        this.setExpanded(toggler, false, componentName);
      }
    },

    /**
     * Notify components of ARIA changes
     */
    notifyAriaChange(element, attribute, value, changedBy) {
      // Dispatch custom event for other components to listen to
      element.dispatchEvent(new CustomEvent('solo-aria-change', {
        detail: { attribute, value, changedBy },
        bubbles: true
      }));
    },

    /**
     * Get consistent menu state
     */
    getMenuState(menuElement) {
      const isOpen = menuElement.classList.contains('toggled');
      const ariaExpanded = menuElement.getAttribute('aria-expanded') === 'true';
      const ariaHidden = menuElement.getAttribute('aria-hidden') === 'false';

      // Resolve conflicts - classList.toggled is source of truth
      if (isOpen !== ariaExpanded || isOpen === ariaHidden) {
        if (drupalSettings?.solo?.debug) {
          console.debug('Solo Menu: Resolving state conflict for', menuElement);
        }
        this.setAriaAttribute(menuElement, 'aria-expanded', isOpen ? 'true' : 'false', 'state-resolver');
        this.setAriaAttribute(menuElement, 'aria-hidden', isOpen ? 'false' : 'true', 'state-resolver');
      }

      return { isOpen, ariaExpanded: isOpen, ariaHidden: !isOpen };
    },

    shouldProceedWithOperation(menuElement, componentName, operation) {
      const menuId = menuElement.id || menuElement.className;
      const activeOp = this.activeOperations.get(menuId);

      if (!activeOp) return true;

      // Priority rules (keyboard has highest priority when enabled)
      const priorities = {
        'keyboard': 4,
        'mobile': 3,
        'sidebar': 2,
        'scripts': 1,
        'main': 1,
        'repositions': 1
      };

      const currentPriority = priorities[activeOp.component] || 1;
      const newPriority = priorities[componentName] || 1;

      // Higher priority can interrupt, equal priority must wait
      return newPriority > currentPriority;
    },

    /**
     * Coordinate menu operations
     */
    coordinateMenuOperation(operation, menuElement, componentName) {
      if (!this.shouldProceedWithOperation(menuElement, componentName, operation)) {
        if (drupalSettings?.solo?.debug) {
          console.debug(`Solo Menu: Operation ${operation} blocked for ${componentName}`);
        }
        return; // Skip operation if lower priority
      }

      const menuId = menuElement.id || menuElement.className;
      this.activeOperations.set(menuId, {
        component: componentName,
        operation: operation,
        timestamp: Date.now()
      });

      const operations = {
        'open': () => {
          menuElement.classList.add('toggled');
          this.setAriaAttribute(menuElement, 'aria-expanded', 'true', componentName);
          this.setAriaAttribute(menuElement, 'aria-hidden', 'false', componentName);
        },
        'close': () => {
          menuElement.classList.remove('toggled');
          this.setAriaAttribute(menuElement, 'aria-expanded', 'false', componentName);
          this.setAriaAttribute(menuElement, 'aria-hidden', 'true', componentName);
        },
        'toggle': () => {
          const { isOpen } = this.getMenuState(menuElement);
          this.coordinateMenuOperation(isOpen ? 'close' : 'open', menuElement, componentName);
        }
      };

      if (operations[operation]) {
        operations[operation]();
      }

      // Clear operation after completion
      setTimeout(() => {
        const currentOp = this.activeOperations.get(menuId);
        if (currentOp && currentOp.timestamp === this.activeOperations.get(menuId)?.timestamp) {
          this.activeOperations.delete(menuId);
        }
      }, 50);
    },

    /**
     * Validate and repair inconsistent states
     * Cleans up orphaned states and detects conflicts
     */
    validateState() {
      const issues = [];

      // Check ariaStateKeys for orphaned elements
      this.ariaStateKeys.forEach((data, key) => {
        const { element, attribute, component } = data;

        if (!element || !document.contains(element)) {
          issues.push(`Orphaned ARIA state: ${attribute} (component: ${component})`);
          this.ariaStateKeys.delete(key);
        }
      });

      // Check tabindexStateKeys for orphaned elements only
      // Note: We don't check for "stale" tabindex states because tabindex values
      // are persistent and don't expire - they only become invalid when the element
      // is removed from the DOM
      this.tabindexStateKeys.forEach((data, key) => {
        const { element, component } = data;

        if (!element || !document.contains(element)) {
          issues.push(`Orphaned tabindex state (component: ${component})`);
          this.tabindexStateKeys.delete(key);
        }
      });

      // Check for stale active operations
      this.activeOperations.forEach((operation, menuId) => {
        const age = Date.now() - operation.timestamp;

        if (age > 5000) {
          issues.push(`Stale operation: ${operation.operation} on ${menuId} (age: ${Math.round(age / 1000)}s, component: ${operation.component})`);
          this.activeOperations.delete(menuId);
        }
      });

      if (issues.length > 0 && drupalSettings?.solo?.debug) {
        console.warn(`Solo Menu State Validation: ${issues.length} issues found`);
        console.log(issues);
      }

      return issues.length === 0;
    },

    /**
     * Clean up on unload - SAFE version that doesn't access DOM
     */
    cleanup() {
      try {
        // Clear validation interval
        if (this._validationInterval) {
          clearInterval(this._validationInterval);
          this._validationInterval = null;
        }

        // Disconnect ResizeObserver
        if (this.resizeObserver) {
          this.resizeObserver.disconnect();
          this.resizeObserver = null;
        }

        // Remove window resize handler
        if (this.globalResizeHandler) {
          window.removeEventListener('resize', this.globalResizeHandler);
          this.globalResizeHandler = null;
        }

        // Clear timeout
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
          this.resizeTimeout = null;
        }

        // Clear all collections (no DOM access)
        this.resizeHandlers.clear();
        this.ariaStateKeys.clear();
        this.tabindexStateKeys.clear();
        this.activeComponents.clear();
        this.activeOperations.clear();

        // WeakMaps auto-cleanup, but we can reset them
        this.ariaStates = new WeakMap();
        this.tabindexStates = new WeakMap();

      } catch (error) {
        // Silently fail during unload - DOM might be partially destroyed
      }
    }
  };

  // Initialize screen size
  Drupal.solo.menuState.updateScreenSize();

  // Expose utility functions through state manager for consistency
  Drupal.solo.getCurrentWidth = () => Drupal.solo.menuState.getCurrentWidth();

  // Override potentially conflicting functions
  const originalHideSubMenus = Drupal.solo.hideSubMenus;
  Drupal.solo.hideSubMenus = (submenu, componentName = 'unknown') => {
    if (originalHideSubMenus) {
      originalHideSubMenus(submenu);
    }
    Drupal.solo.menuState.coordinateMenuOperation('close', submenu, componentName);
  };

  // Listen for Drupal behaviors detach
  if (window.addEventListener) {
    window.addEventListener('beforeunload', () => {
      // Don't validate during unload - just cleanup
      Drupal.solo.menuState.cleanup();
    });

    // Also cleanup on pagehide (for bfcache)
    window.addEventListener('pagehide', () => {
      Drupal.solo.menuState.cleanup();
    });
  }

  // Periodic state validation in debug mode
  if (drupalSettings?.solo?.debug) {
    // Run validation every 30 seconds in debug mode
    Drupal.solo.menuState._validationInterval = setInterval(() => {
      const isValid = Drupal.solo.menuState.validateState();
      if (!isValid && drupalSettings?.solo?.debug) {
        console.log('Solo Menu: State validation completed with issues (see warnings above)');
      }
    }, 30000);

    // Expose validation function for manual testing
    window.soloValidateState = () => {
      console.log('Running Solo Menu state validation...');
      const isValid = Drupal.solo.menuState.validateState();
      if (isValid) {
        console.log('✓ All states are valid');
      } else {
        console.log('✗ Issues found (see warnings above)');
      }
      return isValid;
    };

    console.log('Solo Menu: State validation enabled. Run soloValidateState() in console to check manually.');
  }

})(Drupal, drupalSettings);
