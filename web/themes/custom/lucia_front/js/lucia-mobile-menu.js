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

  function bindButton(button) {
      if (button.dataset.luciaMobileMenuBound) {
        return;
      }
      const menu = button.closest('.solo-menu')?.querySelector('.navigation__menubar')
        || button.parentElement?.parentElement?.querySelector('.navigation__menubar');
      const wrapper = button.closest('.mobile-nav');

      if (!menu) {
        return;
      }

      button.dataset.luciaMobileMenuBound = 'true';

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

      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (menu.classList.contains('lucia-menu-open')) {
          closeMenu();
        }
        else {
          openMenu();
        }
      });

      menu.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
          closeMenu();
        }
      });

      const mediaQuery = window.matchMedia(MOBILE_QUERY);
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', closeMenu);
      }
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(closeMenu);
      }
    }

  function initLuciaMobileMenu() {
    document.querySelectorAll('.mobile-nav .mobile-menubar-toggler-button').forEach((button) => {
      bindButton(button);
    });
  }

  function handleDelegatedClick(event) {
    const button = event.target.closest?.('.mobile-nav .mobile-menubar-toggler-button');
    if (button) {
      bindButton(button);
      if (!button.dataset.luciaMobileMenuBound) {
        return;
      }
    }
  }

  document.addEventListener('click', handleDelegatedClick, true);

  function initWhenReady() {
    document.querySelectorAll('.mobile-nav .mobile-menubar-toggler-button').forEach((button) => {
      if (button.dataset.luciaMobileMenuBound) {
        return;
      }
      bindButton(button);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhenReady);
  }
  else {
    initWhenReady();
  }

  // Also expose as a Drupal behavior so it re-runs for AJAX/BigPipe content;
  // the dataset guard above keeps it a no-op for already-bound buttons.
  if (window.Drupal) {
    window.Drupal.behaviors = window.Drupal.behaviors || {};
    window.Drupal.behaviors.luciaMobileMenu = { attach: initLuciaMobileMenu };
  }
})();
