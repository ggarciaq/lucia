<?php

/**
 * @file
 * Solo Theme.
 *
 * Filename:     theme-settings
 * Website:      http://www.flashwebcenter.com
 * Description:  template
 * Author:       Alaa Haddad http://www.alaahaddad.com.
 */

use Drupal\Core\Cache\Cache;
use Drupal\Core\Config\Config;
use Drupal\Component\Utility\Html;
use Drupal\Component\Utility\NestedArray;
use Drupal\Component\Utility\UrlHelper;
use Drupal\Core\Form\FormStateInterface;

// ============================================================================
// FEATURE DEFAULT VALUE HELPERS
// These functions are the single source of truth for default values.
// Values MUST stay in sync with config/install/solo.settings.yml.
// Called from both the reset path (disable) and the enabled-save path to
// ensure any missing submitted values fall back to a known-good default.
// ============================================================================

/**
 * Returns canonical default values for all preloader settings.
 *
 * These values MUST match config/install/solo.settings.yml exactly.
 * Adding a new preloader setting? Add it here AND in the YAML.
 *
 * @return array
 *   Keyed by config key, values are the schema-correct typed defaults.
 */
function _solo_get_preloader_defaults(): array {
  return [
    'preloader_enabled'               => FALSE,
    'preloader_force_show'            => FALSE,
    'preloader_disable_authenticated' => TRUE,
    'preloader_disable_admin_routes'  => TRUE,
    'preloader_path_rules'            => '',
    'preloader_hide_on'               => 'dom_ready',
    'preloader_transition'            => 'fade',
    'preloader_max_display_seconds'   => 8,
    'preloader_style'                 => 'spinner',
    'preloader_spinner_show_percent'  => FALSE,
    'preloader_logo_use_theme'        => TRUE,
    'preloader_logo_url'              => '',
    'preloader_logo_width'            => 160,
    'preloader_logo_height'           => 80,
    'preloader_logo_opacity'          => 100,
    'preloader_text'                  => '',
    'preloader_text_font'             => '',
    'preloader_text_font_size'        => 24,
    'preloader_text_animate_effect'   => '',
    'settings_preloader___r_tx'       => '',
    'settings_preloader___r_bg'       => '',
    'preloader_bg_opacity'            => 100,
  ];
}

/**
 * Returns canonical default values for all back-to-top settings.
 *
 * These values MUST match config/install/solo.settings.yml exactly.
 * Adding a new back-to-top setting? Add it here AND in the YAML.
 *
 * @return array
 *   Keyed by config key, values are the schema-correct typed defaults.
 */
function _solo_get_back_to_top_defaults(): array {
  return [
    'back_to_top_enabled'               => FALSE,
    'back_to_top_disable_admin_routes'  => TRUE,
    'back_to_top_disable_authenticated' => FALSE,
    'back_to_top_hide_small_screens'    => FALSE,
    'back_to_top_scroll_threshold'      => 400,
    'back_to_top_position'              => 'bottom-right',
    'back_to_top_style'                 => 'solid',
    'back_to_top_icon'                  => 'arrow-up',
    'settings_back_to_top___r_bg'       => '',
    'settings_back_to_top___r_tx'       => '',
  ];
}

/**
 * Resets all config keys for a feature to their canonical defaults.
 *
 * Called when a feature is disabled so the config store contains clean
 * schema-correct values, not stale user customisations. On re-enable the
 * form will show defaults instead of the previous configuration.
 *
 * Using explicit set() (not clear()) guarantees the value is written to the
 * active config store regardless of install/default config fallback behaviour,
 * which is important for sub-themes that may not ship their own defaults.
 *
 * @param \Drupal\Core\Config\Config $config
 *   Editable config object for the active theme.
 * @param array $defaults
 *   Array from _solo_get_preloader_defaults() or _solo_get_back_to_top_defaults().
 */
function _solo_reset_feature_config(Config $config, array $defaults): void {
  foreach ($defaults as $key => $value) {
    $config->set($key, $value);
  }
}

/**
 * Saves a feature's config from submitted form values, falling back to defaults.
 *
 * Iterates over the canonical defaults array so we always save every key.
 * Values are type-cast to match the schema type of each default, preventing
 * integer 1/0 from being stored when a boolean is expected.
 *
 * @param \Drupal\Core\Config\Config $config
 *   Editable config object for the active theme.
 * @param array $defaults
 *   Array from _solo_get_preloader_defaults() or _solo_get_back_to_top_defaults().
 * @param array $flat_values
 *   Flat array of submitted values (from _solo_flatten_form_section()).
 */
function _solo_save_feature_config(Config $config, array $defaults, array $flat_values): void {
  foreach ($defaults as $key => $default_value) {
    $value = array_key_exists($key, $flat_values) ? $flat_values[$key] : $default_value;
    // Cast to the same PHP type as the default to satisfy config schema.
    if (is_bool($default_value)) {
      $value = (bool) $value;
    }
    elseif (is_int($default_value)) {
      $value = (int) $value;
    }
    $config->set($key, $value);
  }
}

/**
 * Extracts a nested form section from multiple candidate paths.
 *
 * Sub-theme fallback only. Solo's own form uses #tree = FALSE (Drupal default)
 * on all container elements, meaning submitted values are stored flat at the
 * root of $form_state->getValues(). This helper is therefore only reached when
 * a sub-theme explicitly sets #tree = TRUE on a parent container, producing a
 * nested values structure that requires path-based lookup.
 *
 * @param array $values
 *   Full form_state->getValues() array.
 * @param array $paths
 *   List of candidate NestedArray key-path arrays, tried in order.
 *
 * @return array
 *   The form section array, or an empty array if none found.
 */
function _solo_find_form_section(array $values, array $paths): array {
  foreach ($paths as $path) {
    $section = NestedArray::getValue($values, $path);
    if (is_array($section)) {
      return $section;
    }
  }
  return [];
}

/**
 * Flattens a nested form section into a single-level associative array.
 *
 * Sub-theme fallback only (paired with _solo_find_form_section()). When a
 * sub-theme's #tree = TRUE produces nested form state values, fieldsets like
 * 'visibility', 'appearance', 'style', and 'position' create additional
 * nesting. This helper recurses into sub-arrays and hoists scalar values to
 * the top level so every config key is reachable without caring which fieldset
 * it lives in.
 *
 * Only scalar values are hoisted; array values (sub-fieldsets) are recursed
 * into but not added themselves.
 *
 * @param array $section
 *   The nested form section array.
 *
 * @return array
 *   Flat associative array of all scalar values found in the section.
 */
function _solo_flatten_form_section(array $section): array {
  $flat = [];
  foreach ($section as $key => $value) {
    if (is_array($value)) {
      $flat += _solo_flatten_form_section($value);
    }
    else {
      $flat[$key] = $value;
    }
  }
  return $flat;
}

/**
 * Returns TRUE if a URL is safe for use as an image src attribute.
 *
 * Allows root-relative URLs (starting with /) and absolute http/https URLs.
 * Rejects javascript:, data:, and other non-image-safe schemes.
 *
 * @param string $url
 *   URL to test.
 *
 * @return bool
 *   TRUE if safe, FALSE otherwise.
 */
function _solo_is_safe_image_url(string $url): bool {
  if ($url === '') {
    return TRUE;
  }
  // Root-relative paths are always safe.
  if (strpos($url, '/') === 0) {
    return TRUE;
  }
  // Absolute URLs must be http or https.
  if (!UrlHelper::isValid($url, TRUE)) {
    return FALSE;
  }
  $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
  return in_array($scheme, ['http', 'https'], TRUE);
}

/**
 * Returns TRUE if a path is safe for use as a logo (theme settings / preloader).
 *
 * Allows: root-relative (/path), http(s), public://, themes/..., or a simple
 * filename (e.g. logo.svg for public filesystem). Rejects javascript:, data:,
 * and other unsafe schemes. Use for "Path to custom logo" validation (DRY).
 *
 * @param string $path
 *   Path or URL to validate.
 *
 * @return bool
 *   TRUE if safe.
 */
function _solo_is_safe_logo_path(string $path): bool {
  if ($path === '') {
    return TRUE;
  }
  $path = trim($path);
  if ($path === '') {
    return TRUE;
  }
  // Root-relative.
  if (strpos($path, '/') === 0) {
    return TRUE;
  }
  // Stream wrapper: only public://.
  if (strpos($path, 'public://') === 0) {
    return TRUE;
  }
  // Theme-relative path.
  if (strpos($path, 'themes/') === 0) {
    return TRUE;
  }
  // Simple filename (no scheme, no slash) — treated as public file.
  if (strpos($path, '://') === FALSE && strpos($path, '/') === FALSE) {
    return TRUE;
  }
  // Absolute http(s) URL.
  if (UrlHelper::isValid($path, TRUE)) {
    $scheme = strtolower((string) parse_url($path, PHP_URL_SCHEME));
    return in_array($scheme, ['http', 'https'], TRUE);
  }
  return FALSE;
}

/**
 * Implements hook_form_system_theme_settings_alter().
 */
function solo_form_system_theme_settings_alter(&$form, FormStateInterface $form_state) {
  $form['#validate'][] = 'solo_theme_settings_validate';
  $form['logo']['#weight'] = 97;
  $form['favicon']['#open'] = FALSE;
  $form['favicon']['#weight'] = 98;
  $form['theme_settings']['#open'] = FALSE;
  $form['theme_settings']['#weight'] = 99;

  $form['#attached']['library'][] = 'solo/solo-form-theme-settings';
  // Variables below are used by required theme settings include files.
  // phpcs:disable DrupalPractice.CodeAnalysis.VariableAnalysis.UnusedVariable
  $d_s = date('j  F,  Y');
  $d_m = date('D F d, o');
  $d_l = date('g:i A T, D F d, o');
  $updated_regions = _get_updated_regions();
  $counts = _count_regions();
  $attributes = _get_region_attributes();
  // phpcs:enable DrupalPractice.CodeAnalysis.VariableAnalysis.UnusedVariable

  $layout_region_override_toggles = [
    'enable_per_type_layout_top' => 0,
    'enable_per_type_layout_main' => 0,
    'enable_per_type_layout_bottom' => 0,
    'enable_per_type_layout_footer' => 0,
  ];

  foreach ($layout_region_override_toggles as $setting_key => $default_value) {
    if (!isset($form_state->getValues()[$setting_key])) {
      $form_state->setValue($setting_key, $default_value);
    }
  }

  // Theme settings files.
  require_once __DIR__ . '/includes/_theme_settings_blueprint.inc';
  require_once __DIR__ . '/includes/_theme_settings_global_misc.inc';
  require_once __DIR__ . '/includes/_theme_settings_libraries_fonts.inc';
  require_once __DIR__ . '/includes/_theme_settings_search_results.inc';
  require_once __DIR__ . '/includes/_theme_settings_predefined_themes.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_page_wrapper.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_highlighted.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_popup_login_block.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_fixed_search_block.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_header.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_primary_sidebar_menu.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_primary_menu.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_welcome_text.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_top.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_system_messages.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_page_title.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_breadcrumb.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_main.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_bottom.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_footer.inc';
  require_once __DIR__ . '/includes/_theme_settings_layout_footer_menu.inc';
  require_once __DIR__ . '/includes/_theme_settings_sm_icons.inc';
  require_once __DIR__ . '/includes/_theme_settings_credit_copyright.inc';

  $form['#submit'][] = '_solo_theme_settings_submit';
}

/**
 * Validation handler for the Solo system_theme_settings form.
 */
function solo_theme_settings_validate($form, FormStateInterface $form_state) {
  // -----------------------------------------------------------------------
  // Preloader logo: when not using theme logo, validate custom path (DRY with
  // theme logo path: public://, themes/, root-relative, http(s), filename).
  // -----------------------------------------------------------------------
  $preloader_enabled = $form_state->getValue('preloader_enabled');
  $preloader_logo_use_theme = $form_state->getValue('preloader_logo_use_theme');
  $preloader_logo_url = (string) ($form_state->getValue('preloader_logo_url') ?? '');

  if ($preloader_enabled === NULL || $preloader_logo_use_theme === NULL) {
    $preloader_section = _solo_find_form_section($form_state->getValues(), [
      ['solo_settings', 'settings_global_misc', 'global_misc_tabs', 'preloader'],
      ['solo_settings', 'settings_global_misc', 'preloader'],
    ]);
    $flat = $preloader_section ? _solo_flatten_form_section($preloader_section) : [];
    $preloader_enabled = $preloader_enabled ?? $flat['preloader_enabled'] ?? NULL;
    $preloader_logo_use_theme = $preloader_logo_use_theme ?? $flat['preloader_logo_use_theme'] ?? NULL;
    $preloader_logo_url = $preloader_logo_url !== '' ? $preloader_logo_url : (string) ($flat['preloader_logo_url'] ?? '');
  }

  if (!empty($preloader_enabled) && empty($preloader_logo_use_theme)) {
    $path = trim($preloader_logo_url);
    if ($path !== '' && !_solo_is_safe_logo_path($path)) {
      $form_state->setError(
        $form,
        t('The preloader logo path is not valid. Use a path like logo.svg (public filesystem), public://logo.svg, or themes/contrib/solo/logo.svg.')
      );
    }
  }

  // -----------------------------------------------------------------------
  // Footer link: only validate separate fields when not using formatted text.
  // -----------------------------------------------------------------------
  if ($form_state->getValue('footer_use_formatted_text')) {
    return;
  }

  $url = $form_state->getValue('footer_link');
  $text = $form_state->getValue('footer_link_text');

  if ($url !== '' && !UrlHelper::isValid($url, TRUE)) {
    $form_state->setErrorByName('footer_link', t('The URL %url is not valid.', [
      '%url' => $url,
    ]));
  }

  if (!empty($url) && empty($text)) {
    $form_state->setErrorByName('footer_link_text', t('You must enter link text if you provide a URL.'));
  }
}

/**
 * Sets or clears a layout config value based on global comparison.
 *
 * @param \Drupal\Core\Config\Config $config
 *   The editable theme config object.
 * @param string $key
 *   The per-content-type config key (e.g. 'solo_layout_main_2col_article').
 * @param mixed $value
 *   The user-submitted value.
 * @param mixed $global
 *   The global fallback value.
 *
 * @return void
 *   This function does not return a value.
 */
function _solo_set_or_clear_layout(Config $config, $key, $value, $global) {
  if ($value !== NULL && $value !== $global) {
    $config->set($key, $value);
  }
  else {
    $config->clear($key);
  }
}

/**
 * Form submit handler for the Solo theme settings form.
 *
 * Handles settings that require custom logic beyond what the core
 * system_theme_settings_submit() provides:
 *
 * - Per-content-type layout overrides (top, main, bottom, footer regions).
 * - Popup login settings reset when the feature is disabled.
 * - Preloader feature: reset to defaults on disable, save submitted values
 *   on enable. Uses _solo_get_preloader_defaults() as the single source of
 *   truth for default values and key enumeration.
 * - Back-to-top feature: same pattern as preloader.
 * - Menu template assignments (sequence config).
 * - File usage tracking for the footer formatted text field.
 *
 * @param array $form
 *   The complete form structure.
 * @param \Drupal\Core\Form\FormStateInterface $form_state
 *   The current state of the submitted form.
 *
 * @see _solo_get_preloader_defaults()
 * @see _solo_get_back_to_top_defaults()
 * @see _solo_reset_feature_config()
 * @see _solo_save_feature_config()
 * @see _solo_set_or_clear_layout()
 */
function _solo_theme_settings_submit($form, FormStateInterface $form_state) {
  // Get the theme whose settings are being altered.
  $theme = $form_state->getBuildInfo()['args'][0];
  $config = \Drupal::configFactory()->getEditable("$theme.settings");

  $content_types = \Drupal::entityTypeManager()->getStorage('node_type')->loadMultiple();
  $regions = ['top', 'main', 'bottom', 'footer'];

  // Handle per-content-type width cleanup when disabled.
  $custom_widths_enabled = (bool) $form_state->getValue('enable_custom_widths', FALSE);
  $config->set('enable_custom_widths', $custom_widths_enabled);

  foreach ($content_types as $type) {
    $type_id = $type->id();
    $flat_key = "site_width_$type_id";
    // Read from the flat form value (saved by default handler).
    $val = $form_state->getValue($flat_key);
    // Clear the flat key (default handler may have saved it).
    $config->clear($flat_key);

    if ($custom_widths_enabled && !empty($val)) {
      $config->set("site_widths.$type_id", $val);
    }
    else {
      $config->clear("site_widths.$type_id");
    }
  }

  foreach ($regions as $region) {
    $enable_key = "enable_per_type_layout_$region";
    $enabled = (bool) $form_state->getValue($enable_key, FALSE);
    $config->set($enable_key, $enabled);

    foreach ($content_types as $type_id => $type) {
      foreach ([2, 3, 4] as $col) {
        $flat_key = "solo_layout_{$region}_{$col}col_$type_id";
        $nested_key = "solo_layouts.$region.{$col}col.$type_id";
        // Clear the flat key (default handler may have saved it).
        $config->clear($flat_key);

        if ($enabled) {
          $val = $form_state->getValue($flat_key);
          $global = $form_state->getValue("{$region}_{$col}col");
          _solo_set_or_clear_layout($config, $nested_key, $val, $global);
        }
        else {
          // On disable, clear overrides (they will fallback to global).
          $config->clear($nested_key);
        }
      }
    }
  }
  if (!$form_state->getValue('header_popup_login')) {
    // Reset ALL popup login settings to defaults.
    $settings_to_reset = [
      'header_login_links' => 'Login',
      'popup_login_use_inline_styles' => FALSE,
      'popup_login_animation_duration' => 300,
      'popup_login_close_on_escape' => TRUE,
      'popup_login_close_on_outside_click' => TRUE,
      'popup_login_focus_trap' => TRUE,
      'popup_login_announce_to_screen_readers' => TRUE,
      'popup_login_return_focus_on_close' => TRUE,
      'popup_login_custom_triggers' => '',
      'popup_login_z_index' => 10000,
      'popup_login_overlay_opacity' => 50,
    ];

    // Reset each setting.
    foreach ($settings_to_reset as $key => $default_value) {
      $form_state->setValue($key, $default_value);
    }

    // Clear the stored theme settings.
    foreach ($settings_to_reset as $key => $default_value) {
      $config->clear($key);
    }

  }

  // Menu template assignments (menu_id + template per row).
  $path = [
    'solo_settings',
    'settings_global_misc',
    'menu_template_assignment',
    'menu_template_assignments',
  ];
  $assignments = NestedArray::getValue($form_state->getValues(), $path);
  if (!is_array($assignments)) {
    $assignments = [];
  }
  $cleaned = [];
  foreach ($assignments as $row) {
    if (is_array($row) && !empty($row['menu_id']) && !empty($row['template'])) {
      $cleaned[$row['menu_id']] = [
        'menu_id' => $row['menu_id'],
        'menu_name' => $row['menu_name'] ?? $row['menu_id'],
        'template' => $row['template'],
      ];
    }
  }
  $config->set('menu_template_assignments', $cleaned);

  // -------------------------------------------------------------------------
  // Preloader settings.
  //
  // Solo uses #tree = FALSE (Drupal default) on all container elements, so
  // submitted values are flat at the root of $form_state->getValues().
  //
  // WHY we reset both form state AND config on disable:
  // ThemeSettingsForm::submitForm() (the Drupal core form-class handler) runs
  // AFTER all $form['#submit'] handlers, including ours. It iterates every
  // flat form-state value and re-saves them all to config. Hidden fields
  // controlled by #states still submit their last DOM value, so the old
  // custom settings would be re-saved by core's handler even after we reset
  // the config object. By also calling $form_state->setValue() we replace
  // those stale values in form state BEFORE core's save runs, ensuring the
  // final persisted values are always the canonical defaults.
  //
  // DISABLE path: reset form state values AND config to canonical defaults.
  // ENABLE path:  read every config key from flat form state, save to config.
  // -------------------------------------------------------------------------
  $preloader_defaults = _solo_get_preloader_defaults();

  // Determine enabled state: flat first, nested fallback for sub-themes.
  $preloader_enabled = $form_state->getValue('preloader_enabled');
  $preloader_nested = NULL;
  if ($preloader_enabled === NULL) {
    $preloader_nested = _solo_find_form_section($form_state->getValues(), [
      ['solo_settings', 'settings_global_misc', 'preloader'],
    ]);
    $preloader_enabled = $preloader_nested['preloader_enabled'] ?? NULL;
  }

  if (empty($preloader_enabled)) {
    // DISABLE: overwrite form state values with defaults so ThemeSettingsForm
    // ::submitForm() (runs after this handler) saves defaults, not stale
    // hidden-field values. Also reset the config object directly.
    foreach ($preloader_defaults as $key => $default_value) {
      $form_state->setValue($key, $default_value);
    }
    _solo_reset_feature_config($config, $preloader_defaults);
  }
  else {
    // ENABLE: collect submitted values from flat form state.
    $flat_preloader = [];
    foreach (array_keys($preloader_defaults) as $key) {
      $val = $form_state->getValue($key);
      if ($val !== NULL) {
        $flat_preloader[$key] = $val;
      }
    }
    // Nested fallback for sub-themes that use #tree = TRUE on a parent.
    if (empty($flat_preloader)) {
      if ($preloader_nested === NULL) {
        $preloader_nested = _solo_find_form_section($form_state->getValues(), [
          ['solo_settings', 'settings_global_misc', 'preloader'],
        ]);
      }
      $flat_preloader = _solo_flatten_form_section($preloader_nested ?? []);
    }
    _solo_save_feature_config($config, $preloader_defaults, $flat_preloader);
  }

  // -------------------------------------------------------------------------
  // Back to top settings.  Same pattern as preloader above.
  // -------------------------------------------------------------------------
  $back_to_top_defaults = _solo_get_back_to_top_defaults();

  $back_to_top_enabled = $form_state->getValue('back_to_top_enabled');
  $back_to_top_nested = NULL;
  if ($back_to_top_enabled === NULL) {
    $back_to_top_nested = _solo_find_form_section($form_state->getValues(), [
      ['solo_settings', 'settings_global_misc', 'back_to_top'],
    ]);
    $back_to_top_enabled = $back_to_top_nested['back_to_top_enabled'] ?? NULL;
  }

  if (empty($back_to_top_enabled)) {
    // DISABLE: same dual-reset pattern as preloader.
    foreach ($back_to_top_defaults as $key => $default_value) {
      $form_state->setValue($key, $default_value);
    }
    _solo_reset_feature_config($config, $back_to_top_defaults);
  }
  else {
    $flat_btt = [];
    foreach (array_keys($back_to_top_defaults) as $key) {
      $val = $form_state->getValue($key);
      if ($val !== NULL) {
        $flat_btt[$key] = $val;
      }
    }
    if (empty($flat_btt)) {
      if ($back_to_top_nested === NULL) {
        $back_to_top_nested = _solo_find_form_section($form_state->getValues(), [
          ['solo_settings', 'settings_global_misc', 'back_to_top'],
        ]);
      }
      $flat_btt = _solo_flatten_form_section($back_to_top_nested ?? []);
    }
    _solo_save_feature_config($config, $back_to_top_defaults, $flat_btt);
  }

  // Update file usage for embedded files in the copyright formatted text.
  _solo_footer_formatted_file_usage($form_state, $theme);

  // Save configuration first, then reset the static cache so subsequent
  // theme_get_setting() calls within the same request read the saved values.
  $config->save();
  \Drupal::configFactory()->reset($theme . '.settings');

  // Write dynamic CSS/JS files after config is saved so settings and files
  // stay in sync. Must happen before cache clears so aggregation picks up
  // the new files. An empty string tells the helper to delete the file
  // (user wiped the textarea); a real value replaces it.
  _solo_write_dynamic_assets(
    (string) $form_state->getValue('site_css_dynamic'),
    (string) $form_state->getValue('site_js_dynamic')
  );

  // Reset the global asset query string. When JS/CSS aggregation is OFF,
  // browsers cache the dynamic files by their stable URI + the global
  // asset query string. Without this reset the updated file bytes would
  // remain stale in the browser until the next full cache rebuild.
  \Drupal::service('asset.query_string')->reset();

  // Clear theme registry.
  \Drupal::service('theme.registry')->reset();

  // Clear library discovery. Also forces solo_library_info_alter() to
  // re-run on the next discovery, which re-checks the on-disk files.
  \Drupal::service('library.discovery')->clearCachedDefinitions();

  // Clear Twig cache.
  \Drupal::service('twig')->invalidate();

  // Invalidate config cache tags so cached pages reflect the new settings.
  Cache::invalidateTags(['config:' . $theme . '.settings']);
}

/**
 * Parses HTML for file entity UUIDs (data-entity-type="file" data-entity-uuid).
 *
 * Mirrors the logic of editor_parse_file_uuids() so theme settings can track
 * embedded file usage without requiring the editor module.
 *
 * @param string $text
 *   Partial (X)HTML snippet.
 *
 * @return array
 *   Array of file entity UUIDs found in the markup.
 *
 * @see editor_parse_file_uuids()
 */
function _solo_parse_file_uuids_from_html($text) {
  if (empty($text) || !is_string($text)) {
    return [];
  }
  $dom = Html::load($text);
  $xpath = new \DOMXPath($dom);
  $uuids = [];
  foreach ($xpath->query('//*[@data-entity-type="file" and @data-entity-uuid]') as $node) {
    $uuids[] = $node->getAttribute('data-entity-uuid');
  }
  return $uuids;
}

/**
 * Updates file usage for files embedded in the copyright formatted text.
 *
 * Marks newly referenced files as permanent and tracks usage; removes usage
 * for files no longer present when the content is updated.
 *
 * @param \Drupal\Core\Form\FormStateInterface $form_state
 *   The form state (contains the new formatted value).
 * @param string $theme
 *   The theme machine name (used as the file usage module/theme identifier).
 */
function _solo_footer_formatted_file_usage(FormStateInterface $form_state, $theme) {
  $formatted = $form_state->getValue('footer_copyright_formatted');
  if (!is_array($formatted) || empty($formatted['value'])) {
    $formatted = ['value' => '', 'format' => 'basic_html'];
  }
  $new_uuids = _solo_parse_file_uuids_from_html($formatted['value']);

  $config = \Drupal::config($theme . '.settings');
  $old_formatted = $config->get('footer_copyright_formatted');
  $old_value = is_array($old_formatted) && isset($old_formatted['value']) ? $old_formatted['value'] : '';
  $old_uuids = _solo_parse_file_uuids_from_html($old_value);

  $entity_repository = \Drupal::service('entity.repository');
  $file_usage = \Drupal::service('file.usage');

  foreach (array_diff($new_uuids, $old_uuids) as $uuid) {
    $file = $entity_repository->loadEntityByUuid('file', $uuid);
    if ($file && $file->isTemporary()) {
      $file->setPermanent();
      $file->save();
    }
    if ($file) {
      $file_usage->add($file, $theme, 'theme', $theme);
    }
  }

  foreach (array_diff($old_uuids, $new_uuids) as $uuid) {
    $file = $entity_repository->loadEntityByUuid('file', $uuid);
    if ($file) {
      $file_usage->delete($file, $theme, 'theme', $theme);
    }
  }
}
