/**
 * @file
 * Solo Menu Side - Refactored with State Manager
 *
 * Filename:     solo-menu-side.js
 * Website:      https://www.flashwebcenter.com
 * Developer:    Alaa Haddad https://www.alaahaddad.com.
 */
((Drupal, drupalSettings, once) => {
  'use strict';

  // Component name for state manager
  const COMPONENT_NAME = 'sidebar';
  let focusVisibleHandlers = [];


  // Initialize Drupal.solo if it doesn't exist
  Drupal.solo = Drupal.solo || {};

  // Register component with state manager
  if (Drupal.solo.menuState) {
    Drupal.solo.menuState.registerComponent(COMPONENT_NAME, {
      name: 'Solo Sidebar Menu',
      version: '1.0'
    });
  }

  // Focus-visible polyfill support
  const initFocusVisible = () => {
    // Check if browser supports :focus-visible
    try {
      document.querySelector(':focus-visible');
    } catch (e) {
      // Add focus-visible class management
      let hadKeyboardEvent = true;
      const keyboardEvents = ['keydown', 'keyup'];
      const pointerEvents = ['mousedown', 'mouseup', 'touchstart', 'touchend'];

      // Create named handlers for cleanup
      const keyHandler = () => { hadKeyboardEvent = true; };
      const pointerHandler = () => { hadKeyboardEvent = false; };
      const focusHandler = (e) => {
        if (hadKeyboardEvent || e.target.matches(':focus-visible')) {
          e.target.classList.add('focus-visible');
        }
      };
      const blurHandler = (e) => {
        e.target.classList.remove('focus-visible');
      };

      // Track keyboard vs pointer interaction
      keyboardEvents.forEach(event => {
        document.addEventListener(event, keyHandler, true);
        focusVisibleHandlers.push({ event, handler: keyHandler, capture: true });
      });

      pointerEvents.forEach(event => {
        document.addEventListener(event, pointerHandler, true);
        focusVisibleHandlers.push({ event, handler: pointerHandler, capture: true });
      });

      // Add/remove focus-visible class
      document.addEventListener('focus', focusHandler, true);
      focusVisibleHandlers.push({ event: 'focus', handler: focusHandler, capture: true });

      document.addEventListener('blur', blurHandler, true);
      focusVisibleHandlers.push({ event: 'blur', handler: blurHandler, capture: true });
    }
  };

  // Namespaced event listener management
  const eventManager = {
    listeners: new Map(),

    on(element, eventType, namespace, handler) {
      const key = `${eventType}.${namespace}`;
      if (!this.listeners.has(element)) {
        this.listeners.set(element, new Map());
      }

      const elementListeners = this.listeners.get(element);
      if (elementListeners.has(key)) {
        this.off(element, eventType, namespace);
      }

      elementListeners.set(key, handler);
      element.addEventListener(eventType, handler);
    },

    off(element, eventType, namespace) {
      const key = `${eventType}.${namespace}`;
      const elementListeners = this.listeners.get(element);

      if (elementListeners && elementListeners.has(key)) {
        const handler = elementListeners.get(key);
        element.removeEventListener(eventType, handler);
        elementListeners.delete(key);

        if (elementListeners.size === 0) {
          this.listeners.delete(element);
        }
      }
    },

    offAll(element, namespace = null) {
      const elementListeners = this.listeners.get(element);
      if (!elementListeners) return;

      elementListeners.forEach((handler, key) => {
        if (!namespace || key.endsWith(`.${namespace}`)) {
          const [eventType] = key.split('.');
          element.removeEventListener(eventType, handler);
          elementListeners.delete(key);
        }
      });

      if (elementListeners.size === 0) {
        this.listeners.delete(element);
      }
    }
  };

  // Initialize focus-visible on page load
  initFocusVisible();

  // Get the primary sidebar menu and all the sidebar hamburger icons
  const verticalNav = document.getElementById('primary-sidebar-menu');
  if (verticalNav) {
    // Validate the element has a proper ID
    if (!verticalNav.id) {
      console.warn('Solo Menu Side: Sidebar menu missing ID attribute');
      return;
    }
    const openDuration = Drupal.solo.animations.slideDown || 400;
    const closeDuration = Drupal.solo.animations.slideUp || 350;
    const closeBtns = document.querySelectorAll('.sidebar-button-close>button');
    const openBtns = document.querySelectorAll('.sidebar-button-open>button');
    const firstLevelSelector = '#primary-sidebar-menu .nav__menubar-item > a, #primary-sidebar-menu .nav__menubar-item > button';

    // Cache for focusable elements
    let cachedFocusableElements = null;
    let lastFocusedElement = null;

    // Function to update the focusable elements cache
    const updateFocusableElementsCache = () => {
      cachedFocusableElements = Array.from(verticalNav.querySelectorAll(firstLevelSelector))
        .filter(el => el.getAttribute('tabindex') === '0');

      // Add close buttons to focusable elements
      closeBtns.forEach(button => {
        if (button.getAttribute('tabindex') === '0') {
          cachedFocusableElements.push(button);
        }
      });
    };

    // Function to add a click event listener to specified elements
    const sideMenubarCloseOpen = (buttons, callback, context) => {
      buttons.forEach(button => {
        if (button && context.contains(button)) {
          // Use once to prevent duplicate listeners
          once('solo-sidebar-button', button).forEach(() => {
            eventManager.on(button, 'click', 'solo.sidebar', callback);
          });
        }
      });
    };

    // Function to toggle aria-expanded on the hamburger icons using state manager
    const setAriaExpanded = (elements, value) => {
      // Handle both single elements and NodeLists
      if (elements instanceof NodeList || Array.isArray(elements)) {
        elements.forEach(el => {
          if (el && el instanceof HTMLElement) {
            Drupal.solo.menuState.setExpanded(el, value === 'true', COMPONENT_NAME);
          }
        });
      } else if (elements && elements instanceof HTMLElement) {
        Drupal.solo.menuState.setExpanded(elements, value === 'true', COMPONENT_NAME);
      }
    };

    // Function to toggle aria-hidden on the vertical navigation using state manager
    const setAriaHidden = (el, value) => {
      if (!el || !(el instanceof HTMLElement)) return;

      // IMPORTANT: Don't set aria-hidden on parent if it contains focusable buttons
      // Instead, set it only on the menubar content, not the wrapper
      const menubar = el.querySelector('.navigation__sidebar, .nav__menubar');
      if (menubar) {
        Drupal.solo.menuState.setHidden(menubar, value === 'true', COMPONENT_NAME);
      } else {
        // Fallback to setting on element itself
        Drupal.solo.menuState.setHidden(el, value === 'true', COMPONENT_NAME);
      }
    };

    // Function to focus the first interactive element in the vertical navigation
    const focusFirstInteractiveElement = () => {
      const firstInteractiveElement = verticalNav.querySelector(firstLevelSelector);
      if (firstInteractiveElement) {
        firstInteractiveElement.focus();
      }
    };

    // Function to update tabindex of first level menu items using state manager
    const updateTabindex = (isOpen) => {
      Drupal.solo.menuState.updateMenuTabindex(verticalNav, isOpen, COMPONENT_NAME);

      closeBtns.forEach(button => {
        Drupal.solo.menuState.setTabindex(button, isOpen ? '0' : '-1', COMPONENT_NAME);
      });

      // Clear cache when tabindex changes
      cachedFocusableElements = null;
    };

    // Function to trap focus within the sidebar
    const trapFocus = (event) => {
      // Check both key and code for better support
      const isTab = event.key === 'Tab' || event.code === 'Tab';
      const isEscape = event.key === 'Escape' || event.code === 'Escape' || event.keyCode === 27;

      // Only process Tab and Escape keys
      if (!isTab && !isEscape) return;

      // Handle Escape key
      if (isEscape) {
        event.preventDefault();
        sideMenubarToggleNav(false);
        // Return focus to the element that opened the sidebar
        if (lastFocusedElement && document.contains(lastFocusedElement)) {
          lastFocusedElement.focus();
        }
        return;
      }

      // Handle Tab key
      if (isTab) {
        // Update cache if needed
        if (!cachedFocusableElements) {
          updateFocusableElementsCache();
        }

        const currentIndex = cachedFocusableElements.indexOf(document.activeElement);
        let nextIndex;

        if (event.shiftKey) { // Shift + Tab
          nextIndex = currentIndex > 0 ? currentIndex - 1 : cachedFocusableElements.length - 1;
        } else { // Tab
          nextIndex = currentIndex < cachedFocusableElements.length - 1 ? currentIndex + 1 : 0;
        }

        event.preventDefault();
        if (cachedFocusableElements[nextIndex]) {
          cachedFocusableElements[nextIndex].focus();
        }
      }
    };

    const outsideClickListener = (event) => {
      // Check if click is outside the sidebar and not on open button
      if (verticalNav && !verticalNav.contains(event.target) && !event.target.closest('.sidebar-button-open')) {
        sideMenubarToggleNav(false);
      }
    };

    const sideMenubarToggleNav = (isOpen) => {
      // Set duration based on open or close
      const duration = isOpen
        ? Drupal.solo.animations.slideDown
        : Drupal.solo.animations.slideUp;

      verticalNav.style.setProperty('--solo-sidebar-speed', `${duration}ms`);

      // Set aria-expanded for buttons (iterate through NodeLists)
      closeBtns.forEach(btn => {
        if (btn && btn instanceof HTMLElement) {
          Drupal.solo.menuState.setExpanded(btn, isOpen, COMPONENT_NAME);
        }
      });

      openBtns.forEach(btn => {
        if (btn && btn instanceof HTMLElement) {
          Drupal.solo.menuState.setExpanded(btn, isOpen, COMPONENT_NAME);
        }
      });

      // Update tabindex for first level menu items and close buttons
      updateTabindex(isOpen);

      // Toggle the class for the vertical navigation using state manager if available
      if (isOpen) {
        // Store the element that triggered opening
        lastFocusedElement = document.activeElement;

        // Remove aria-hidden BEFORE opening (so focus can move inside)
        Drupal.solo.menuState.setHidden(verticalNav, false, COMPONENT_NAME);

        // Use inert attribute if available for better browser support
        Drupal.solo.setInert(verticalNav, false);

        if (Drupal.solo.menuState) {
          Drupal.solo.menuState.coordinateMenuOperation('open', verticalNav, COMPONENT_NAME);
        } else {
          verticalNav.classList.add('toggled');
        }

        // Focus the first interactive element after opening the sidebar
        focusFirstInteractiveElement();

        // Add namespaced event listeners only when opening
        eventManager.on(document, 'keydown', 'solo.sidebar.focus', trapFocus);
        eventManager.on(document, 'click', 'solo.sidebar.outside', outsideClickListener);
      } else {
        // CRITICAL: Remove focus from any element inside sidebar BEFORE hiding
        if (verticalNav.contains(document.activeElement)) {
          document.activeElement.blur();

          // Return focus to the element that opened the sidebar
          if (lastFocusedElement && document.contains(lastFocusedElement)) {
            lastFocusedElement.focus();
          }
        }

        if (Drupal.solo.menuState) {
          Drupal.solo.menuState.coordinateMenuOperation('close', verticalNav, COMPONENT_NAME);
        } else {
          verticalNav.classList.remove('toggled');
        }

        const subMenus = verticalNav.querySelectorAll('.navigation__sidebar li ul.sub__menu');
        subMenus?.forEach(subMenu => Drupal.solo.hideSubMenus(subMenu, COMPONENT_NAME));

        // Remove namespaced event listeners when closing
        eventManager.off(document, 'keydown', 'solo.sidebar.focus');
        eventManager.off(document, 'click', 'solo.sidebar.outside');

        // Clear cache
        cachedFocusableElements = null;

        // CRITICAL: Set aria-hidden AFTER removing focus
        // This prevents the "Blocked aria-hidden" warning
        Drupal.solo.menuState.setHidden(verticalNav, true, COMPONENT_NAME);

        // Use inert attribute if available for better browser support
        Drupal.solo.setInert(verticalNav, true);
      }
    };
    Drupal.solo.sideMenubarToggleNav = sideMenubarToggleNav;

    // Legacy function for backward compatibility
    function addOutsideClickListener(enable) {
      if (enable === true && verticalNav.classList.contains('toggled')) {
        eventManager.on(document, 'click', 'solo.sidebar.outside', outsideClickListener);
      } else {
        eventManager.off(document, 'click', 'solo.sidebar.outside');
      }
    }

    // Expose the function to the Drupal namespace
    Drupal.solo.addOutsideClickListener = addOutsideClickListener;

    Drupal.behaviors.soloPrimarySideMenu = {
      attach: function (context, settings) {
        // Only initialize once per context
        once('solo-sidebar-init', '#primary-sidebar-menu', context).forEach(() => {
          // Close nav button event
          sideMenubarCloseOpen(closeBtns, () => sideMenubarToggleNav(false), context);

          // Open nav button event
          sideMenubarCloseOpen(openBtns, () => sideMenubarToggleNav(true), context);

          // Ensure the tabindex is always set correctly on load
          if (verticalNav.classList.contains('toggled')) {
            updateTabindex(true);
            // If already open on load, add the event listeners
            eventManager.on(document, 'keydown', 'solo.sidebar.focus', trapFocus);
            eventManager.on(document, 'click', 'solo.sidebar.outside', outsideClickListener);
          } else {
            updateTabindex(false);
          }
        });
      },

      detach: function (context, settings, trigger) {
        // Clean up event listeners when unloading
        if (trigger === 'unload') {
          // Remove all namespaced event listeners
          eventManager.off(document, 'click', 'solo.sidebar.outside');
          eventManager.off(document, 'keydown', 'solo.sidebar.focus');

          // Clean up button event listeners
          const buttons = context.querySelectorAll('.sidebar-button-close>button, .sidebar-button-open>button');
          buttons.forEach(button => {
            eventManager.offAll(button, 'solo.sidebar');
          });

          // Add this new cleanup:
          focusVisibleHandlers.forEach(({ event, handler, capture }) => {
            document.removeEventListener(event, handler, capture);
          });
          focusVisibleHandlers = [];

          // Clear cache
          cachedFocusableElements = null;
          lastFocusedElement = null;

          // Unregister from state manager
          if (Drupal.solo.menuState) {
            Drupal.solo.menuState.unregisterComponent(COMPONENT_NAME);
          }
        }
      }
    };

  }
})(Drupal, drupalSettings, once);
