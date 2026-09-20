/**
 * @file
 * Standalone mobile menu toggle for lucia_front.
 *
 * Solo's own mobile menu script (js/menu/solo-menu-mobile.js) depends on a
 * long chain of helpers (menuState, animations, getBreakpointNumber, etc.)
 * that can silently fail to attach depending on browser/network timing.
 * This runs on DOMContentLoaded directly instead of through
 * Drupal.attachBehaviors/once, so it can't miss the initial attach cycle
 * because of script load order. The corresponding file is removed via
 * libraries-override in lucia_front.info.yml.
 */
(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 991.98px)';

  function initLuciaMobileMenu() {
    document.querySelectorAll('.mobile-nav .mobile-menubar-toggler-button').forEach((button) => {
      if (button.dataset.luciaMobileMenuBound) {
        return;
      }
      button.dataset.luciaMobileMenuBound = 'true';

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLuciaMobileMenu);
  }
  else {
    initLuciaMobileMenu();
  }

  // Also expose as a Drupal behavior so it re-runs for AJAX/BigPipe content;
  // the dataset guard above keeps it a no-op for already-bound buttons.
  if (window.Drupal) {
    window.Drupal.behaviors = window.Drupal.behaviors || {};
    window.Drupal.behaviors.luciaMobileMenu = { attach: initLuciaMobileMenu };
  }
})();
