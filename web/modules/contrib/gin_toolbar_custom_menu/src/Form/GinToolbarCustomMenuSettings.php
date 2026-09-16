<?php

namespace Drupal\gin_toolbar_custom_menu\Form;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\toolbar\Menu\ToolbarMenuLinkTree;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\gin_toolbar_custom_menu\GinToolbarCustomMenuInterface;
use Drupal\Core\File\FileSystemInterface;

/**
 * Configure settings for this site.
 */
class GinToolbarCustomMenuSettings extends ConfigFormBase {

  /**
   * The Get EntityTypeManagerInterface.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * The list of available modules.
   *
   * @var \Drupal\Core\Extension\ModuleExtensionList
   */
  protected ModuleExtensionList $extensionListModule;

  /**
   * The toolbar menu link tree.
   *
   * @var \Drupal\toolbar\Menu\ToolbarMenuLinkTree
   */
  protected ToolbarMenuLinkTree $menuLinkTree;

  /**
   * The file_system service.
   *
   * @var \Drupal\Core\File\FileSystemInterface
   */
  protected FileSystemInterface $fileSystem;

  /**
   * {@inheritdoc}
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    ModuleExtensionList $extension_list_module,
    ToolbarMenuLinkTree $menu_tree,
    FileSystemInterface $file_system,
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->extensionListModule = $extension_list_module;
    $this->menuLinkTree = $menu_tree;
    $this->fileSystem = $file_system;
  }

  /**
   * {@inheritDoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('extension.list.module'),
      $container->get('toolbar.menu_tree'),
      $container->get('file_system'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'gin_toolbar_custom_menu_settings';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return ['gin_toolbar_custom_menu.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('gin_toolbar_custom_menu.settings');
    $roles = [];
    $menus = $this->entityTypeManager->getStorage('menu')->loadMultiple();
    $module_path = $this->extensionListModule->getPath('gin_toolbar_custom_menu');
    $svgFile = file_get_contents($this->fileSystem->realpath($module_path) . '/images/sprite.svg');
    $icons = [];
    if ($svgFile) {
      $svg = new \SimpleXMLElement($svgFile);
      $svg->registerXPathNamespace('svg', 'http://www.w3.org/2000/svg');
      $result = $svg->xpath('//svg:view');
      foreach ($result as $value) {
        $icons[$value->attributes()->id . ''] = '<span class="' . $value->attributes()->id . '">';
      }
    }

    foreach ($menus as &$menu) {
      $menu = $menu->label();
    }
    $result = $this->entityTypeManager->getStorage('user_role')->loadMultiple();
    foreach ($result as $row => $value) {
      $roles[$row] = $row;
    }

    $form['keep_admin_menu'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Keep administration menu'),
      '#default_value' => $config->get('keep_admin_menu'),
      '#description' => $this->t('Menu items will be added to the administration menu.'),
    ];

    $form['settings'] = [
      '#type' => 'details',
      '#title' => $this->t('Rules'),
      '#prefix' => '<div id="menu-settings">',
      '#suffix' => '</div>',
      '#tree' => TRUE,
      '#open' => TRUE,
    ];

    $settings = (!empty($config->get('settings'))) ? $config->get('settings') : [];
    $settings_array = $form_state->get('settings_array');
    if ($settings_array === NULL) {
      $settings_array = (!empty($settings)) ? $settings : [];
      $form_state->set('settings_array', $settings_array);
    }

    foreach ($settings_array as $i => $value) {
      $form['settings'][$i] = [
        '#type' => 'details',
        '#open' => TRUE,
        '#title' => $this->t('Rule @count', ['@count' => ($i + 1)]),
      ];

      $form['settings'][$i]['menu'] = [
        '#type' => 'select',
        '#title' => $this->t('Menu'),
        '#default_value' => (!empty($settings[$i]['menu'])) ? $settings[$i]['menu'] : '',
        '#options' => ['' => $this->t('-- Select menu --')] + $menus,
      ];

      $form['settings'][$i]['role'] = [
        '#type' => 'checkboxes',
        '#title' => $this->t('Assigned roles'),
        '#default_value' => (!empty($settings[$i]['role'])) ? $settings[$i]['role'] : [],
        '#options' => $roles,
        '#description' => $this->t("Assigned roles must also be granted the 'Use toolbar' permission."),
      ];

      $form['settings'][$i]['excluded_role'] = [
        '#type' => 'checkboxes',
        '#title' => $this->t('Excluded roles'),
        '#default_value' => (!empty($settings[$i]['excluded_role'])) ? $settings[$i]['excluded_role'] : [],
        '#options' => $roles,
      ];

      $form['settings'][$i]['admin_menu'] = [
        '#type' => 'select',
        '#title' => $this->t('Administration menu visibility'),
        '#default_value' => $settings[$i]['admin_menu'] ?? 'use_global',
        '#options' => [
          GinToolbarCustomMenuInterface::ADMIN_MENU_GLOBAL => $this->t('Use the global selected option'),
          GinToolbarCustomMenuInterface::ADMIN_MENU_HIDDEN => $this->t('Hide for this menu'),
          GinToolbarCustomMenuInterface::ADMIN_MENU_SHOW => $this->t('Show for this menu'),
        ],
      ];

      if (!empty($settings[$i]['menu'])) {
        $form['settings'][$i]['icons'] = [
          '#type' => 'details',
          '#title' => $this->t('Icons'),
          '#open' => TRUE,
          '#tree' => TRUE,
        ];

        $parameters = $this->menuLinkTree->getCurrentRouteMenuTreeParameters($settings[$i]['menu']);
        $tree = $this->menuLinkTree->load($settings[$i]['menu'], $parameters);
        $default_icons = (!empty($settings[$i]['icons'])) ? $settings[$i]['icons'] : [];
        foreach ($tree as $element) {
          $definition = $element->link->getPluginDefinition();
          $id = str_replace('.', '_', $definition['id']);
          $form['settings'][$i]['icons'][$id] = [
            '#type' => 'radios',
            '#options' => $icons,
            '#title' => $definition["title"],
            '#default_value' => !empty($default_icons[$id]) ? $default_icons[$id] : '',
            '#attributes' => [
              'class' => [
                'options-icon',
              ],
            ],
          ];
        }

      }

      $form['settings'][$i]['actions'] = [
        '#type' => 'actions',
        '#attributes' => [
          'class' => ['remove-setting'],
        ],
      ];
      $form['settings'][$i]['actions']['remove_setting'] = [
        '#type' => 'submit',
        '#value' => $this->t('Remove rule'),
        '#submit' => ['::removeSetting'],
        '#ajax' => [
          'callback' => '::updateSettingsCallback',
          'wrapper' => 'menu-settings',
        ],
        '#limit_validation_errors' => [],
        '#name' => 'removesetting_' . $i,
      ];
    }
    $form['settings']['actions'] = [
      '#type' => 'actions',
    ];
    $form['settings']['actions']['add_setting'] = [
      '#type' => 'submit',
      '#value' => $this->t('Add rule'),
      '#submit' => ['::addSetting'],
      '#ajax' => [
        'callback' => '::updateSettingsCallback',
        'wrapper' => 'menu-settings',
      ],
      '#limit_validation_errors' => [],
      '#name' => 'addsetting',
    ];

    $form['#attached']['library'][] = 'gin_toolbar_custom_menu/toolbar';

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    $settings = $form_state->getValue('settings');
    unset($settings['actions']);
    $roles = $this->entityTypeManager->getStorage('user_role')->getQuery()
      ->accessCheck(FALSE)
      ->execute();
    foreach ($roles as $role) {
      $options = $this->getRoleAdminOptions($role, $settings);
      if (count($options) > 1) {
        $affected = array_filter($settings, function ($setting) use ($role) {
          return in_array($role, $setting['role']);
        });
        foreach ($affected as $key => $element) {
          $form_state->setErrorByName('settings][' . $key . '][admin_menu',
            $this->t('Please use the same definition for showing the administration menu for all menus that have the role @role', [
              '@role' => $role,
            ]));
        }
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $settings = $form_state->getValue('settings');
    unset($settings['actions']);
    $settings = array_values($settings);
    $this->config('gin_toolbar_custom_menu.settings')
      ->set('keep_admin_menu', $form_state->getValue('keep_admin_menu'))
      ->set('settings', $settings)
      ->save();

    Cache::invalidateTags(['gin_toolbar_custom_menu:settings']);
    parent::submitForm($form, $form_state);
  }

  /**
   * Update Settings callback.
   */
  public function updateSettingsCallback(array &$form, FormStateInterface $form_state): mixed {
    return $form['settings'];
  }

  /**
   * Add Setting callback.
   */
  public function addSetting(array &$form, FormStateInterface $form_state): void {
    $settings_array = $form_state->get('settings_array');
    $settings_array[] = 0;
    $form_state->set('settings_array', $settings_array);

    $form_state->setRebuild();
  }

  /**
   * Remove Setting callback.
   */
  public function removeSetting(array &$form, FormStateInterface $form_state): void {
    $trigger = $form_state->getTriggeringElement();

    [$a, $index] = explode('_', $trigger['#name']);
    if ($a == 'removesetting' && is_numeric($index)) {

      $settings_array = $form_state->get('settings_array');
      if (isset($settings_array[$index])) {
        unset($settings_array[$index]);
        $form_state->set('settings_array', $settings_array);
      }
    }

    $form_state->setRebuild();
  }

  /**
   * Retrieves admin menu options based on the user's role and settings.
   *
   * @param string $role
   *   The role id.
   * @param array $settings
   *   The form settings values.
   *
   * @return array
   *   An array of admin menu options that are available for the specified role.
   *   If no options are found, an empty array is returned.
   */
  private function getRoleAdminOptions($role, array $settings) : array {
    foreach ($settings as $setting) {
      if (!in_array($role, $setting['role'])) {
        continue;
      }
      $admin_settings[$setting['admin_menu']] = TRUE;
    }
    return $admin_settings ?? [];
  }

}
