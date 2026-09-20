/**
 * @file
 * Standalone mobile menu toggle for lucia_front.
 *
 * Solo's own mobile menu script (js/menu/solo-menu-mobile.js) depends on a
 * long chain of helpers (menuState, animations, getBreakpointNumber, etc.)
 * that can silently fail to attach depending on browser/network timing.
 * This behavior replaces it with a minimal implementation that only relies
 * on classList and matchMedia, so it cannot break for the same reasons.
 * The corresponding file is removed via libraries-override in
 * lucia_front.info.yml.
 */
((Drupal, once) => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 991.98px)';

  Drupal.behaviors.luciaMobileMenu = {
    attach(context) {
      once('lucia-mobile-menu', '.mobile-nav .mobile-menubar-toggler-button', context).forEach((button) => {
        const nav = button.closest('nav');
        const wrapper = button.closest('.mobile-nav');
        const menu = nav ? nav.querySelector('.navigation__menubar') : null;

        if (!menu) {
          return;
        }

        const closeMenu = () => {
          menu.classList.remove('lucia-menu-open');
          if (wrapper) {
            wrapper.classList.remove('toggled');
          }
          button.classList.remove('toggled');
          button.setAttribute('aria-expanded', 'false');
        };

        const openMenu = () => {
          menu.classList.add('lucia-menu-open');
          if (wrapper) {
            wrapper.classList.add('toggled');
          }
          button.classList.add('toggled');
          button.setAttribute('aria-expanded', 'true');
        };

        button.addEventListener('click', () => {
          if (menu.classList.contains('lucia-menu-open')) {
            closeMenu();
          }
          else {
            openMenu();
          }
        });

        // Close the menu once a link inside it is followed.
        menu.addEventListener('click', (event) => {
          if (event.target.closest('a')) {
            closeMenu();
          }
        });

        // Always reset to a closed state when crossing the breakpoint.
        const mediaQuery = window.matchMedia(MOBILE_QUERY);
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', closeMenu);
        }
        else if (mediaQuery.addListener) {
          // Fallback for older Safari.
          mediaQuery.addListener(closeMenu);
        }
      });
    }
  };
})(Drupal, once);
