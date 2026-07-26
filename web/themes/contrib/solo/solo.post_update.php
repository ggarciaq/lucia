<?php

/**
 * @file
 * Post update functions for the Solo theme.
 */

/**
 * Helper: get all theme names that use Solo as a base theme (including Solo).
 *
 * @return string[]
 *   Array of theme machine names.
 */
function _solo_get_solo_based_themes(): array {
  $theme_handler = \Drupal::service('theme_handler');
  $themes = $theme_handler->listInfo();
  $solo_themes = [];

  foreach ($themes as $theme_name => $theme) {
    if ($theme_name === 'solo') {
      $solo_themes[] = $theme_name;
      continue;
    }
    if (isset($theme->base_themes) && array_key_exists('solo', $theme->base_themes)) {
      $solo_themes[] = $theme_name;
    }
  }

  return $solo_themes;
}

/**
 * Fix schema compliance for Solo and all subthemes.
 *
 * - Removes orphaned settings (primary_menu_keyboard, etc.).
 * - Converts integer 0/1 to proper booleans (top-level and nested).
 * - Converts bare integers to strings where schema expects string.
 * - Converts menu_template_assignments from sequence to mapping.
 * - Migrates flat dynamic keys to nested structure:
 *   site_width_{type} → site_widths.{type}
 *   solo_layout_{region}_{col}_{type} → solo_layouts.{region}.{col}.{type}
 */
function solo_post_update_schema_compliance(): string {
  $themes = _solo_get_solo_based_themes();
  $regions = ['top', 'main', 'bottom', 'footer'];
  $columns = ['2col', '3col', '4col'];

  $stale_keys = [
    'primary_menu_keyboard',
    'primary_sidebar_menu_keyboard',
  ];

  $boolean_keys = [
    'comment_heading_first',
    'comment_show_permalink',
    'comment_show_author',
    'comment_show_date',
    'comment_show_picture',
    'comment_show_new_indicator',
    'footer_use_formatted_text',
    'color_coded_system_tabs',
    'site_breadcrumb_scroll',
    'sm_show_icons',
    'preloader_enabled',
    'preloader_disable_authenticated',
    'preloader_disable_admin_routes',
    'preloader_force_show',
    'back_to_top_enabled',
    'back_to_top_disable_admin_routes',
    'back_to_top_disable_authenticated',
    'back_to_top_hide_small_screens',
  ];

  $nested_booleans = [
    'features.comment_user_picture',
    'features.comment_user_verification',
    'features.favicon',
    'features.logo',
    'features.name',
    'features.node_user_picture',
    'features.slogan',
    'logo.use_default',
    'favicon.use_default',
  ];

  $string_keys = [
    'site_global_regions_gap',
    'site_global_font_size',
  ];

  foreach ($themes as $theme_name) {
    $config = \Drupal::service('config.factory')->getEditable("$theme_name.settings");
    $data = $config->getRawData();

    // 1. Remove orphaned settings.
    foreach ($stale_keys as $key) {
      $config->clear($key);
    }

    // 2. Convert top-level integer booleans to proper booleans.
    foreach ($boolean_keys as $key) {
      $value = $config->get($key);
      if ($value !== NULL && !is_bool($value)) {
        $config->set($key, (bool) $value);
      }
    }

    // 3. Convert nested integer booleans to proper booleans.
    foreach ($nested_booleans as $key) {
      $value = $config->get($key);
      if ($value !== NULL && !is_bool($value)) {
        $config->set($key, (bool) $value);
      }
    }

    // 4. Convert bare integers to strings.
    foreach ($string_keys as $key) {
      $value = $config->get($key);
      if ($value !== NULL && is_int($value)) {
        $config->set($key, (string) $value);
      }
    }

    // 5. Convert menu_template_assignments from sequence to mapping.
    $assignments = $config->get('menu_template_assignments');
    if (is_array($assignments) && !empty($assignments) && array_is_list($assignments)) {
      $mapped = [];
      foreach ($assignments as $row) {
        if (is_array($row) && !empty($row['menu_id'])) {
          $mapped[$row['menu_id']] = [
            'menu_id' => $row['menu_id'],
            'menu_name' => $row['menu_name'] ?? $row['menu_id'],
            'template' => $row['template'] ?? '',
          ];
        }
      }
      $config->set('menu_template_assignments', $mapped);
    }

    // 6. Migrate site_width_{type} → site_widths.{type}.
    foreach ($data as $key => $value) {
      if (str_starts_with($key, 'site_width_') && $key !== 'site_width_') {
        $type_id = substr($key, strlen('site_width_'));
        $config->set("site_widths.$type_id", $value);
        $config->clear($key);
      }
    }

    // 7. Migrate solo_layout_{region}_{col}_{type} → solo_layouts.{region}.{col}.{type}.
    foreach ($data as $key => $value) {
      if (!str_starts_with($key, 'solo_layout_')) {
        continue;
      }
      foreach ($regions as $region) {
        foreach ($columns as $col) {
          $prefix = "solo_layout_{$region}_{$col}_";
          if (str_starts_with($key, $prefix)) {
            $type_id = substr($key, strlen($prefix));
            if ($type_id !== '') {
              $config->set("solo_layouts.$region.$col.$type_id", $value);
              $config->clear($key);
            }
            break 2;
          }
        }
      }
    }

    $config->save();
  }

  return 'Schema compliance fixes applied for Solo and all subthemes.';
}
