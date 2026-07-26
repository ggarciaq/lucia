/**
 * @file
 * Comment replies toggle behavior.
 */

(function (Drupal, once) {

  'use strict';

  /**
   * Initialize show/hide button for comment replies.
   *
   * @param {Element} comments
   *   The comment wrapper element.
   */
  function init(comments) {
    // Mark comments that have children
    comments
      .querySelectorAll('[data-drupal-selector="comment"]')
      .forEach(function (comment) {
        if (comment.nextElementSibling?.matches('.indented')) {
          comment.classList.add('has-children');
        }
      });

    // Add toggle button for each indented group
    comments.querySelectorAll('.indented').forEach(function (commentGroup) {
      const parentComment = commentGroup.previousElementSibling;
      if (!parentComment) {
        return;
      }

      const footer = parentComment.querySelector('.comment__footer');
      if (!footer) {
        return;
      }

      // Count replies
      const replyCount = commentGroup.querySelectorAll('[data-drupal-selector="comment"]').length;

      // Create toggle button wrapper
      const toggleWrapper = document.createElement('div');
      toggleWrapper.setAttribute('class', 'comment__replies-wrapper');

      // Create toggle button
      const toggleButton = document.createElement('button');
      toggleButton.setAttribute('type', 'button');
      toggleButton.setAttribute('class', 'comment__replies-toggle solo-button');
      toggleButton.setAttribute('aria-expanded', 'true');
      toggleButton.setAttribute('aria-controls', 'replies-' + parentComment.getAttribute('data-comment-id'));

      // Create icon wrapper for open state (minus icon)
      const iconOpen = document.createElement('span');
      iconOpen.setAttribute('class', 'comment__replies-icon comment__replies-icon--open');
      iconOpen.innerHTML = '<svg fill="var(--r-tx)" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M240-440v-80h480v80H240Z"/></svg>';


      // Create icon wrapper for close state (plus icon)
      const iconClose = document.createElement('span');
      iconClose.setAttribute('class', 'comment__replies-icon comment__replies-icon--close');
      iconClose.setAttribute('hidden', '');
      iconClose.innerHTML = '<svg fill="var(--r-tx)" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-80v-340H120v-120h320v-340h80v340h320v120H520v340h-80Z"/></svg>';

      // Create text
      const text = document.createElement('span');
      text.setAttribute('class', 'comment__replies-text');
      text.textContent = Drupal.t('Replies') + ' (' + replyCount + ')';

      // Append elements
      toggleButton.appendChild(iconOpen);
      toggleButton.appendChild(iconClose);
      toggleButton.appendChild(text);
      toggleWrapper.appendChild(toggleButton);
      footer.appendChild(toggleWrapper);

      // Set ID for aria-controls
      commentGroup.id = 'replies-' + parentComment.getAttribute('data-comment-id');

      // Add click event using Solo slideUp/slideDown
      toggleButton.addEventListener('click', function (e) {
        e.preventDefault();
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
          // Close replies
          Drupal.solo.slideUp(commentGroup, Drupal.solo.animations.slideUp, 'comments');
          toggleButton.setAttribute('aria-expanded', 'false');
        } else {
          // Open replies
          Drupal.solo.slideDown(commentGroup, Drupal.solo.animations.slideDown, 'block', 'comments');
          toggleButton.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /**
   * Toggle threaded comment replies visibility.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.commentRepliesToggle = {
    attach: function (context) {
      once('comment-replies-toggle', '[data-drupal-selector="comments"]', context).forEach(init);
    }
  };

})(Drupal, once);
