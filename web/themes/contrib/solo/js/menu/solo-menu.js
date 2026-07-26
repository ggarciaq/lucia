/**
 * @file
 * Solo Menu System - Refactored with State Manager
 *
 * Filename:     solo-menu.js
 * Website:      https://www.flashwebcenter.com
 * Developer:    Alaa Haddad https://www.alaahaddad.com.
 */
((Drupal, drupalSettings, once) => {
  'use strict';

  // Component name for state manager
  const COMPONENT_NAME = 'main';

  const animations = Drupal.solo.animations;

  // Register component with state manager
  if (Drupal.solo.menuState) {
    Drupal.solo.menuState.registerComponent(COMPONENT_NAME, {
      name: 'Solo Main Menu',
      version: '1.0'
    });
  }

  // Configuration
  const CONFIG = {
    selectors: {
      menuBar: '.solo-inner .solo-menu .navigation__menubar',
      subMenus: '.solo-inner .solo-menu .navigation__menubar ul',
      svgIcons: '.solo-inner .solo-menu .navigation__menubar .toggler-icon>svg',
      megaMenuClick: {
        big: '.solo-inner .solo-menu.navigation-responsive-click .navigation__megamenu>li>.dropdown-toggler',
        small: '.solo-inner .solo-menu.navigation-responsive-click .navigation__megamenu li .dropdown-toggler'
      },
      megaMenuHover: '.solo-inner .solo-menu.navigation-responsive-hover .navigation__megamenu li .dropdown-toggler',
      responsiveHover: '.solo-inner .solo-menu.navigation-responsive-hover .navigation__menubar:not(.navigation__megamenu) .dropdown-toggler',
      responsiveClick: '.solo-inner .solo-menu.navigation-responsive-click .navigation__menubar:not(.navigation__megamenu) .dropdown-toggler',
      default: '.solo-inner .solo-menu .navigation__default .dropdown-toggler',
      sidebarHover: '.solo-inner .solo-menu.navigation-sidebar-hover li .dropdown-toggler',
      sidebarClick: '.solo-inner .solo-menu.navigation-sidebar-click li .dropdown-toggler'
    }
  };

  // Arrow rotation mappings
  const ARROW_ROTATIONS = {
    'default': 'rotate(180deg)',
    'ltr-right': 'rotate(-90deg)',
    'ltr-left': 'rotate(90deg)',
    'rtl-right': 'rotate(90deg)',
    'rtl-left': 'rotate(-90deg)'
  };

  // State management
  const state = {
    resizeHandler: null,
    isClicked: false,
    currentWidth: 0,
    currentLayout: null,
    previousLayout: null,
    brNum: 0,
    animationQueue: new Map()
  };

  const getCurrentWidth = () => Drupal.solo.menuState.getCurrentWidth()

  // Utility functions
  const utils = {
    querySelectorElements: (selector, context) => {
      if (!context || !selector) {
        console.warn('Solo Menu: Invalid selector or context', { selector, context });
        return [];
      }
      try {
        return Array.from(context.querySelectorAll(selector) || []);
      } catch (error) {
        console.error('Solo Menu: Query selector failed', { selector, error });
        return [];
      }
    },

    hasParentWithClass: (element, className) => !!element.closest(`.${className}`),

    getNavTagId: (dropdownTogglerButton) => dropdownTogglerButton.closest('nav')?.id,

    getRotated: (dropdownTogglerButton) => dropdownTogglerButton.querySelector('.toggler-icon svg'),

    setSubMenuAttributes: (element, attributes) => {
      for (const key in attributes) {
        if (Drupal.solo.menuState && key.startsWith('aria-')) {
          Drupal.solo.menuState.setAriaAttribute(element, key, attributes[key], COMPONENT_NAME);
        } else {
          element.setAttribute(key, attributes[key]);
        }
      }
    },

    delay: (duration) => new Promise(resolve => setTimeout(resolve, duration))
  };

  // Click handler with debounce
  const clickedHandler = async (callback) => {
    if (!state.isClicked) {
      state.isClicked = true;
      await callback();
      await utils.delay(animations.clickDelay);
      state.isClicked = false;
    }
  };

  // Arrow direction logic
  const getArrowDirection = (verticalNav) => {
    const shouldRotate = state.currentWidth >= state.brNum && !verticalNav;

    if (!shouldRotate) {
      return ARROW_ROTATIONS.default;
    }

    const isRtl = document.documentElement.dir === 'rtl';
    const isExpandLeft = document.querySelector('#primary-menu .expand-left') !== null;

    const key = `${isRtl ? 'rtl' : 'ltr'}-${isExpandLeft ? 'left' : 'right'}`;
    return ARROW_ROTATIONS[key];
  };

  // Menu visibility functions
  const menuVisibility = {
    hideSubMenus: (subMenu) => {
      Drupal.solo.menuState.hideSubmenu(subMenu, COMPONENT_NAME);
    },

    closeMenuHelper: (rotated, dropdownTogglerButton, subMenu) => {
      if (!subMenu) return;

      const elementKey = subMenu.id || subMenu.className;
      if (Drupal.solo.animationQueue.has(elementKey)) {
        return; // Animation already in progress
      }

      Drupal.solo.animationQueue.add(elementKey, 'closing', animations.slideUp);
      rotated.style.removeProperty('transform');
      Drupal.solo.menuState.setExpanded(dropdownTogglerButton, false, COMPONENT_NAME);
      // FIXED: Add true parameter to enable announcements for menu operations
      Drupal.solo.slideUp(subMenu, animations.slideUp, COMPONENT_NAME, true);
    },

    openMenuHelper: (dropdownTogglerButton, subMenu) => {
        if (!subMenu) return;

        const elementKey = subMenu.id || subMenu.className;
        if (Drupal.solo.animationQueue.has(elementKey)) {
          return; // Animation already in progress
        }

        state.currentWidth = getCurrentWidth();

        let duration;
        if (subMenu.classList.contains('sub-mega') && state.currentWidth >= state.brNum) {
          duration = animations.megaMenu;
          Drupal.solo.animationQueue.add(elementKey, 'opening', duration);
          // FIXED: Add true parameter to enable announcements for menu operations
          Drupal.solo.slideDown(subMenu, duration, 'grid', COMPONENT_NAME, true);
        } else {
          duration = animations.slideDown;
          Drupal.solo.animationQueue.add(elementKey, 'opening', duration);
          // FIXED: Add true parameter to enable announcements for menu operations
          Drupal.solo.slideDown(subMenu, duration, 'block', COMPONENT_NAME, true);
        }

        Drupal.solo.menuState.setExpanded(dropdownTogglerButton, true, COMPONENT_NAME);
      }
    };

  // Icon management
  const iconManagement = {
    revertIcons: (navId) => {
      if (!navId) return;

      const escapedId = Drupal.solo.escapeSelector(navId);
      if (!escapedId) {
        console.error('Solo Menu: Invalid nav ID in revertIcons', navId);
        return;
      }

      const svgIcons = document.querySelectorAll(`.solo-inner #${escapedId} .toggler-icon svg`);
      svgIcons.forEach(svgIcon => svgIcon.style.removeProperty('transform'));
    },

    resetSubMenus: (siteSubMenus, svgIcons) => {
      svgIcons.forEach(el => el.style.removeProperty('transform'));
      // FIXED: Reset operations shouldn't announce - pass false explicitly
      siteSubMenus.forEach(el => Drupal.solo.slideUp(el, animations.slideUp, COMPONENT_NAME, false));

      setTimeout(() => {
        siteSubMenus.forEach(el => el.style.removeProperty('transform'));
      }, animations.reset);
    },

    resetSpecificSubMenus: (specificSubMenus, specificSvgIcons) => {
      specificSvgIcons.forEach(el => el.style.removeProperty('transform'));
      // FIXED: Reset operations shouldn't announce - pass false explicitly
      specificSubMenus.forEach(el => Drupal.solo.slideUp(el, animations.slideUp, COMPONENT_NAME, false));

      setTimeout(() => {
        specificSubMenus.forEach(el => el.style.removeProperty('transform'));
      }, animations.reset);
    }
  };

  // Menu operations
  const menuOperations = {
    openMenubar: (dropdownTogglerButton, subMenu) => {
      // Remove inert before opening
      Drupal.solo.setInert(subMenu, false);
      const navTagId = utils.getNavTagId(dropdownTogglerButton);
      const subMenuClasses = Drupal.solo.getSubMenuClasses(navTagId);
      const rotated = utils.getRotated(dropdownTogglerButton);

      subMenuClasses?.forEach(subMenuClass => {
        if (subMenuClass !== subMenu) {
          menuVisibility.hideSubMenus(subMenuClass);
          iconManagement.revertIcons(navTagId);
        }
      });

      rotated.style.transform = ARROW_ROTATIONS.default;
      menuVisibility.openMenuHelper(dropdownTogglerButton, subMenu);
    },

    closeMenubar: (dropdownTogglerButton, subMenu) => {
      if (!subMenu) return;

      // CRITICAL: Remove focus from any element inside menu BEFORE hiding
      if (subMenu.contains(document.activeElement)) {
        document.activeElement.blur();

        // Return focus to the toggle button
        if (dropdownTogglerButton && document.contains(dropdownTogglerButton)) {
          dropdownTogglerButton.focus();
        }
      }

      const navTagId = utils.getNavTagId(dropdownTogglerButton);
      const subMenuClasses = Drupal.solo.getSubMenuClasses(navTagId);
      const rotated = utils.getRotated(dropdownTogglerButton);

      subMenuClasses?.forEach(subMenuClass => {
        // Remove focus before hiding
        if (subMenuClass.contains(document.activeElement)) {
          document.activeElement.blur();
        }
        menuVisibility.hideSubMenus(subMenuClass);
        iconManagement.revertIcons(navTagId);
        Drupal.solo.setInert(subMenuClass, true);

      });

      menuVisibility.closeMenuHelper(rotated, dropdownTogglerButton, subMenu);

      // Set inert on main submenu if available
      Drupal.solo.setInert(subMenu, true);
    },

    openSubMenu: (dropdownTogglerButton, subMenu) => {
        // Remove inert before opening
      Drupal.solo.setInert(subMenu, false);
      const togglerSibling = dropdownTogglerButton.closest('.solo-inner .solo-menu ul');
      const nestedSubMenus = [...togglerSibling.querySelectorAll(':scope > li > ul.sub__menu')];
      const nestedTogglers = [...togglerSibling.querySelectorAll(':scope > li > button.dropdown-toggler svg')];
      const rotated = utils.getRotated(dropdownTogglerButton);
      const verticalNav = subMenu.closest('.navigation-sidebar');

      // Close siblings and revert icons
      nestedSubMenus.forEach(nestedSubMenu => {
        if (nestedSubMenu !== subMenu) {
          menuVisibility.hideSubMenus(nestedSubMenu);
        }
      });

      nestedTogglers.forEach(nestedToggler => {
        if (nestedToggler !== rotated) {
          nestedToggler.style.removeProperty('transform');
        }
      });

      rotated.style.transform = getArrowDirection(verticalNav);
      menuVisibility.openMenuHelper(dropdownTogglerButton, subMenu);
    },

    closeSubMenu: (dropdownTogglerButton, subMenu) => {
      if (!subMenu) return;

      // CRITICAL: Remove focus from any element inside submenu BEFORE hiding
      if (subMenu.contains(document.activeElement)) {
        document.activeElement.blur();

        // Return focus to the toggle button that controls this submenu
        if (dropdownTogglerButton && document.contains(dropdownTogglerButton)) {
          dropdownTogglerButton.focus();
        }
      }

      const rotated = utils.getRotated(dropdownTogglerButton);
      menuVisibility.closeMenuHelper(rotated, dropdownTogglerButton, subMenu);

      // Clean up flipped classes and attributes
      const parentLi = dropdownTogglerButton.closest('li.has-sub__menu');
      parentLi?.classList.remove('submenu-flipped-left', 'submenu-flipped-right');

      if (subMenu?.dataset.flipped) {
        delete subMenu.dataset.flipped;
      }

      // Close nested submenus
      const nestedSubMenus = subMenu.querySelectorAll('ul.sub__menu');
      const nestedTogglers = subMenu.querySelectorAll('button.dropdown-toggler');

      // Remove focus from nested elements before closing
      nestedSubMenus.forEach(nested => {
        if (nested.contains(document.activeElement)) {
          document.activeElement.blur();
        }
        Drupal.solo.slideUp(nested, animations.slideUp, COMPONENT_NAME);
        nested.classList.remove('toggled');
        Drupal.solo.setInert(nested, true);
      });

      nestedTogglers.forEach(toggler => {
        const icon = toggler.querySelector('.toggler-icon svg');
        icon?.style.removeProperty('transform');
        Drupal.solo.menuState.setExpanded(toggler, false, COMPONENT_NAME);
      });

      // Set inert on the main submenu if available
      Drupal.solo.setInert(subMenu, true);
    }
  };

  // Event handlers
  const eventHandlers = {
    clickHandlers: new WeakMap(),

    dropdownTogglerButtonIsClicked: (dropdownTogglerButton, subMenu) => {
      clickedHandler(() => {
        const isMenubar = dropdownTogglerButton.parentElement.classList.contains('nav__menubar-item');
        let isToggled = false;

        if (Drupal.solo.menuState) {
          const state = Drupal.solo.menuState.getMenuState(subMenu);
          isToggled = state.isOpen;
        } else {
          isToggled = subMenu.classList.contains('toggled');
        }

        if (isMenubar) {
          isToggled ? menuOperations.closeMenubar(dropdownTogglerButton, subMenu)
                    : menuOperations.openMenubar(dropdownTogglerButton, subMenu);
        } else {
          isToggled ? menuOperations.closeSubMenu(dropdownTogglerButton, subMenu)
                    : menuOperations.openSubMenu(dropdownTogglerButton, subMenu);
        }
      });
    },

    addRemoveListener: function(event) {
      const button = event.currentTarget;
      const subMenu = button.nextElementSibling;
      eventHandlers.dropdownTogglerButtonIsClicked(button, subMenu);
    },

    addEventListenerToButtons: (buttons) => {
      buttons.forEach(button => {
        if (eventHandlers.clickHandlers.has(button)) {
          return;  // Skip if already has handler
        }

        // CREATE NEW FUNCTION for each button - THIS IS THE FIX
        const handler = function(event) {
          const button = event.currentTarget;
          const subMenu = button.nextElementSibling;
          eventHandlers.dropdownTogglerButtonIsClicked(button, subMenu);
        };

        eventHandlers.clickHandlers.set(button, handler);
        button.addEventListener('click', handler);
      });
    },

    removeEventListenerToButtons: (buttons) => {
      buttons.forEach(button => {
        const handler = eventHandlers.clickHandlers.get(button);
        if (handler) {
          button.removeEventListener('click', handler);
          eventHandlers.clickHandlers.delete(button);
          if (drupalSettings?.solo?.debug) {
            console.log('Removing listeners from', buttons.length, 'buttons');
          }
        }
      });
    }
  };

  // Hover functionality
  const addHoverFunctionality = (searchContext = document) => {
    if (getCurrentWidth() < state.brNum) return;

    const hoverMenus = searchContext.querySelector('.navigation-responsive-hover');
    if (!hoverMenus) return;

    const menuItems = searchContext.querySelectorAll('.navigation-responsive-hover li.has-sub__menu');


    menuItems.forEach(item => {
      if (item.hasAttribute('data-hover-added')) return;

      const toggler = item.querySelector(':scope > button.dropdown-toggler');
      const subMenu = item.querySelector(':scope > ul');

      if (toggler && subMenu) {
        item.addEventListener('mouseenter', () => {
          Drupal.solo.menuState.setExpanded(toggler, true, COMPONENT_NAME);
          Drupal.solo.menuState.setHidden(subMenu, false, COMPONENT_NAME);
        });

        item.addEventListener('mouseleave', () => {
          Drupal.solo.menuState.setExpanded(toggler, false, COMPONENT_NAME);
          Drupal.solo.menuState.setHidden(subMenu, true, COMPONENT_NAME);
        });
      }

      item.setAttribute('data-hover-added', 'true');
    });
  };

  // Close submenus on outside click
  const closeSubMenusOnClick = () => {
    const navMenus = [
      '.solo-inner .solo-menu.navigation-responsive-click .navigation__menubar',
      '#primary-sidebar-menu .navigation__menubar'
    ];

    document.addEventListener('click', (event) => {
      clickedHandler(() => {
        const isInsideMenu = navMenus.some(selector => event.target.closest(selector));

        if (!isInsideMenu) {
          const specificNavMenus = document.querySelectorAll(navMenus.join(', '));
          const specificSubMenus = [];
          const specificSvgIcons = [];

          specificNavMenus.forEach(menu => {
            specificSubMenus.push(...menu.querySelectorAll('ul.navigation__menubar ul'));
            specificSvgIcons.push(...menu.querySelectorAll('.toggler-icon svg'));
          });

          iconManagement.resetSpecificSubMenus(specificSubMenus, specificSvgIcons);
        }
      });
    });
  };

  // Menu helper for responsive behavior
  const menusHelper = (currentWidth, searchContext = document) => {
    const buttons = {
      mmClickSmall: document.querySelectorAll(CONFIG.selectors.megaMenuClick.small),
      mmClickBig: document.querySelectorAll(CONFIG.selectors.megaMenuClick.big),
      mmHoverSmall: document.querySelectorAll(CONFIG.selectors.megaMenuHover),
      navigationSidebarHover: document.querySelectorAll(CONFIG.selectors.sidebarHover),
      navigationResponsiveHover: document.querySelectorAll(CONFIG.selectors.responsiveHover)
    };

    const largeScreenActions = [
      { remove: buttons.mmClickSmall, add: buttons.mmClickBig },
      { remove: buttons.mmHoverSmall, add: null },
      { remove: buttons.navigationSidebarHover, add: null },
      { remove: buttons.navigationResponsiveHover, add: null }
    ];

    const smallScreenActions = [
      { remove: buttons.mmClickBig, add: buttons.mmClickSmall },
      { remove: null, add: buttons.mmHoverSmall },
      { remove: null, add: buttons.navigationSidebarHover },
      { remove: null, add: buttons.navigationResponsiveHover }
    ];

    const siteMenuBars = document.querySelectorAll(CONFIG.selectors.menuBar);
    siteMenuBars.forEach(siteMenuBar => siteMenuBar.removeAttribute('style'));

    const actions = currentWidth >= state.brNum ? largeScreenActions : smallScreenActions;

    actions.forEach(({ remove, add }) => {
      if (remove) eventHandlers.removeEventListenerToButtons(remove);
      if (add) eventHandlers.addEventListenerToButtons(add);
    });
  };

  // Active menu item marking
  const markActiveMenuItem = () => {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.views-page .navigation__menubar li a');

    links?.forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        let currentElement = link;

        while (currentElement && !currentElement.matches('ul.navigation__menubar')) {
          if (currentElement.tagName === 'LI') {
            currentElement.classList.add('is-active');
          }
          currentElement = currentElement.parentElement;
        }
      }
    });
  };

  // Expose public API
  const exposePublicAPI = () => {
    // Utility functions
    Drupal.solo.clickedHandler = clickedHandler;
    Drupal.solo.hideSubMenus = menuVisibility.hideSubMenus;
    Drupal.solo.revertIcons = iconManagement.revertIcons;

    // DOM query helpers
    Drupal.solo.getNavigationMenubarClass = (menuBar) => {
      if (!menuBar) return null;

      const escapedId = Drupal.solo.escapeSelector(menuBar);
      if (!escapedId) {
        console.error('Solo Menu: Invalid menuBar ID', menuBar);
        return null;
      }

      return document.querySelector(`.solo-inner #${escapedId} .navigation__menubar`);
    };

    Drupal.solo.getSubMenuClasses = (subMenus) => {
      if (!subMenus) return [];

      const escapedId = Drupal.solo.escapeSelector(subMenus);
      if (!escapedId) {
        console.error('Solo Menu: Invalid subMenus ID', subMenus);
        return [];
      }

      return document.querySelectorAll(`.solo-inner #${escapedId} .navigation__menubar ul.sub__menu`);
    };

    // Menu operations (for keyboard support)
    Drupal.solo.menuOperations = menuOperations;
    Drupal.solo.menuVisibility = menuVisibility;
    Drupal.solo.eventHandlers = eventHandlers;
  };

  Drupal.behaviors.menuAction = {
    attach: function(context, settings) {
      // Guard against re-initialization
      if (context._soloMenuInitialized) {
        if (drupalSettings?.solo?.debug) {
          console.debug('Solo Menu: Already initialized, skipping');
        }
        return;
      }

      // Verify dependencies
      if (!Drupal.solo || !Drupal.solo.animations) {
        console.error('Solo Menu: Required dependencies not loaded');
        return;
      }

      if (!Drupal.solo.getBreakpointNumber || !Drupal.solo.getLayout) {
        console.error('Solo Menu: Required utility functions not available');
        return;
      }

      // Mark as initialized
      context._soloMenuInitialized = true;

      // Initialize state
      state.brNum = Drupal.solo.getBreakpointNumber('mn');
      state.previousLayout = Drupal.solo.getLayout();
      state.currentWidth = getCurrentWidth();
      state.currentLayout = state.previousLayout;

      // Get elements with context
      const elements = {
        siteMenuBars: utils.querySelectorElements(CONFIG.selectors.menuBar, context),
        siteSubMenus: utils.querySelectorElements(CONFIG.selectors.subMenus, context),
        svgIcons: utils.querySelectorElements(CONFIG.selectors.svgIcons, context),
        navigationDefault: utils.querySelectorElements(CONFIG.selectors.default, context),
        navigationResponsiveClick: utils.querySelectorElements(CONFIG.selectors.responsiveClick, context),
        navigationSidebarClick: utils.querySelectorElements(CONFIG.selectors.sidebarClick, context)
      };

      // Add focus class on menubar click
      elements.siteMenuBars.forEach(siteMenuBar => {
        siteMenuBar.addEventListener('click', () => {
          const sideMenu = 'navigation-sidebar';
          const shouldRemoveFocus = utils.hasParentWithClass(siteMenuBar, sideMenu) ||
                                   state.currentWidth <= state.brNum;

          siteMenuBar.classList[shouldRemoveFocus ? 'remove' : 'add']('focus-in');
        });
      });

      // Initialize components
      markActiveMenuItem();
      addHoverFunctionality();

      // Add event listeners
      eventHandlers.addEventListenerToButtons(elements.navigationResponsiveClick);
      eventHandlers.addEventListenerToButtons(elements.navigationSidebarClick);
      elements.navigationDefault.forEach(button => {
        button.style.pointerEvents = 'none';
        button.setAttribute('tabindex', '-1');
        button.setAttribute('aria-hidden', 'true');
      });
      // Initialize responsive behavior
      menusHelper(state.currentWidth, context);

      // Handle resize events using state manager if available
      if (Drupal.solo.menuState) {
        Drupal.solo.menuState.addResizeHandler(COMPONENT_NAME, (screenInfo) => {
          state.currentLayout = Drupal.solo.getLayout();
          state.currentWidth = screenInfo.width;

          if (state.previousLayout !== state.currentLayout) {
            menusHelper(state.currentWidth, context);
            iconManagement.resetSubMenus(elements.siteSubMenus, elements.svgIcons);
            state.previousLayout = state.currentLayout;

            // Remove inert from all menus when layout changes
            // This ensures menus work correctly after resize
            document.querySelectorAll('.navigation__menubar, .sub__menu').forEach(element => {
              Drupal.solo.setInert(element, false);
            });
          }

          addHoverFunctionality();
        }, 250);
        } else {
          state.resizeHandler = () => {
            state.currentLayout = Drupal.solo.getLayout();
            state.currentWidth = getCurrentWidth();

            if (state.previousLayout !== state.currentLayout) {
              menusHelper(state.currentWidth, document);
              iconManagement.resetSubMenus(elements.siteSubMenus, elements.svgIcons);
              state.previousLayout = state.currentLayout;

              // Remove inert from all menus when layout changes
              document.querySelectorAll('.navigation__menubar, .sub__menu').forEach(element => {
                Drupal.solo.setInert(element, false);
              });
            }

            addHoverFunctionality();
          };

          window.addEventListener('resize', state.resizeHandler);
        }

      // Initialize close on outside click
      closeSubMenusOnClick();

      // Expose public API
      exposePublicAPI();
    },

    detach: function(context, settings, trigger) {
      if (trigger === 'unload') {
        // Remove initialization flag
        delete context._soloMenuInitialized;

        // Get ALL buttons from context (not relying on once() filter)
        const allButtons = context.querySelectorAll('.dropdown-toggler');

        // Try to remove listeners via WeakMap first
        eventHandlers.removeEventListenerToButtons(allButtons);

        // Fallback: Force cleanup for any orphaned listeners
        // This handles cases where WeakMap lost references
        let orphanedCount = 0;
        allButtons.forEach(button => {
          if (!eventHandlers.clickHandlers.has(button)) {
            // Check if button still has listener by testing
            const testHandler = () => {};
            button.addEventListener('click', testHandler);
            button.removeEventListener('click', testHandler);

            // If we suspect orphaned listeners, clone to remove all
            if (button.parentNode && button.onclick === null) {
              const clone = button.cloneNode(true);
              button.parentNode.replaceChild(clone, button);
              orphanedCount++;
            }
          }
        });

        if (orphanedCount > 0 && drupalSettings?.solo?.debug) {
          console.debug(`Solo Menu: Cleaned ${orphanedCount} orphaned listeners`);
        }

        // Remove resize handler
        if (state.resizeHandler) {
          window.removeEventListener('resize', state.resizeHandler);
          state.resizeHandler = null;
        }

        // Unregister from state manager
        if (Drupal.solo.menuState) {
          Drupal.solo.menuState.unregisterComponent(COMPONENT_NAME);
        }

        // Clear animation queue
        if (state.animationQueue) {
          state.animationQueue.clear();
        }

        // Reset event handlers WeakMap
        eventHandlers.clickHandlers = new WeakMap();

        // Clear any hover event listeners added to menubar
        const siteMenuBars = context.querySelectorAll('.navigation__menubar');
        siteMenuBars.forEach(menuBar => {
          menuBar.classList.remove('focus-in');

          // Remove data attributes used for hover tracking
          const hoverItems = menuBar.querySelectorAll('[data-hover-added]');
          hoverItems.forEach(item => item.removeAttribute('data-hover-added'));
        });
      }
    }

  };
})(Drupal, drupalSettings, once);
