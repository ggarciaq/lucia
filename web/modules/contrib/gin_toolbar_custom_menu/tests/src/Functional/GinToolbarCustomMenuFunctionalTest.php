<?php

namespace Drupal\Tests\gin_toolbar_custom_menu\Functional;

use Drupal\Tests\BrowserTestBase;
use Drupal\user\Entity\User;

/**
 * Tests gin_toolbar_custom_menu Install / Uninstall logic.
 */
class GinToolbarCustomMenuFunctionalTest extends BrowserTestBase {

  /**
   * Set default theme to stable.
   *
   * @var string
   */
  protected $defaultTheme = 'stark';

  /**
   * Modules to enable.
   *
   * @var array
   */
  protected static $modules = [
    'block',
    'toolbar',
    'breakpoint',
    'menu_ui',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->assertTrue(\Drupal::service('theme_installer')->install(['gin']));
    $this->container->get('module_installer')->install(['gin_toolbar'], FALSE);
    $this->container->get('config.factory')
      ->getEditable('system.theme')
      ->set('default', 'gin')
      ->set('admin', 'gin')
      ->save();
    $this->container->get('module_installer')->install(['gin_toolbar_custom_menu'], FALSE);
    $this->drupalLogin(User::load(1));
    $this->addMenuLink('Menu item 1', 0);
    $this->addMenuLink('Menu item 2', 0);
    $this->addMenuLink('Menu item 3', 0);
  }

  /**
   * Tests custom menu.
   */
  public function testCustomMenu(): void {
    $page = $this->getSession()->getPage();
    $assert_session = $this->assertSession();

    $this->drupalGet('/admin/config/system/gin-toolbar-custom-menu');
    $page->pressButton('Add');
    $page->fillField('settings[0][menu]', 'main');
    $assert_session->fieldExists('settings[0][role][authenticated]')->check();
    $page->pressButton('Save configuration');

    $this->drupalGet('/admin/appearance/settings/gin');
    $assert_session->pageTextContains('Menu item 1');
    $assert_session->pageTextContains('Menu item 2');
    $assert_session->pageTextContains('Menu item 3');

    $page->fillField('classic_toolbar', 'new');
    $page->pressButton('Save configuration');
    $assert_session->pageTextContains('Menu item 1');
    $assert_session->pageTextContains('Menu item 2');
    $assert_session->pageTextContains('Menu item 3');

    $page->fillField('classic_toolbar', 'horizontal');
    $page->pressButton('Save configuration');
    $assert_session->pageTextContains('Menu item 1');
    $assert_session->pageTextContains('Menu item 2');
    $assert_session->pageTextContains('Menu item 3');

    $page->fillField('classic_toolbar', 'classic');
    $page->pressButton('Save configuration');
    $assert_session->pageTextContains('Menu item 1');
    $assert_session->pageTextContains('Menu item 2');
    $assert_session->pageTextContains('Menu item 3');

    $this->drupalGet('/admin/config/system/gin-toolbar-custom-menu');
    $page->pressButton('Remove rule');
    $page->pressButton('Save configuration');
    $assert_session->pageTextNotContains('Menu item 1');
    $assert_session->pageTextNotContains('Menu item 2');
    $assert_session->pageTextNotContains('Menu item 3');
  }

  /**
   * Add menu link.
   */
  public function addMenuLink($title) {
    $this->drupalGet("admin/structure/menu/manage/main/add");
    $this->submitForm(['link[0][uri]' => '<front>', 'title[0][value]' => $title], 'Save');
  }

}
