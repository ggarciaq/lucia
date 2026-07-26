/**
 * @file
 * Back to top: IntersectionObserver on sentinel; smooth scroll on click.
 * Drupal 11: Drupal.behaviors, once(), no jQuery. Toggles aria-hidden for a11y.
 *
 * @see partials/back-to-top.html.twig
 */
(function (Drupal, once) {
  'use strict';

  function run(button) {
    const sentinel = document.getElementById('solo-back-to-top-sentinel');
    if (!sentinel || !button) {
      return;
    }

    function setVisible(visible) {
      if (visible) {
        button.classList.add('is-visible');
        button.setAttribute('aria-hidden', 'false');
      } else {
        button.classList.remove('is-visible');
        button.setAttribute('aria-hidden', 'true');
      }
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          setVisible(!entry.isIntersecting);
        });
      },
      { root: null, rootMargin: '0px', threshold: 0 }
    );
    observer.observe(sentinel);

    button.addEventListener('click', function (e) {
      e.preventDefault();
      var motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: motionOk ? 'smooth' : 'instant' });
    });
  }

  Drupal.behaviors.soloBackToTop = {
    attach: function (context, settings) {
      once('solo-back-to-top', '#solo-back-to-top', context).forEach(run);
    },
  };
})(Drupal, once);
