<?php

/**
 * @file
 * Solo Theme.
 *
 * Filename:     solo.theme
 * Website:      http://www.flashwebcenter.com
 * Description:  template
 * Author:       Alaa Haddad http://www.alaahaddad.com.
 */

/**
 * The theme settings.
 */

$form["solo_settings"]["settings_global_misc"] = [
  "#type" => "details",
  "#title" => t("<strong class='error'>Global Site</strong> Settings - Solo Theme"),
  "#collapsible" => TRUE,
  "#collapsed" => TRUE,
];

// Create vertical tabs container.
$form["solo_settings"]["settings_global_misc"]["global_misc_tabs"] = [
  "#type" => "vertical_tabs",
  "#default_tab" => "edit-layout-dimensions",
];

// Layout & Dimensions Tab.
$form["solo_settings"]["settings_global_misc"]["layout_dimensions"] = [
  "#type" => "details",
  "#title" => t("Layout & Dimensions"),
  "#group" => "global_misc_tabs",
  "#weight" => -10,
  "#id" => "edit-layout-dimensions",
];

$form["solo_settings"]["settings_global_misc"]["layout_dimensions"]["enable_px_based_widths"] = [
  "#type" => "checkbox",
  "#title" => t("Enable PX-Based Global Website Width"),
  "#default_value" => theme_get_setting("enable_px_based_widths"),
  "#description" => t("Check this box to switch the website's width from rem units to fixed pixel-based widths, ensuring consistent layout sizing. <a href='https://alaahaddad.com/node/70' target='_blank'>Learn more</a>."),
];

$form["solo_settings"]["settings_global_misc"]["layout_dimensions"]["site_global_width"] = [
  "#title" => t("Global Website Width - Solo Theme"),
  "#type" => "select",
  "#options" => _get_site_width_options(),
  "#default_value" => theme_get_setting("site_global_width") ?? "sw-1600",
  "#description" => t("<p><strong>You can adjust the entire website's width by choosing your preferred size in pixels or rem units.</strong></p>"),
];

// Content type specific width settings.
$content_types = _solo_get_content_types();
$content_types_width = _get_content_type_width_options() ?? [];

// Check if the solo_utilities module is enabled and if the Solo theme or
// its sub-themes are active.
if (\Drupal::moduleHandler()->moduleExists("solo_utilities") && solo_utilities__check_solo_theme_hierarchy_active()) {
  // Checkbox to enable custom widths for each content type.
  $form["solo_settings"]["settings_global_misc"]["layout_dimensions"]["enable_custom_widths"] = [
    "#type" => "checkbox",
    "#title" => t("Enable custom widths for each content type"),
    "#default_value" => theme_get_setting("enable_custom_widths"),
  ];

  // Collapsible details element for content type specific width settings.
  $form["solo_settings"]["settings_global_misc"]["layout_dimensions"]["content_type_widths"] = [
    "#type" => "details",
    "#title" => t("Content Type Widths"),
    "#open" => TRUE,
    "#states" => [
      "visible" => [
        ":input[name='enable_custom_widths']" => ["checked" => TRUE],
      ],
    ],
  ];

  $site_widths = theme_get_setting('site_widths') ?? [];
  foreach ($content_types as $type => $label) {
    $global_width = theme_get_setting("site_global_width") ?? "sw-1600";
    $override = $site_widths[$type] ?? NULL;
    $form["solo_settings"]["settings_global_misc"]["layout_dimensions"]["content_type_widths"]["site_width_" . $type] = [
      "#title" => t("Width for @content_type", ["@content_type" => $label]),
      "#type" => "select",
      "#options" => $content_types_width,
      "#default_value" => $override ?? $global_width,
      "#description" => t("<p><strong>You can adjust the width for the @content_type content type by choosing your preferred size in pixels or rem units.</strong></p>", ["@content_type" => $label]),
      "#states" => [
        "visible" => [
          ":input[name='enable_custom_widths']" => ["checked" => TRUE],
        ],
      ],
    ];
  }

  // Checkbox to enable custom widths for individual nodes.
  $form["solo_settings"]["settings_global_misc"]["layout_dimensions"]["enable_custom_node_width"] = [
    "#type" => "checkbox",
    "#title" => t("Tick this box to enable custom widths for individual nodes or for each content type."),
    "#default_value" => theme_get_setting("enable_custom_node_width"),
    "#description" => t("Allow setting custom widths for individual nodes. Once enabled, you will see a dropdown in the node edit form where you can select a custom width for each node. If 'None' is selected, the default width will be used. Individual node widths take priority over content type-specific widths, which take priority over the global width."),
  ];
}
else {
  // Display a message if the module is not enabled or the Solo theme or
  // its sub-themes are not active.
  $form["solo_settings"]["settings_global_misc"]["layout_dimensions"]["enable_custom_node_width_message"] = [
    "#type" => "item",
    "#title" => t("Enable custom widths for individual nodes or each content type."),
    "#markup" => t("To enable custom widths for individual nodes or each content type, please ensure that the <a href='https://www.drupal.org/project/solo_utilities' target='_blank'>Solo Utilities module</a> is installed and enabled. Additionally, this feature requires that the Solo theme or one of its sub-themes is actively being used on the site. The Solo theme must be set as the default theme or be a parent, grandparent, or part of the active theme hierarchy in any capacity."),
  ];
}

$form["solo_settings"]["settings_global_misc"]["layout_dimensions"]["site_global_breakpoints"] = [
  "#title" => t("Website's Breakpoints - Solo Theme"),
  "#type" => "select",
  "#options" => _get_site_breakpoints_options(),
  "#default_value" => theme_get_setting("site_global_breakpoints") ?? "sb-992",
  "#description" => t("<p><strong>Use them to adjust the global layout for a particular screen or device size.</strong></p>"),
];

$form["solo_settings"]["settings_global_misc"]["layout_dimensions"]["site_regions_collapse_order"] = [
  "#type" => "checkbox",
  "#title" => t("Tick this box to modify the layout collapse order."),
  "#description"   => t("<p>When enabled, this setting adjusts the layout of grouped regions to collapse into a responsive grid for better viewing on smaller screens. This feature applies only if the grouped region contains exactly three or four regions.</p>"),
  "#default_value" => theme_get_setting("site_regions_collapse_order"),
];

$form["solo_settings"]["settings_global_misc"]["layout_dimensions"]["site_menu_breakpoints"] = [
  "#title" => t("Menu's Breakpoints - Solo Theme"),
  "#type" => "select",
  "#options" => _get_menu_breakpoints_options(),
  "#default_value" => theme_get_setting("site_menu_breakpoints") ?? "mn-992",
  "#description" => t("<p><strong>Adjust the global layout for any responsive menu on a specific screen or device size using them.</strong></p>"),
];

$form["solo_settings"]["settings_global_misc"]["layout_dimensions"]["site_global_regions_gap"] = [
  "#title" => t("Website Region's Spaces"),
  "#type" => "select",
  "#options" => _get_site_global_regions_gap(),
  "#default_value" => theme_get_setting("site_global_regions_gap") ?? "16",
  "#description" => t("<p><strong>You can adjust the entire website's padding by choosing your preferred size in pixels or rem units.</strong></p>"),
];

// Typography & Content Tab.
$form["solo_settings"]["settings_global_misc"]["typography_content"] = [
  "#type" => "details",
  "#title" => t("Typography & Content"),
  "#group" => "global_misc_tabs",
  "#weight" => -8,
];

$form["solo_settings"]["settings_global_misc"]["typography_content"]["site_global_font_size"] = [
  "#title" => t("Website's Font Size"),
  "#type" => "select",
  "#options" => _get_site_global_font_size(),
  "#default_value" => theme_get_setting("site_global_font_size") ?? "16",
  "#description" => t("<p><strong>You can adjust the entire website's font size by choosing your preferred size in pixels or rem units.</strong></p>"),
];

$form["solo_settings"]["settings_global_misc"]["typography_content"]["site_node_date_format"] = [
  "#title" => t("Choose the node date format."),
  "#type" => "select",
  "#options" => _get_site_node_date_format($d_s, $d_m, $d_l),
  "#default_value" => theme_get_setting("site_node_date_format") ?? "solo_date_l",
  "#description" => t("Select a custom format for the node creation date. Choose '- None -' to use the default format provided by Drupal core or contributed modules."),
];

$form["solo_settings"]["settings_global_misc"]["typography_content"]["site_import_google_font"] = [
  "#type" => "textfield",
  "#title" => t("Import Google Font"),
  "#description" => t("To import a Google font, follow these steps:<br>

Step 1: Obtain the Google Fonts URL. You can do this by visiting Google Fonts and copying the URL. For example, <strong class='info'>https://fonts.googleapis.com/css2?family=Teko:wght@300;400;500;600;700&display=swap</strong>.<br>

Step 2: Inject the CSS rules to specify the font families in the field below. For instance,
<strong class='info'>h1, h2, h3 {font-family: 'Teko', sans-serif <span class='error'>!important;</span>}</strong>.<br>

<span class='error'>Note</span>: If you are using Global Site Fonts or Heading Fonts, you must include <span class='error'>!important</span>; in your CSS.
 "),
  "#default_value" => theme_get_setting("site_import_google_font"),
];

$form["solo_settings"]["settings_global_misc"]["typography_content"]["site_reading_mode_content_type"] = [
  "#type" => "select",
  "#title" => t("Reading Mode (45rem/720px)"),
  "#default_value" => theme_get_setting("site_reading_mode_content_type") ?? "",
  "#options" => _solo_get_content_types(),
  "#multiple" => TRUE,
  "#description" => t("A common guideline for the maximum width of a text block for comfortable reading is around 60 to 75 characters per line. This guideline helps to prevent the text from becoming too difficult to follow from one line to the next. Choose the content type for which 'Reading Mode' should be enabled, and set the maximum width for the content region to 45rem/720px for both Text Formatted Long and Text Formatted Long with Summary. It is for Default/Full view mode only."),
];

// Block & Visibility Tab.
$form["solo_settings"]["settings_global_misc"]["block_visibility"] = [
  "#type" => "details",
  "#title" => t("Block & Visibility"),
  "#group" => "global_misc_tabs",
  "#weight" => -6,
];

if (\Drupal::moduleHandler()->moduleExists("solo_utilities")) {
  $form["solo_settings"]["settings_global_misc"]["block_visibility"]["enable_block_title_visibility"] = [
    "#type" => "checkbox",
    "#title" => t("Enable custom block title visibility"),
    "#description" => t("Allows control over each block's title visibility: visible, visually hidden (for screen readers), or completely removed from HTML output."),
    "#default_value" => theme_get_setting("enable_block_title_visibility"),
  ];
}
else {
  $form["solo_settings"]["settings_global_misc"]["block_visibility"]["disable_block_title_visibility"] = [
    "#type" => "item",
    "#title" => t("Block Title Visibility"),
    "#markup" => t("This feature requires the <a href='https://www.drupal.org/project/solo_utilities' target='_blank'>Solo Utilities module</a>. Once enabled, you will be able to control visibility of block titles through an advanced dropdown option in each block configuration."),
  ];
}

// Comments Tab.
$form["solo_settings"]["settings_global_misc"]["comments"] = [
  "#type" => "details",
  "#title" => t("Comments"),
  "#group" => "global_misc_tabs",
  "#weight" => -5,
];

// Accessibility notice.
$form["solo_settings"]["settings_global_misc"]["comments"]["accessibility_notice"] = [
  "#type" => "container",
  "#attributes" => [
    "class" => ["messages", "messages--status"],
    "role" => "status",
  ],
  "content" => [
    "#markup" => "<strong>" . t("Accessibility Tip:") . "</strong> " . t("For better screen reader navigation, enable 'Display comment subject before author information'. This allows users to navigate comments using heading navigation (typically the H key in screen readers)."),
  ],
];

// Comment display order fieldset.
$form["solo_settings"]["settings_global_misc"]["comments"]["comment_display_order"] = [
  "#type" => "fieldset",
  "#title" => t("Display Order"),
  "#description" => t("Control the order of comment elements for improved accessibility."),
];

$form["solo_settings"]["settings_global_misc"]["comments"]["comment_display_order"]["comment_heading_first"] = [
  "#type" => "checkbox",
  "#title" => t("Display comment subject before author information"),
  "#description" => t("When enabled, the comment subject (heading) appears before the author name and date. This improves accessibility by allowing screen reader users to navigate comments using heading navigation. <strong>Recommended for accessibility compliance.</strong>"),
  "#default_value" => theme_get_setting("comment_heading_first") ?? TRUE,
];

// Comment form position fieldset.
$form["solo_settings"]["settings_global_misc"]["comments"]["comment_form_position_settings"] = [
  "#type" => "fieldset",
  "#title" => t("Comment Form Position"),
  "#description" => t("Control where the comment form appears relative to the list of existing comments."),
];

$form["solo_settings"]["settings_global_misc"]["comments"]["comment_form_position_settings"]["comment_form_position"] = [
  "#type" => "radios",
  "#title" => t("Comment form position"),
  "#description" => t("Choose whether the 'Add new comment' form appears before or after the list of existing comments. Displaying the form after comments is useful when you want visitors to read existing discussion before adding their own comment."),
  "#default_value" => theme_get_setting("comment_form_position") ?? "before",
  "#options" => [
    "before" => t("Before comments (default)"),
    "after" => t("After comments"),
  ],
];

// Comment visibility fieldset.
$form["solo_settings"]["settings_global_misc"]["comments"]["comment_visibility"] = [
  "#type" => "fieldset",
  "#title" => t("Element Visibility"),
  "#description" => t("Choose which comment metadata elements to display."),
];

$form["solo_settings"]["settings_global_misc"]["comments"]["comment_visibility"]["comment_show_author"] = [
  "#type" => "checkbox",
  "#title" => t("Show author name"),
  "#default_value" => theme_get_setting("comment_show_author") ?? TRUE,
];

$form["solo_settings"]["settings_global_misc"]["comments"]["comment_visibility"]["comment_show_date"] = [
  "#type" => "checkbox",
  "#title" => t("Show comment date"),
  "#default_value" => theme_get_setting("comment_show_date") ?? TRUE,
];

$form["solo_settings"]["settings_global_misc"]["comments"]["comment_visibility"]["comment_show_picture"] = [
  "#type" => "checkbox",
  "#title" => t("Show user picture"),
  "#default_value" => theme_get_setting("comment_show_picture") ?? TRUE,
];

$form["solo_settings"]["settings_global_misc"]["comments"]["comment_visibility"]["comment_show_permalink"] = [
  "#type" => "checkbox",
  "#title" => t("Show permalink"),
  "#default_value" => theme_get_setting("comment_show_permalink") ?? TRUE,
];

$form["solo_settings"]["settings_global_misc"]["comments"]["comment_visibility"]["comment_show_new_indicator"] = [
  "#type" => "checkbox",
  "#title" => t("Show new comment indicator"),
  "#description" => t("Displays a 'New' badge for comments posted since the user's last visit."),
  "#default_value" => theme_get_setting("comment_show_new_indicator") ?? TRUE,
];

// Comment date format fieldset.
$form["solo_settings"]["settings_global_misc"]["comments"]["comment_date_settings"] = [
  "#type" => "fieldset",
  "#title" => t("Date Format"),
];

// Get available date formats.
$date_format_options = [];
try {
  $date_formats = \Drupal::entityTypeManager()->getStorage('date_format')->loadMultiple();
  foreach ($date_formats as $format) {
    $date_format_options[$format->id()] = $format->label();
  }
}
catch (\Exception $e) {
  $date_format_options = [
    'short' => t('Short'),
    'medium' => t('Medium'),
    'long' => t('Long'),
  ];
}
// Add relative format option to the date formats.
$date_format_options['solo_relative'] = t('Relative (e.g., "2 hours ago")');
$form["solo_settings"]["settings_global_misc"]["comments"]["comment_date_settings"]["comment_date_format"] = [
  "#type" => "select",
  "#title" => t("Comment date format"),
  "#description" => t("Select the format for displaying comment dates. You can create custom date formats at <a href='/admin/config/regional/date-time'>Date and time formats</a>."),
  "#options" => $date_format_options,
  "#default_value" => theme_get_setting("comment_date_format") ?? 'solo_relative',
];

// Comment title settings fieldset.
$form["solo_settings"]["settings_global_misc"]["comments"]["comment_title_settings"] = [
  "#type" => "fieldset",
  "#title" => t("Subject/Title Settings"),
];

$form["solo_settings"]["settings_global_misc"]["comments"]["comment_title_settings"]["comment_title_tag"] = [
  "#type" => "select",
  "#title" => t("Heading level"),
  "#description" => t("The HTML heading tag for comment subjects. Choose based on your page structure for proper document outline and accessibility."),
  "#options" => [
    "h2" => t("H2 - Second level"),
    "h3" => t("H3 - Third level (default)"),
    "h4" => t("H4 - Fourth level"),
    "h5" => t("H5 - Fifth level"),
    "h6" => t("H6 - Sixth level"),
  ],
  "#default_value" => theme_get_setting("comment_title_tag") ?? "h3",
];

// Custom Code Tab.
$form["solo_settings"]["settings_global_misc"]["custom_code"] = [
  "#type" => "details",
  "#title" => t("Custom Code"),
  "#group" => "global_misc_tabs",
  "#weight" => -4,
];

$form["solo_settings"]["settings_global_misc"]["custom_code"]["site_css_injector"] = [
  "#type" => "textarea",
  "#title" => t("CSS Injector"),
  "#description" => t("Use this field to inject custom CSS directly into the page head on every page. This method is best for small snippets of CSS that modify the look and feel of your site globally. Changes take effect immediately and are stored within the theme settings, making it a convenient option for quick adjustments or tests."),
  "#default_value" => theme_get_setting("site_css_injector"),
];

$form["solo_settings"]["settings_global_misc"]["custom_code"]["site_css_dynamic"] = [
  "#type" => "textarea",
  "#title" => t("CSS Dynamic"),
  "#description" => t("Enter your CSS here to have it written into a dedicated CSS file that's loaded across your site. This approach is ideal for more substantial CSS customizations that benefit from being cached as a separate file. It's particularly useful for performance optimization on larger sites, as it ensures that your custom styles are cached by browsers and not inlined on every page load. It is saved in the public file system path sites/*/files/solo/css/solo-css-dynamic.css."),
  "#default_value" => theme_get_setting("site_css_dynamic"),
];

$form["solo_settings"]["settings_global_misc"]["custom_code"]["site_js_dynamic"] = [
  "#type" => "textarea",
  "#title" => t("JavaScript Dynamic"),
  "#description" => t("Enter your JavaScript code here to be saved into a separate, dedicated file that will be loaded across your site. Ideal for extensive JavaScript that benefits from browser caching, this approach helps in optimizing site performance by reducing page load times. By including this JavaScript, you'll automatically have access to a set of Drupal's core libraries within your scripts, including jQuery, AJAX functionalities, Drupal behaviors, drupalSettings, and once. This means you can leverage these powerful features directly in your custom JavaScript, enhancing your site's interactivity and functionality without needing to manually include these libraries. It is saved in the public file system path sites/*/files/solo/js/solo-js-dynamic.js."),
  "#default_value" => theme_get_setting("site_js_dynamic"),
];

// Interface Behavior Tab.
$form["solo_settings"]["settings_global_misc"]["interface_behavior"] = [
  "#type" => "details",
  "#title" => t("Interface Behavior"),
  "#group" => "global_misc_tabs",
  "#weight" => -2,
];

$form["solo_settings"]["settings_global_misc"]["interface_behavior"]["site_login_page_on"] = [
  "#type" => "checkbox",
  "#title" => t("Tick this box to modify the layout for the login, register, and password reset pages."),
  "#description"   => t("<p>The login form will be centralized, with the left and right sides concealed.</p>"),
  "#default_value" => theme_get_setting("site_login_page_on"),
];

$form["solo_settings"]["settings_global_misc"]["interface_behavior"]["site_flip_header_menu"] = [
  "#type" => "checkbox",
  "#title" => t("Tick this box to flip the main menu order. It will be displayed before the header."),
  "#default_value" => theme_get_setting("site_flip_header_menu"),
];

$form["solo_settings"]["settings_global_misc"]["interface_behavior"]["site_opacity_onscroll_on"] = [
  "#type" => "checkbox",
  "#title" => t("Tick this box to animate opacity while scrolling down."),
  "#description"   => t("<p>Upon visiting the page, the hidden blocks remain unseen. They only begin to animate and become visible as you scroll down. However, this feature is disabled by default.</p>"),
  "#default_value" => theme_get_setting("site_opacity_onscroll_on"),
];

$form["solo_settings"]["settings_global_misc"]["interface_behavior"]["site_inline_items_on"] = [
  "#type" => "checkbox",
  "#title" => t("Tick this box to display multiple taxonomy term field items on the same line."),
  "#description"   => t("<p>In the current setup, when there's a field with multiple values, those values are shown one beneath the other in a block layout. This can use a significant amount of vertical space, especially if there are numerous values. However, this new feature modifies this layout. Instead of displaying the values on separate lines, they will be shown side by side on the same line, with spaces separating them. This change will result in a more condensed and easily readable display</p>"),
  "#default_value" => theme_get_setting("site_inline_items_on"),
];

$form["solo_settings"]["settings_global_misc"]["interface_behavior"]["color_coded_system_tabs"] = [
  "#type" => "checkbox",
  "#title" => t("Tick this box to enhanced navigation with color-coded system tabs"),
  "#description"   => t("<p>This tailored CSS script enriches the user interface of the website by assigning bespoke colors to core system tab links, such as View, Edit, Delete, and Revisions.</p>"),
  "#default_value" => theme_get_setting("color_coded_system_tabs"),
];

$form["solo_settings"]["settings_global_misc"]["interface_behavior"]["site_toggle_speed"] = [
  "#type" => "select",
  "#title" => t("Menu Animation Speed"),
  "#description" => t("Controls how fast the menu opens/closes. Applies to all menus."),
  "#default_value" => theme_get_setting("site_toggle_speed") ?? "normal",
  "#options" => [
    "fast" => t("Fast"),
    "normal" => t("Normal"),
    "slow" => t("Slow"),
  ],
];

// Get all available menus.
$menus = \Drupal::entityTypeManager()->getStorage('menu')->loadMultiple();
$menu_options = [];
foreach ($menus as $menu_id => $menu) {
  $menu_options[$menu_id] = $menu->label();
}

// Accessbility Tab.
$form["solo_settings"]["settings_global_misc"]["accessibility"] = [
  "#type" => "details",
  "#title" => t("Accessibility"),
  "#group" => "global_misc_tabs",
  "#weight" => -1,
];

$form["solo_settings"]["settings_global_misc"]["accessibility"]['keyboard_navigation_menus'] = [
  '#type' => 'checkboxes',
  '#title' => t('Enable Keyboard Navigation for Menus'),
  '#description' => t('Select which menus should have full keyboard navigation support (arrow keys, screen reader compatibility). Only applies to menus using Solo templates.'),
  '#default_value' => theme_get_setting('keyboard_navigation_menus') ?? [],
  '#options' => $menu_options,
];

// Preloader tab.
$form["solo_settings"]["settings_global_misc"]["preloader"] = [
  "#type" => "details",
  "#title" => t("Preloader"),
  "#group" => "global_misc_tabs",
  "#weight" => 99,
  "#description" => t("A full-page overlay that shows while the page is loading and hides when the page has fully loaded. It improves perceived loading and gives a polished first impression. <strong>For best performance</strong>, keep the preloader light: use the <em>Spinner</em> style, leave text font and animation at default (none). Custom Google fonts and gradient text animation add extra requests and can delay the preloader from appearing. You can still use them if you prefer the look—they will apply after their resources load."),
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["preloader_enabled"] = [
  '#type' => 'checkbox',
  '#title' => t('Enable preloader'),
  '#default_value' => theme_get_setting('preloader_enabled') ?? FALSE,
  '#description' => t('Show a brief loading overlay. Disabled by default.'),
  '#id' => 'edit-preloader-enabled',
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["visibility"] = [
  '#type' => 'fieldset',
  '#title' => t('Visibility'),
  '#attributes' => ['class' => ['solo-preloader-visibility']],
  '#states' => ['visible' => [':input#edit-preloader-enabled' => ['checked' => TRUE]]],
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["visibility"]["preloader_max_display_seconds"] = [
  '#type' => 'number',
  '#title' => t('Max display time (seconds)'),
  '#weight' => -20,
  '#default_value' => theme_get_setting('preloader_max_display_seconds') ?? 8,
  '#min' => 3,
  '#max' => 60,
  '#step' => 1,
  '#field_suffix' => t('sec'),
  '#description' => t('Fallback only: the preloader hides as soon as the page has loaded (e.g. if the page loads in 2 seconds, it hides at 2 seconds). This value is the maximum time to show it if the load event never fires or is delayed.'),
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["visibility"]["preloader_hide_on"] = [
  '#type' => 'radios',
  '#title' => t('Hide preloader when'),
  '#weight' => -19,
  '#default_value' => theme_get_setting('preloader_hide_on') ?? 'dom_ready',
  '#options' => [
    'dom_ready' => t('Page appears (recommended)'),
    'load' => t('Page fully loaded (images, scripts, etc.)'),
  ],
  '#description' => t('Choose when the preloader should disappear. "Page appears" hides it when the HTML and layout are ready so visitors can start reading while images continue loading. "Page fully loaded" waits for all resources before hiding (current behavior).'),
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["visibility"]["preloader_force_show"] = [
  '#type' => 'checkbox',
  '#title' => t('Force show for testing'),
  '#default_value' => theme_get_setting('preloader_force_show') ?? FALSE,
  '#description' => t('Show the preloader on every page for 30 seconds (logged in, admin, any path). Use this to test logo, text size, and colors. Uncheck when done.'),
  '#weight' => -10,
  '#id' => 'edit-preloader-force-show',
  '#attributes' => ['class' => ['solo-preloader-force-show']],
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["visibility"]["preloader_disable_authenticated"] = [
  '#type' => 'checkbox',
  '#title' => t('Disable for authenticated users'),
  '#default_value' => theme_get_setting('preloader_disable_authenticated') ?? TRUE,
  '#description' => t('Do not show the preloader to logged-in users. Recommended for editors.'),
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["visibility"]["preloader_disable_admin_routes"] = [
  '#type' => 'checkbox',
  '#title' => t('Disable on admin routes'),
  '#default_value' => theme_get_setting('preloader_disable_admin_routes') ?? TRUE,
  '#description' => t('Do not show on /admin, layout builder, content editing, etc.'),
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["visibility"]["preloader_path_rules"] = [
  '#type' => 'textarea',
  '#title' => t('Path include/exclude rules'),
  '#default_value' => theme_get_setting('preloader_path_rules') ?? '',
  '#description' => t('One path per line. Leave empty to use the default visibility above.<br><br><strong>Exclude:</strong> prefix with a minus sign to hide the preloader on that path (e.g. <code>-/contact</code>, <code>-/about</code>).<br><strong>Include only:</strong> list paths without a prefix to show the preloader only on those paths (e.g. <code>/</code> for front page only, or <code>/</code> and <code>/products</code>).'),
  '#rows' => 4,
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"] = [
  '#type' => 'fieldset',
  '#title' => t('Appearance'),
  '#attributes' => ['class' => ['solo-preloader-appearance']],
  '#states' => ['visible' => [':input#edit-preloader-enabled' => ['checked' => TRUE]]],
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"]["preloader_style"] = [
  '#type' => 'select',
  '#title' => t('Style'),
  '#id' => 'edit-preloader-style',
  '#options' => [
    'spinner' => t('Spinner (recommended for performance)'),
    'progress_bar' => t('Progress bar'),
    'text' => t('Text'),
    'logo' => t('Logo'),
    'logo_text' => t('Logo + text'),
  ],
  '#default_value' => theme_get_setting('preloader_style') ?? 'spinner',
  '#description' => t('Spinner is lightest and shows immediately; progress bar shows an animated bar centered on the page; text and logo can wait on fonts or images.'),
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"]["preloader_transition"] = [
  '#type' => 'select',
  '#title' => t('Transition effect'),
  '#options' => [
    'fade' => t('Fade (default)'),
    'slide_up' => t('Slide up'),
    'slide_down' => t('Slide down'),
    'slide_left' => t('Slide left'),
    'slide_right' => t('Slide right'),
    'zoom_out' => t('Zoom out'),
    'blur' => t('Blur'),
  ],
  '#default_value' => theme_get_setting('preloader_transition') ?? 'fade',
  '#description' => t('How the preloader disappears when the page is ready. All effects include a fade; slide/zoom/blur add motion.'),
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"]["preloader_spinner_show_percent"] = [
  '#type' => 'checkbox',
  '#title' => t('Show percentage (0%–100%) inside spinner'),
  '#default_value' => theme_get_setting('preloader_spinner_show_percent') ?? FALSE,
  '#description' => t('Estimated progress only (not real load %). Adds one timer and a small text update; minimal extra load.'),
  '#states' => ['visible' => [':input#edit-preloader-style' => ['value' => 'spinner']]],
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"]["preloader_text"] = [
  '#type' => 'textfield',
  '#title' => t('Text'),
  '#id' => 'edit-preloader-text',
  '#default_value' => theme_get_setting('preloader_text') ?? '',
  '#description' => t('Shown when style is "Text" or "Logo + text".'),
  '#states' => [
    'visible' => [
      ':input#edit-preloader-style' => [
        ['value' => 'text'],
        ['value' => 'logo_text'],
      ],
    ],
  ],
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"]["preloader_text_font"] = [
  '#type' => 'select',
  '#title' => t('Text Font'),
  '#options' => _get_name_title_google_font(),
  '#default_value' => theme_get_setting('preloader_text_font') ?? '',
  '#description' => t('Optional. For fastest display, leave at "None"—custom fonts load from the network and can delay the preloader.'),
  '#states' => [
    'visible' => [
      ':input#edit-preloader-style' => [
        ['value' => 'text'],
        ['value' => 'logo_text'],
      ],
    ],
  ],
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"]["preloader_text_animate_effect"] = [
  '#type' => 'select',
  '#title' => t('Text animation effect'),
  '#description' => t('Gradient text animation. Same options as Site Name and Page Title. For best performance leave at "None"—animation CSS can delay the preloader. Choose an effect only if you want the look.'),
  '#options' => _get_animate_site_name(),
  '#default_value' => theme_get_setting('preloader_text_animate_effect') ?? '',
  '#states' => [
    'visible' => [
      ':input#edit-preloader-style' => [
        ['value' => 'text'],
        ['value' => 'logo_text'],
      ],
    ],
  ],
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"]["preloader_text_font_size"] = [
  '#type' => 'number',
  '#title' => t('Text size (px)'),
  '#default_value' => theme_get_setting('preloader_text_font_size') ?? 24,
  '#min' => 12,
  '#max' => 124,
  '#step' => 1,
  '#field_suffix' => 'px',
  '#states' => [
    'visible' => [
      ':input#edit-preloader-style' => [
        ['value' => 'text'],
        ['value' => 'logo_text'],
      ],
    ],
  ],
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"]["preloader_logo_use_theme"] = [
  '#type' => 'checkbox',
  '#title' => t('Use logo supplied by the theme'),
  '#default_value' => theme_get_setting('preloader_logo_use_theme') ?? TRUE,
  '#description' => t('When checked, the preloader uses the same logo as the site (theme settings). Uncheck to set a custom path below.'),
  '#states' => [
    'visible' => [
      ':input#edit-preloader-style' => [
        ['value' => 'logo'],
        ['value' => 'logo_text'],
      ],
    ],
  ],
  '#id' => 'edit-preloader-logo-use-theme',
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"]["preloader_logo_url"] = [
  '#type' => 'textfield',
  '#title' => t('Path to custom logo'),
  '#id' => 'edit-preloader-logo-url',
  '#default_value' => theme_get_setting('preloader_logo_url') ?? '',
  '#description' => t('Examples: logo.svg (for a file in the public filesystem), public://logo.svg, or themes/contrib/solo/logo.svg. Only used when "Use logo supplied by the theme" is unchecked.'),
  '#states' => [
    'visible' => [
      ':input#edit-preloader-style' => [
        ['value' => 'logo'],
        ['value' => 'logo_text'],
      ],
      ':input#edit-preloader-logo-use-theme' => ['checked' => FALSE],
    ],
  ],
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"]["preloader_logo_width"] = [
  '#type' => 'number',
  '#title' => t('Logo width (px)'),
  '#default_value' => theme_get_setting('preloader_logo_width') ?? 160,
  '#min' => 16,
  '#max' => 800,
  '#step' => 1,
  '#field_suffix' => 'px',
  '#states' => [
    'visible' => [
      ':input#edit-preloader-style' => [
        ['value' => 'logo'],
        ['value' => 'logo_text'],
      ],
    ],
  ],
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"]["preloader_logo_height"] = [
  '#type' => 'number',
  '#title' => t('Logo height (px)'),
  '#default_value' => theme_get_setting('preloader_logo_height') ?? 80,
  '#min' => 16,
  '#max' => 600,
  '#step' => 1,
  '#field_suffix' => 'px',
  '#states' => [
    'visible' => [
      ':input#edit-preloader-style' => [
        ['value' => 'logo'],
        ['value' => 'logo_text'],
      ],
    ],
  ],
];

$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"]["preloader_logo_opacity"] = [
  '#type' => 'number',
  '#title' => t('Logo opacity (%)'),
  '#default_value' => theme_get_setting('preloader_logo_opacity') ?? 100,
  '#min' => 0,
  '#max' => 100,
  '#step' => 1,
  '#field_suffix' => '%',
  '#states' => [
    'visible' => [
      ':input#edit-preloader-style' => [
        ['value' => 'logo'],
        ['value' => 'logo_text'],
      ],
    ],
  ],
];

$preloader_app = &$form["solo_settings"]["settings_global_misc"]["preloader"]["appearance"];
// Order: text color, background color, background opacity (opacity is merged with bg as rgba in CSS).
$preloader_app["settings_preloader___r_tx"] = _generate_form_element(
  'preloader', t('Preloader'), '__r_tx', t('Text')
);
$preloader_app["settings_preloader___r_tx"]['#attributes']['class'] = array_merge(
  $preloader_app["settings_preloader___r_tx"]['#attributes']['class'] ?? [],
  ['solo-preloader-color-field']
);
$preloader_app["settings_preloader___r_bg"] = _generate_form_element(
  'preloader', t('Preloader'), '__r_bg', t('Background')
);
$preloader_app["settings_preloader___r_bg"]['#attributes']['class'] = array_merge(
  $preloader_app["settings_preloader___r_bg"]['#attributes']['class'] ?? [],
  ['solo-preloader-color-field']
);
$preloader_app["preloader_bg_opacity"] = [
  '#type' => 'number',
  '#title' => t('Background opacity'),
  '#min' => 0,
  '#max' => 100,
  '#default_value' => theme_get_setting('preloader_bg_opacity') ?? 100,
  '#description' => t('0–100. Combined with background color as rgba.'),
  '#id' => 'edit-preloader-bg-opacity',
  '#states' => ['visible' => [':input#edit-preloader-enabled' => ['checked' => TRUE]]],
];

// Back to top: Enable, Visibility, Position, Style.
$form["solo_settings"]["settings_global_misc"]["back_to_top"] = [
  '#type' => 'details',
  '#title' => t('Back to top'),
  '#group' => 'global_misc_tabs',
  '#weight' => 99,
  '#description' => t('Fixed button that scrolls to top when clicked. Default: off.'),
];

$form["solo_settings"]["settings_global_misc"]["back_to_top"]["back_to_top_enabled"] = [
  '#type' => 'checkbox',
  '#title' => t('Enable back to top'),
  '#default_value' => theme_get_setting('back_to_top_enabled') ?? FALSE,
  '#description' => t('Show the button after the user scrolls down.'),
  '#id' => 'edit-back-to-top-enabled',
];

$form["solo_settings"]["settings_global_misc"]["back_to_top"]["visibility"] = [
  '#type' => 'fieldset',
  '#title' => t('Visibility'),
  '#states' => ['visible' => [':input#edit-back-to-top-enabled' => ['checked' => TRUE]]],
];

$form["solo_settings"]["settings_global_misc"]["back_to_top"]["visibility"]["back_to_top_disable_admin_routes"] = [
  '#type' => 'checkbox',
  '#title' => t('Disable on admin routes'),
  '#default_value' => theme_get_setting('back_to_top_disable_admin_routes') ?? TRUE,
  '#description' => t('Recommended. Editors should not see the button in the admin UI.'),
];

$form["solo_settings"]["settings_global_misc"]["back_to_top"]["visibility"]["back_to_top_disable_authenticated"] = [
  '#type' => 'checkbox',
  '#title' => t('Disable for authenticated users'),
  '#default_value' => theme_get_setting('back_to_top_disable_authenticated') ?? FALSE,
  '#description' => t('Optional. Some site owners prefer a cleaner UX for editors.'),
];

$form["solo_settings"]["settings_global_misc"]["back_to_top"]["visibility"]["back_to_top_hide_small_screens"] = [
  '#type' => 'checkbox',
  '#title' => t('Hide on small screens (&lt;768px)'),
  '#default_value' => theme_get_setting('back_to_top_hide_small_screens') ?? FALSE,
  '#description' => t('Optional. Mobile users often do not need it.'),
];

$form["solo_settings"]["settings_global_misc"]["back_to_top"]["visibility"]["back_to_top_scroll_threshold"] = [
  '#type' => 'number',
  '#title' => t('Show after scroll distance (px)'),
  '#default_value' => theme_get_setting('back_to_top_scroll_threshold') ?? 400,
  '#min' => 200,
  '#max' => 800,
  '#step' => 50,
  '#description' => t('Button appears after the user scrolls this many pixels down (200–800).'),
];

$form["solo_settings"]["settings_global_misc"]["back_to_top"]["position"] = [
  '#type' => 'fieldset',
  '#title' => t('Position'),
  '#states' => ['visible' => [':input#edit-back-to-top-enabled' => ['checked' => TRUE]]],
];

$form["solo_settings"]["settings_global_misc"]["back_to_top"]["position"]["back_to_top_position"] = [
  '#type' => 'select',
  '#title' => t('Placement'),
  '#options' => [
    'bottom-right' => t('Bottom right'),
    'bottom-left' => t('Bottom left'),
  ],
  '#default_value' => theme_get_setting('back_to_top_position') ?? 'bottom-right',
];

$form["solo_settings"]["settings_global_misc"]["back_to_top"]["style"] = [
  '#type' => 'fieldset',
  '#title' => t('Style'),
  '#states' => ['visible' => [':input#edit-back-to-top-enabled' => ['checked' => TRUE]]],
];

$form["solo_settings"]["settings_global_misc"]["back_to_top"]["style"]["back_to_top_style"] = [
  '#type' => 'select',
  '#title' => t('Button style'),
  '#options' => [
    'solid' => t('Solid circle'),
    'outline' => t('Minimal outline'),
  ],
  '#default_value' => theme_get_setting('back_to_top_style') ?? 'solid',
];

$form["solo_settings"]["settings_global_misc"]["back_to_top"]["style"]["back_to_top_icon"] = [
  '#type' => 'select',
  '#title' => t('Icon'),
  '#options' => [
    'arrow-up' => t('Arrow up'),
    'chevron-up' => t('Chevron up'),
    'arrow-minimal' => t('Arrow (minimal)'),
  ],
  '#default_value' => theme_get_setting('back_to_top_icon') ?? 'arrow-up',
];

$back_to_top_style = &$form["solo_settings"]["settings_global_misc"]["back_to_top"]["style"];
$back_to_top_style["settings_back_to_top___r_bg"] = _generate_form_element(
  'back_to_top', t('Back to top'), '__r_bg', t('Background (optional)')
);
$back_to_top_style["settings_back_to_top___r_tx"] = _generate_form_element(
  'back_to_top', t('Back to top'), '__r_tx', t('Icon color')
);

// Menu template assignment tab: one row per menu; same path so save works.
$saved_assignments = theme_get_setting('menu_template_assignments') ?? [];
$saved_assignments = is_array($saved_assignments) ? $saved_assignments : [];
$saved_by_menu = [];
foreach ($saved_assignments as $row) {
  if (!empty($row['menu_id']) && !empty($row['template'])) {
    $saved_by_menu[$row['menu_id']] = $row['template'];
  }
}

$form["solo_settings"]["settings_global_misc"]["menu_template_assignment"] = [
  "#type" => "details",
  "#title" => t("Menu template assignment"),
  "#group" => "global_misc_tabs",
  "#weight" => 100,
  "#id" => "edit-menu-template-assignment",
  "#description" => t("Assign which Twig template is used when a menu is rendered. Every menu is listed; choose a template per menu or leave as default. Save configuration to apply."),
];

$allowed_menu_templates = [
  'menu--responsive-menu-template-hover.html.twig' => t('Responsive menu (hover)'),
  'menu--responsive-menu-template-click.html.twig' => t('Responsive menu (click)'),
  'menu--primary-sidebar-menu-template-hover.html.twig' => t('Sidebar menu (hover)'),
  'menu--primary-sidebar-menu-template-click.html.twig' => t('Sidebar menu (click)'),
];
$all_templates = _solo_get_menu_template_options();
$template_select_options = ['' => t('- Default -')];
foreach ($allowed_menu_templates as $key => $label) {
  if (isset($all_templates[$key])) {
    $template_select_options[$key] = $label;
  }
}

$form["solo_settings"]["settings_global_misc"]["menu_template_assignment"]["menu_template_assignments"] = [
  '#type' => 'table',
  '#header' => [t('Menu name'), t('Template name'), ''],
  '#empty' => t('No menus found.'),
  '#tree' => TRUE,
  '#prefix' => '<div class="solo-menu-template-assignment-table-wrapper">',
  '#suffix' => '</div>',
];

foreach ($menus as $menu_id => $menu) {
  $form["solo_settings"]["settings_global_misc"]["menu_template_assignment"]["menu_template_assignments"][$menu_id]['menu_name'] = [
    '#type' => 'item',
    '#title' => t('Menu'),
    '#title_display' => 'invisible',
    '#markup' => $menu->label(),
  ];
  $form["solo_settings"]["settings_global_misc"]["menu_template_assignment"]["menu_template_assignments"][$menu_id]['template'] = [
    '#type' => 'select',
    '#title' => t('Template'),
    '#title_display' => 'invisible',
    '#options' => $template_select_options,
    '#default_value' => $saved_by_menu[$menu_id] ?? '',
  ];
  // menu_id must be in the row for submit; 'value' submits but put last.
  $menu_assignments = &$form["solo_settings"]["settings_global_misc"]["menu_template_assignment"]["menu_template_assignments"][$menu_id];
  $menu_assignments['menu_id'] = [
    '#type' => 'value',
    '#value' => $menu_id,
  ];
}
