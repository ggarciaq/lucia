<?php

namespace Drupal\Tests\gin_toolbar_custom_menu\Functional;

use Drupal\Tests\BrowserTestBase;

/**
 * Tests gin_toolbar_custom_menu Install / Uninstall logic.
 */
class GinToolbarCustomMenuInstallTest extends BrowserTestBase {

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
    $this->drupalLogin($this->drupalCreateUser(['administer modules']));
  }

  /**
   * Tests reinstalling after being uninstalled.
   */
  public function testReinstallAfterUninstall(): void {
    $page = $this->getSession()->getPage();
    $assert_session = $this->assertSession();

    $this->drupalGet('/admin/modules/uninstall');
    $page->checkField('uninstall[gin_toolbar_custom_menu]');
    $page->pressButton('Uninstall');
    $assert_session->pageTextContains('The following modules will be completely uninstalled from your site');
    $page->pressButton('Uninstall');
    $assert_session->pageTextContains('The selected modules have been uninstalled.');

    $this->drupalGet('/admin/modules');
    $page->checkField('modules[gin_toolbar_custom_menu][enable]');
    $page->pressButton('Install');
    $assert_session->pageTextContains('Module Gin Toolbar Custom Menu has been installed.');
  }

}
