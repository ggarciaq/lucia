/**
 * @file
 * Solo Menu Mobile - Refactored with State Manager
 *
 * Filename:     solo-menu-mobile.js
 * Website:      https://www.flashwebcenter.com
 * Developer:    Alaa Haddad https://www.alaahaddad.com.
 */
((Drupal, drupalSettings, once) => {
  'use strict';

  // Component name for state manager
  const COMPONENT_NAME = 'mobile';

  let currentLayout = Drupal.solo.getLayout();
  let previousLayout = currentLayout;
  const animations = Drupal.solo.animations;

  // Register component with state manager
  if (Drupal.solo.menuState) {
    Drupal.solo.menuState.registerComponent(COMPONENT_NAME, {
      name: 'Solo Mobile Menu',
      version: '1.0'
    });
  }

  const brNum = Drupal.solo.getBreakpointNumber('mn');

  /**
   * Gets the current window width using state manager
   * @returns {number} Current window width
   */
  const getCurrentWidth = () => Drupal.solo.menuState.getCurrentWidth();


  /**
   * Updates tabindex of first-level menu items using state manager
   * @param {HTMLElement} menuElement - The menu element
   * @param {string} tabindexValue - The tabindex value to set
   */
  const updateFirstLevelTabindex = (menuElement, tabindexValue) => {
    if (!menuElement) return;
    const isOpen = tabindexValue === '0';
    Drupal.solo.menuState.updateMenuTabindex(menuElement.querySelector('ul.navigation__responsive'), isOpen, COMPONENT_NAME);
  };

  /**
   * Updates aria-hidden attribute using state manager
   * @param {HTMLElement} menuElement - The menu element
   * @param {string} hiddenValue - The aria-hidden value
   */
  const updateAriaHidden = (menuElement, hiddenValue) => {
    if (!menuElement) return;

    const currentWidth = getCurrentWidth();

    // IMPORTANT: Only set aria-hidden on mobile screens
    // On desktop, the menubar should always be accessible
    if (currentWidth <= brNum) {
      Drupal.solo.menuState.setHidden(menuElement, hiddenValue === 'true', COMPONENT_NAME);
    } else {
      // On desktop, ensure aria-hidden is removed
      Drupal.solo.menuState.setHidden(menuElement, false, COMPONENT_NAME);
    }
  };

  /**
   * Opens the mobile menu with coordinated state
   * @param {string} navTagId - The navigation element ID
   */
  const openMobileMenu = navTagId => {
    const currentWidth = getCurrentWidth();

    // Only proceed if on mobile screen
    if (currentWidth > brNum) {
      return;
    }

    const navigationMenubarClass = Drupal.solo.getNavigationMenubarClass(navTagId);
    const subMenuClasses = Drupal.solo.getSubMenuClasses(navTagId);
    const menuElement = document.getElementById(navTagId);

    subMenuClasses?.forEach((subMenu) => {
      Drupal.solo.hideSubMenus(subMenu, COMPONENT_NAME);
      Drupal.solo.revertIcons(navTagId);
    });

    // Use state manager for coordinated open if available
    if (Drupal.solo.menuState && navigationMenubarClass) {
      Drupal.solo.menuState.coordinateMenuOperation('open', navigationMenubarClass, COMPONENT_NAME);
    }

    // Start animation first
    Drupal.solo.slideDown(navigationMenubarClass, animations.slideDown, 'block', COMPONENT_NAME);

    // Update ARIA AFTER animation starts (next frame)
    requestAnimationFrame(() => {
      if (navigationMenubarClass) {
        Drupal.solo.menuState.setHidden(navigationMenubarClass, false, COMPONENT_NAME);
        Drupal.solo.setInert(navigationMenubarClass, false);
      }

      if (menuElement) {
        updateFirstLevelTabindex(menuElement, '0');
      }
    });
  };

  /**
   * Closes the mobile menu with coordinated state
   * @param {string} navTagId - The navigation element ID
   */
  const closeMobileMenu = navTagId => {
    const currentWidth = getCurrentWidth();

    // Only proceed if on mobile screen
    if (currentWidth > brNum) {
      return;
    }

    const navigationMenubarClass = Drupal.solo.getNavigationMenubarClass(navTagId);
    const subMenuClasses = Drupal.solo.getSubMenuClasses(navTagId);
    const menuElement = document.getElementById(navTagId);

    // CRITICAL: Remove focus from any element inside menu BEFORE hiding
    if (navigationMenubarClass && navigationMenubarClass.contains(document.activeElement)) {
      document.activeElement.blur();

      // Return focus to hamburger button
      const hamburgerButton = document.querySelector('.mobile-nav button');
      if (hamburgerButton && document.contains(hamburgerButton)) {
        hamburgerButton.focus();
      }
    }

    subMenuClasses?.forEach((subMenu) => {
      // Remove focus from submenus too
      if (subMenu.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      Drupal.solo.hideSubMenus(subMenu, COMPONENT_NAME);
      Drupal.solo.revertIcons(navTagId);

      // Set inert if available
      Drupal.solo.setInert(subMenu, true);
    });

    // Use state manager for coordinated close if available
    if (Drupal.solo.menuState && navigationMenubarClass) {
      Drupal.solo.menuState.coordinateMenuOperation('close', navigationMenubarClass, COMPONENT_NAME);
    }

    Drupal.solo.slideUp(navigationMenubarClass, animations.slideDown, COMPONENT_NAME);

    // Set aria-hidden AND inert on menubar ONLY (not on nav)
    if (navigationMenubarClass) {
      Drupal.solo.menuState.setHidden(navigationMenubarClass, true, COMPONENT_NAME);
      Drupal.solo.setInert(navigationMenubarClass, true);
    }

    if (menuElement) {
      // Don't touch nav element - hamburger is inside it!
      updateFirstLevelTabindex(menuElement, '-1');
    }

  };

  /**
   * Gets mobile navigation type information
   * @param {HTMLElement} hamburgerIcon - The hamburger icon element
   * @returns {Array} Array containing [hamburgerIconChild, navTagId, menuElement]
   */
  const getMobileNavType = (hamburgerIcon) => {
    if (!hamburgerIcon || !(hamburgerIcon instanceof HTMLElement)) {
      console.warn('Solo Menu Mobile: Invalid hamburger icon element');
      return [null, null, null];
    }

    const hamburgerIconChild = hamburgerIcon;
    const navElement = hamburgerIcon.closest('nav');

    if (!navElement) {
      console.warn('Solo Menu Mobile: Navigation element not found for hamburger icon');
      return [hamburgerIconChild, null, null];
    }

    const navTagId = navElement.id;

    if (!navTagId) {
      console.warn('Solo Menu Mobile: Navigation element missing ID attribute');
      return [hamburgerIconChild, null, null];
    }

    const menuElement = document.getElementById(navTagId);

    if (!menuElement) {
      console.warn('Solo Menu Mobile: Menu element not found for ID:', navTagId);
    }

    return [hamburgerIconChild, navTagId, menuElement];
  };

  /**
   * Handles hamburger icon click with state coordination
   * @param {HTMLElement} hamburgerIcon - The hamburger icon element
   */
  const hamburgerIconIsClicked = (hamburgerIcon) => {
    if (!hamburgerIcon) {
      console.warn('Solo Menu Mobile: Invalid hamburger icon');
      return;
    }

    const currentWidth = getCurrentWidth();

    // Only allow hamburger interaction on mobile screens
    if (currentWidth > brNum) {
      if (drupalSettings?.solo?.debug) {
        console.debug('Solo Menu Mobile: Hamburger click ignored on desktop');
      }
      return;
    }

    const [hamburgerIconChild, navTagId] = getMobileNavType(hamburgerIcon);

    if (!navTagId) {
      console.warn('Solo Menu Mobile: Could not determine navigation ID');
      return;
    }

    // Safely escape the ID for querySelector
    const escapedNavId = Drupal.solo.escapeSelector(navTagId);
    if (!escapedNavId) {
      console.error('Solo Menu Mobile: Invalid navigation ID', navTagId);
      return;
    }

    // Get menu state - prefer state manager if available
    const navigationMenubar = document.querySelector(`#${escapedNavId} .navigation__menubar`);
    if (!navigationMenubar) {
      console.warn('Solo Menu Mobile: Navigation menubar not found for', navTagId);
      return;
    }

    let isOpen = false;
    if (Drupal.solo.menuState) {
      const state = Drupal.solo.menuState.getMenuState(navigationMenubar);
      isOpen = state.isOpen;
    } else {
      isOpen = navigationMenubar.classList.contains('toggled');
    }

    if (!isOpen) {
      // Update button state using state manager if available
      if (hamburgerIconChild) {
        Drupal.solo.menuState.setExpanded(hamburgerIconChild, true, COMPONENT_NAME);
      }
      hamburgerIcon.classList.add('toggled');
      openMobileMenu(navTagId);
    } else {
      // Update button state using state manager if available
      if (hamburgerIconChild) {
        Drupal.solo.menuState.setExpanded(hamburgerIconChild, false, COMPONENT_NAME);
      }
      hamburgerIcon.classList.remove('toggled');
      closeMobileMenu(navTagId);
    }
  };

  /**
   * Adds aria-controls attribute to button
   * @param {HTMLElement} hamburgerIcon - The hamburger icon element
   */
  const addAriaControlToButton = (hamburgerIcon) => {
    if (!hamburgerIcon) {
      console.warn('Solo Menu Mobile: Invalid hamburger icon in addAriaControlToButton');
      return;
    }

    const [hamburgerIconChild, navTagId] = getMobileNavType(hamburgerIcon);

    if (!navTagId || !hamburgerIconChild) {
      console.warn('Solo Menu Mobile: Missing required elements in addAriaControlToButton');
      return;
    }

    // Safely escape the ID
    const escapedNavId = Drupal.solo.escapeSelector(navTagId);
    if (!escapedNavId) {
      console.error('Solo Menu Mobile: Invalid navigation ID in addAriaControlToButton', navTagId);
      return;
    }

    const responsiveNav = document.querySelector(`#${escapedNavId} .navigation__responsive`);

    if (!responsiveNav) {
      console.warn('Solo Menu Mobile: Responsive navigation not found for', navTagId);
      return;
    }

    const ariaControl = responsiveNav.getAttribute('id');

    if (ariaControl) {
      const currentWidth = getCurrentWidth();

      if (currentWidth <= brNum) {
        if (Drupal.solo.menuState) {
          Drupal.solo.menuState.setAriaAttribute(hamburgerIconChild, 'aria-controls', ariaControl, COMPONENT_NAME);
        } else {
          hamburgerIconChild.setAttribute('aria-controls', ariaControl);
        }
      } else {
        hamburgerIconChild.removeAttribute('aria-controls');
      }
    } else {
      console.warn('Solo Menu Mobile: Responsive navigation missing ID attribute');
    }
  };

  /**
   * Updates hamburger button tabindex based on screen size
   * @param {NodeList|Array} hamburgerIcons - Collection of hamburger icons
   */
  const updateHamburgerTabindex = (hamburgerIcons) => {
    const currentWidth = getCurrentWidth();
    hamburgerIcons.forEach(button => {
      Drupal.solo.menuState.setTabindex(button, currentWidth <= brNum ? '0' : '-1', COMPONENT_NAME);
    });
  };
  /**
   * Updates tabindex for large screens
   */
  const updateTabindexForLargeScreens = () => {
    const currentWidth = getCurrentWidth();

    if (currentWidth > brNum) {
      const menuElement = document.querySelector('.navigation__responsive');
      if (menuElement) {
        updateFirstLevelTabindex(menuElement, '0');
        updateAriaHidden(menuElement, 'false');

        // Remove inert attribute on large screens
        const menubar = menuElement.querySelector('.navigation__menubar');
        if (menubar) {
          Drupal.solo.setInert(menubar, false);
        }

        // Remove inert from all submenus
        const submenus = menuElement.querySelectorAll('.sub__menu');
        submenus.forEach(submenu => {
          Drupal.solo.setInert(submenu, false);
        });
      }
    }
  };

  /**
   * Closes menu on resize
   * @param {HTMLElement} hamburgerIcon - The hamburger icon element
   */
  const closeOnResize = (hamburgerIcon) => {
    const [hamburgerIconChild, navTagId] = getMobileNavType(hamburgerIcon);

    if (!navTagId) return;

    if (hamburgerIconChild) {
      Drupal.solo.menuState.setExpanded(hamburgerIconChild, false, COMPONENT_NAME);
    }

    hamburgerIcon.classList.remove('toggled');
    closeMobileMenu(navTagId);
  };

  /**
   * Resets all menus on resize
   * @param {NodeList|Array} hamburgerIcons - Collection of hamburger icons
   */
  const resetMenusOnResize = (hamburgerIcons) => {
    hamburgerIcons?.forEach((hamburgerIcon) => {
      closeOnResize(hamburgerIcon);
    });
  };

  /**
   * Processes hamburger icons to add aria controls
   * @param {NodeList|Array} hamburgerIcons - Collection of hamburger icons
   */
  function processHamburgerIcons(hamburgerIcons) {
    hamburgerIcons.forEach((hamburgerIcon) => {
      addAriaControlToButton(hamburgerIcon);
    });
  }

  /**
   * Updates all menu states (consolidates common operations)
   * @param {NodeList|Array} hamburgerIcons - Collection of hamburger icons
   */
  function updateMenuStates(hamburgerIcons) {
    processHamburgerIcons(hamburgerIcons);
    updateHamburgerTabindex(hamburgerIcons);
    updateTabindexForLargeScreens();
  }

  /**
   * Creates resize handler
   * @param {NodeList|Array} hamburgerIcons - Collection of hamburger icons
   * @returns {Function} Resize handler
   */
  function createResizeHandler(hamburgerIcons) {
    return (screenInfo) => {
      currentLayout = Drupal.solo.getLayout();

      // Use screenInfo from state manager if available
      const isSmallScreen = screenInfo ? screenInfo.isSmallScreen : (getCurrentWidth() <= brNum);

      if (isSmallScreen && previousLayout !== currentLayout) {
        resetMenusOnResize(hamburgerIcons);
        previousLayout = currentLayout;
      }

      // If resizing to large screen, ensure inert is removed
      if (!isSmallScreen) {
        document.querySelectorAll('.navigation__menubar, .sub__menu').forEach(element => {
          Drupal.solo.setInert(element, false);
        });
      }

      updateMenuStates(hamburgerIcons);
    };
  }

  const clickHandlers = new WeakMap();

  /**
   * Initializes hamburger menu functionality
   * @param {NodeList|Array} hamburgerIcons - Collection of hamburger icons
   */
  function initHamburgerMenu(hamburgerIcons) {
    // Add click handlers
    hamburgerIcons.forEach((hamburgerIcon) => {
      const handler = () => {
        Drupal.solo.clickedHandler(() => {
          hamburgerIconIsClicked(hamburgerIcon);
        });
      };
      clickHandlers.set(hamburgerIcon, handler);
      hamburgerIcon.addEventListener('click', handler);
    });

    // Initial setup
    updateMenuStates(hamburgerIcons);

    if (Drupal.solo.menuState) {
      Drupal.solo.menuState.addResizeHandler(COMPONENT_NAME, createResizeHandler(hamburgerIcons), 250);
    } else {
      let resizeTimer;
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          createResizeHandler(hamburgerIcons)();
        }, 250);
      };
      window.addEventListener('resize', onResize);
      Drupal.solo._mobileResizeHandler = onResize;
    }
    // Set up automatic cleanup for removed elements
    const cleanupObserver = Drupal.solo.setupListenerCleanup(clickHandlers);

    // Store observer for detach
    if (hamburgerIcons.length > 0 && cleanupObserver) {
      hamburgerIcons[0]._cleanupObserver = cleanupObserver;
    }
  }

  Drupal.behaviors.mobileMenu = {
    attach: function(context) {
      // Try once via Drupal context
      const hamburgerIcons = once('soloHamburgerInit',
        '.mobile-nav button', context);

      if (hamburgerIcons.length > 0) {
        initHamburgerMenu(hamburgerIcons);
      } else {
        // Retry after full page load in case the menu was injected late (e.g. Admin Toolbar)
        window.addEventListener('load', () => {
          const fallbackIcons = once('soloHamburgerLateInit', '.mobile-nav button', document);
          if (fallbackIcons.length > 0) {
            initHamburgerMenu(fallbackIcons);
          }
        });
      }
    },

    detach: function(context, settings, trigger) {
      if (trigger === 'unload') {
        const hamburgerIcons = once.filter('soloHamburgerInit', '.mobile-nav button', context)
          .concat(once.filter('soloHamburgerLateInit', '.mobile-nav button'));

        hamburgerIcons.forEach(icon => {
          const handler = clickHandlers.get(icon);
          if (handler) {
            icon.removeEventListener('click', handler);
            clickHandlers.delete(icon);
          }
        });

        // Clean up MutationObserver
        if (hamburgerIcons[0]?._cleanupObserver) {
          hamburgerIcons[0]._cleanupObserver.disconnect();
        }

        if (Drupal.solo._mobileResizeHandler) {
          window.removeEventListener('resize', Drupal.solo._mobileResizeHandler);
          delete Drupal.solo._mobileResizeHandler;
        }

        if (Drupal.solo.menuState) {
          Drupal.solo.menuState.unregisterComponent(COMPONENT_NAME);
        }
      }
    }
  };
})(Drupal, drupalSettings, once);
