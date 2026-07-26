<?php

/**
 * @file
 * Preloader: centralized visibility decision and config.
 *
 * Rule-based, cache-aware. No logic in Twig; library attached conditionally.
 */

/**
 * Resolves a stored logo path to a URL for use in preloader img src.
 *
 * Supports: root-relative (/path), http(s), public://, themes/..., simple filename.
 * Same path formats as theme logo (DRY).
 *
 * @param string $path
 *   Path from config (preloader_logo_url).
 *
 * @return string
 *   URL string, or empty if path is empty/invalid.
 */
function _solo_preloader_resolve_logo_url($path) {
  $path = trim((string) $path);
  if ($path === '') {
    return '';
  }
  // Already absolute URL.
  if (strpos($path, 'http://') === 0 || strpos($path, 'https://') === 0) {
    return $path;
  }
  // Root-relative: use as-is.
  if (strpos($path, '/') === 0) {
    return $path;
  }
  // Stream wrapper or theme path: convert to URL.
  if (strpos($path, 'public://') === 0) {
    try {
      return (string) \Drupal::service('file_url_generator')->generateAbsoluteString($path);
    }
    catch (\Exception $e) {
      return '';
    }
  }
  if (strpos($path, 'themes/') === 0) {
    return '/' . $path;
  }
  // Simple filename: treat as public file.
  if (strpos($path, '://') === FALSE && strpos($path, '/') === FALSE) {
    try {
      return (string) \Drupal::service('file_url_generator')->generateAbsoluteString('public://' . $path);
    }
    catch (\Exception $e) {
      return '';
    }
  }
  return '';
}

/**
 * Determines whether the preloader should be attached for this request.
 *
 * Call from preprocess_html only. Adds cache contexts when visibility
 * depends on user or route.
 *
 * @param string $theme
 *   Active theme machine name (for config).
 *
 * @return array
 *   - show: (bool) Whether to show the preloader and attach library.
 *   - config: (array) Settings for the preloader (style, bg_color, etc.).
 *   - cache_contexts: (array) Cache contexts that were used in the decision.
 */
function _solo_preloader_decision($theme) {
  $config = \Drupal::config($theme . '.settings');
  $force_show = (bool) $config->get('preloader_force_show');
  $show = $force_show || (bool) $config->get('preloader_enabled');
  $cache_contexts = [];

  if (!$show) {
    return ['show' => FALSE, 'config' => [], 'cache_contexts' => []];
  }

  $logo_use_theme = (bool) $config->get('preloader_logo_use_theme');
  $logo_url = $logo_use_theme
    ? trim((string) (theme_get_setting('logo.url') ?? ''))
    : _solo_preloader_resolve_logo_url($config->get('preloader_logo_url') ?? '');

  // Validate transition effect (shared by force_show and normal paths).
  $valid_transitions = ['fade', 'slide_up', 'slide_down', 'slide_left', 'slide_right', 'zoom_out', 'blur'];
  $transition = $config->get('preloader_transition') ?: 'fade';
  $transition = in_array($transition, $valid_transitions, TRUE) ? $transition : 'fade';

  // Force show for testing: ignore visibility rules, show 30s on every page.
  if ($force_show) {
    $cache_contexts[] = 'user.roles';
    $cache_contexts[] = 'route';
    $r_bg = trim((string) ($config->get('settings_preloader___r_bg') ?? ''));
    $r_tx = trim((string) ($config->get('settings_preloader___r_tx') ?? ''));
    $max_display = (int) ($config->get('preloader_max_display_seconds') ?: 8);
    $max_display = max(3, min(60, $max_display));
    return [
      'show' => TRUE,
      'config' => [
        'style' => $config->get('preloader_style') ?? 'spinner',
        'spinner_show_percent' => (bool) $config->get('preloader_spinner_show_percent'),
        'max_display_seconds' => $max_display,
        'r_bg' => $r_bg !== '' ? $r_bg : '#ffffff',
        'r_tx' => $r_tx !== '' ? $r_tx : '#000000',
        'logo_url' => $logo_url,
        'logo_width' => (int) ($config->get('preloader_logo_width') ?: 160),
        'logo_height' => (int) ($config->get('preloader_logo_height') ?: 80),
        'logo_opacity' => min(100, max(0, (int) ($config->get('preloader_logo_opacity') ?: 100))),
        'text' => trim((string) ($config->get('preloader_text') ?? '')),
        'text_font' => trim((string) ($config->get('preloader_text_font') ?? '')),
        'text_font_size' => (int) ($config->get('preloader_text_font_size') ?: 24),
        'text_animate_effect' => trim((string) ($config->get('preloader_text_animate_effect') ?? '')),
        'transition' => $transition,
        'hide_on' => 'dom_ready',
        'force_show' => TRUE,
      ],
      'cache_contexts' => array_unique($cache_contexts),
    ];
  }

  $user = \Drupal::currentUser();
  $route_match = \Drupal::routeMatch();
  $route_name = $route_match ? $route_match->getRouteName() : '';
  // Pass an empty string so _solo_preloader_is_admin_route() resolves the path
  // from the request itself; getRawParameters() returns route parameters
  // (e.g. {node}), not the URL path.
  $path = '';

  // Disable for authenticated users.
  if ($config->get('preloader_disable_authenticated') !== FALSE) {
    $cache_contexts[] = 'user.roles';
    if (!$user->isAnonymous()) {
      return ['show' => FALSE, 'config' => [], 'cache_contexts' => $cache_contexts];
    }
  }

  // Disable on admin routes.
  if ($config->get('preloader_disable_admin_routes') !== FALSE) {
    $cache_contexts[] = 'route';
    if (_solo_preloader_is_admin_route($route_name, $path)) {
      return ['show' => FALSE, 'config' => [], 'cache_contexts' => $cache_contexts];
    }
  }

  // Path include/exclude rules.
  $path_rules = trim((string) $config->get('preloader_path_rules') ?? '');
  if ($path_rules !== '') {
    $cache_contexts[] = 'route';
    $current_path = \Drupal::request()->getPathInfo();
    $path_matches = _solo_preloader_path_rules_match($path_rules, $current_path);
    if ($path_matches === FALSE) {
      return ['show' => FALSE, 'config' => [], 'cache_contexts' => $cache_contexts];
    }
  }

  $r_bg = trim((string) ($config->get('settings_preloader___r_bg') ?? ''));
  $r_tx = trim((string) ($config->get('settings_preloader___r_tx') ?? ''));
  $max_display = (int) ($config->get('preloader_max_display_seconds') ?: 8);
  $max_display = max(3, min(60, $max_display));
  $hide_on = $config->get('preloader_hide_on') ?: 'dom_ready';
  $hide_on = $hide_on === 'dom_ready' ? 'dom_ready' : 'load';
  return [
    'show' => TRUE,
    'config' => [
      'style' => $config->get('preloader_style') ?? 'spinner',
      'spinner_show_percent' => (bool) $config->get('preloader_spinner_show_percent'),
      'max_display_seconds' => $max_display,
      'r_bg' => $r_bg !== '' ? $r_bg : '#ffffff',
      'r_tx' => $r_tx !== '' ? $r_tx : '#000000',
      'logo_url' => $logo_url,
      'logo_width' => (int) ($config->get('preloader_logo_width') ?: 160),
      'logo_height' => (int) ($config->get('preloader_logo_height') ?: 80),
      'logo_opacity' => min(100, max(0, (int) ($config->get('preloader_logo_opacity') ?: 100))),
      'text' => trim((string) ($config->get('preloader_text') ?? '')),
      'text_font' => trim((string) ($config->get('preloader_text_font') ?? '')),
      'text_font_size' => (int) ($config->get('preloader_text_font_size') ?: 24),
      'text_animate_effect' => trim((string) ($config->get('preloader_text_animate_effect') ?? '')),
      'transition' => $transition,
      'hide_on' => $hide_on,
      'force_show' => FALSE,
    ],
    'cache_contexts' => array_unique($cache_contexts),
  ];
}

/**
 * Checks if the current route is an admin/editor route.
 *
 * @param string $route_name
 *   Route name.
 * @param string $path
 *   Path (may be empty).
 *
 * @return bool
 *   TRUE if the route or path is considered admin/editor, FALSE otherwise.
 */
function _solo_preloader_is_admin_route($route_name, $path) {
  if ($route_name === NULL || $route_name === '') {
    $path = $path ?: \Drupal::request()->getPathInfo();
    return (bool) preg_match('#^/admin#', $path);
  }
  $admin_routes = [
    'system.admin',
    'system.admin_content',
    'system.admin_structure',
    'system.theme_settings',
    'entity.node.edit_form',
    'entity.node.delete_form',
    'entity.block_content.edit_form',
    'layout_builder.overrides.node.view',
    'layout_builder.defaults.node.view',
  ];
  if (in_array($route_name, $admin_routes, TRUE)) {
    return TRUE;
  }
  if (strpos($route_name, 'entity.') === 0 && (strpos($route_name, '.edit_form') !== FALSE || strpos($route_name, '.delete_form') !== FALSE)) {
    return TRUE;
  }
  if (strpos($route_name, 'layout_builder.') === 0) {
    return TRUE;
  }
  $path = $path ?: \Drupal::request()->getPathInfo();
  return (bool) preg_match('#^/admin#', $path);
}

/**
 * Applies path include/exclude rules.
 *
 * Exclude: prefix with a minus sign (e.g. -/contact, -/about or -contact, -about).
 * Include only: list paths without prefix (e.g. / for front page, /products).
 * Empty lines ignored. Paths are matched against the current request path.
 *
 * @param string $rules
 *   One path per line.
 * @param string $current_path
 *   Current path from request (e.g. getPathInfo()).
 *
 * @return bool|null
 *   TRUE if preloader should show, FALSE if not, NULL if rules don't apply.
 */
function _solo_preloader_path_rules_match($rules, $current_path) {
  $lines = array_filter(array_map('trim', explode("\n", $rules)));
  if (empty($lines)) {
    return NULL;
  }
  $normalize = function ($p) {
    $p = trim((string) $p, "/ \t");
    return $p === '' ? '' : '/' . $p;
  };
  $current_path = $normalize($current_path);
  $include_only = [];
  $exclude = [];
  foreach ($lines as $line) {
    if ($line === '') {
      continue;
    }
    // Any line starting with minus is exclude (e.g. -/contact, -contact).
    if ($line[0] === '-') {
      $exclude[] = $normalize(substr($line, 1));
    }
    else {
      $include_only[] = $normalize($line);
    }
  }
  // Apply excludes first: exact match or path prefix (e.g. /contact matches /contact/team).
  foreach ($exclude as $p) {
    if ($current_path === $p) {
      return FALSE;
    }
    if ($p !== '' && strpos($current_path . '/', $p . '/') === 0) {
      return FALSE;
    }
  }
  // If there are include-only rules, show only when current path matches one.
  if (!empty($include_only)) {
    foreach ($include_only as $p) {
      if ($current_path === $p) {
        return TRUE;
      }
      if ($p !== '' && strpos($current_path . '/', $p . '/') === 0) {
        return TRUE;
      }
    }
    return FALSE;
  }
  return NULL;
}
