<?php

/**
 * @file
 * Theme Sugestions.
 */

use Drupal\Core\Routing\RouteMatchInterface;

/**
 * Implements hook_theme_suggestions_HOOK_alter().
 */
function solo_theme_suggestions_form_alter(array &$suggestions, array $variables): void {
  // Check if form_id exists in variables.
  if (isset($variables['element']['#form_id'])) {
    // Get the form ID.
    $form_id = $variables['element']['#form_id'];

    // Suggest the name for the search block.
    if ($form_id === 'search_block_form') {
      $suggestions[] = 'form__search_block_form';
    }
  }
}

/**
 * Implements hook_theme_suggestions_HOOK_alter() for form templates.
 */
function solo_theme_suggestions_block_alter(array &$suggestions, array $variables): void {
  if (isset($variables['elements']['content']['#block_content'])) {
    array_splice($suggestions, 1, 0, 'block__type__' . $variables['elements']['content']['#block_content']->bundle());
  }
}

/**
 * Implements hook_theme_suggestions_HOOK_alter() for menu.
 */
function solo_theme_suggestions_menu_alter(array &$suggestions, array $variables): void {
  $region_suggestions_added = [];
  $new_suggestions = [];

  // Region-based suggestions (add to list only if user has no choice).
  if (isset($variables['attributes']['region'])) {
    $region = $variables['attributes']['region'];
    $new_suggestions[] = 'menu__' . $region;

    // If it's a menu block, add more specific suggestions.
    if (isset($variables['#menu_block_configuration'])) {
      $config = $variables['#menu_block_configuration'];
      $menu_name = $variables['#menu_name'] ?? '';

      // Add various combinations.
      $new_suggestions[] = 'menu__' . $region . '__menu_block';
      if ($menu_name) {
        $region_menu = 'menu__' . $region . '__' . strtr($menu_name, '-', '_');
        $new_suggestions[] = $region_menu;
        $new_suggestions[] = $region_menu . '__menu_block';
      }

      // Add suggestion from menu block configuration if it exists.
      if (!empty($config['suggestion'])) {
        $new_suggestions[] = 'menu__' . $region . '__' . $config['suggestion'];
      }
    }
    $region_suggestions_added = $new_suggestions;
  }

  // Custom menu → template assignment: user choice overrides region.
  $user_suggestion = NULL;
  $menu_name = $variables['menu_name'] ?? $variables['#menu_name'] ?? NULL;
  if ($menu_name !== '' && $menu_name !== NULL) {
    $menu_name = (string) $menu_name;
    $active_theme = \Drupal::theme()->getActiveTheme()->getName();
    $assignments = \Drupal::config($active_theme . '.settings')->get('menu_template_assignments') ?? [];
    if (is_array($assignments)) {
      $menu_name_normalized = strtr($menu_name, '_', '-');
      foreach ($assignments as $row) {
        if (empty($row['menu_id']) || empty($row['template'])) {
          continue;
        }
        $row_menu_normalized = strtr($row['menu_id'], '_', '-');
        if ($row_menu_normalized !== $menu_name_normalized) {
          continue;
        }
        $template = $row['template'];
        if (substr($template, -10) === '.html.twig') {
          $template = substr($template, 0, -10);
        }
        if (strpos($template, 'menu--') === 0) {
          $user_suggestion = 'menu__' . strtr(substr($template, 6), '-', '_');
        }
        break;
      }
    }
  }

  // User-chosen template: highest priority; remove region-based suggestions.
  if ($user_suggestion !== NULL) {
    $suggestions = array_values(array_diff($suggestions, $region_suggestions_added));
    if (!in_array($user_suggestion, $suggestions)) {
      array_unshift($suggestions, $user_suggestion);
    }
    else {
      $suggestions = array_values(array_diff($suggestions, [$user_suggestion]));
      array_unshift($suggestions, $user_suggestion);
    }
  }
  else {
    // No user choice: add region-based suggestions to the beginning.
    foreach (array_reverse($new_suggestions) as $suggestion) {
      if (!in_array($suggestion, $suggestions)) {
        array_unshift($suggestions, $suggestion);
      }
    }
  }
}

/**
 * Helper function.
 */
function _add_node_suggestions(RouteMatchInterface $route_match, array &$suggestions): void {
  if ($route_match->getRouteName() === 'entity.node.canonical') {
    $node_bundle = $route_match->getParameter('node')->bundle();
    array_splice($suggestions, 1, 0, 'page__' . $node_bundle);
  }
}

/**
 * Helper function.
 */
function _add_taxonomy_suggestions(RouteMatchInterface $route_match, array &$suggestions): void {
  if ($route_match->getRouteName() === 'entity.taxonomy_term.canonical') {
    $taxonomy_bundle = $route_match->getParameter('taxonomy_term')->bundle();
    array_splice($suggestions, 1, 0, 'page__taxonomy__' . $taxonomy_bundle);
  }
}

/**
 * Helper function.
 */
function _add_view_suggestions(RouteMatchInterface $route_match, array &$suggestions): void {
  if ($view_name = $route_match->getRouteObject()->getDefault('view_id')) {
    $suggestions[] = 'page__' . $view_name;
  }
}

/**
 * Implements hook_theme_suggestions_page_alter().
 */
function solo_theme_suggestions_page_alter(array &$suggestions, array $variables): void {
  $route_match = \Drupal::service('current_route_match');
  _add_node_suggestions($route_match, $suggestions);
  _add_taxonomy_suggestions($route_match, $suggestions);
  _add_view_suggestions($route_match, $suggestions);
}

/**
 * Implements hook_theme_suggestions_HOOK_alter().
 */
function solo_theme_suggestions_user_alter(array &$suggestions, array $variables) {
  $viewModeKey = '#view_mode';
  $elements = $variables['elements'] ?? [];

  if (isset($elements[$viewModeKey])) {
    $viewMode = str_replace('.', '_', $elements[$viewModeKey]);
    $userId = \Drupal::currentUser()->id();

    $suggestions[] = "user__$viewMode";
    $suggestions[] = "user__$userId";
    $suggestions[] = "user__{$userId}__$viewMode";
  }
}
