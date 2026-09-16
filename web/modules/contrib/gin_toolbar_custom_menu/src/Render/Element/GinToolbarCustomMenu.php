<?php

namespace Drupal\gin_toolbar_custom_menu\Render\Element;

use Drupal\Core\Security\TrustedCallbackInterface;
use Drupal\gin_toolbar_custom_menu\GinToolbarCustomMenuInterface;

/**
 * Gin Toolbar Custom Menu.
 *
 * @package Drupal\gin_toolbar_custom_menu\Render\Element
 */
class GinToolbarCustomMenu implements TrustedCallbackInterface {

  /**
   * {@inheritdoc}
   */
  public static function trustedCallbacks(): array {
    return ['preRenderTray'];
  }

  /**
   * Renders the toolbar's administration tray.
   *
   * This is a clone of core's toolbar_prerender_toolbar_administration_tray()
   * function, which adds active trail information and which uses setMaxDepth(4)
   * instead of setTopLevelOnly() in case the Admin Toolbar module is installed.
   *
   * @param array $build
   *   A renderable array.
   *
   * @return array
   *   The updated renderable array.
   *
   * @see toolbar_prerender_toolbar_administration_tray()
   */
  public static function preRenderTray(array $build): array {
    $build['#cache']['tags'][] = 'gin_toolbar_custom_menu:settings';
    $settings_to_apply = _gin_toolbar_custom_menu_get_setting();

    if (empty($settings_to_apply)) {
      return $build;
    }
    $menu_items = _gin_toolbar_custom_menu_get_menu_items($build);
    if (!empty($menu_items)) {
      // A user may not have access to other administration menu items.
      $build["administration_menu"]["#items"] =
        is_array($build["administration_menu"]["#items"] ?? NULL)
        ? $build["administration_menu"]["#items"]
        : [];

      $show_admin = \Drupal::config('gin_toolbar_custom_menu.settings')->get('keep_admin_menu');
      $settings = array_shift($settings_to_apply);
      if (isset($settings['admin_menu']) && ($settings['admin_menu'] !== GinToolbarCustomMenuInterface::ADMIN_MENU_GLOBAL)) {
        $show_admin = $settings['admin_menu'] == GinToolbarCustomMenuInterface::ADMIN_MENU_SHOW;
      }
      if ($show_admin) {
        $build["administration_menu"]["#items"] += $menu_items;
      }
      else {
        if (isset($build["administration_menu"]["#items"]["admin_toolbar_tools.help"])) {
          $menu_items = array_merge(["admin_toolbar_tools.help" => $build["administration_menu"]["#items"]["admin_toolbar_tools.help"]], $menu_items);
        }

        $build["administration_menu"]["#items"] = $menu_items;
      }

      $build['#attached']['library'][] = 'gin_toolbar_custom_menu/toolbar';
    }

    return $build;
  }

}
