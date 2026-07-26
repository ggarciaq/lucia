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
$region = "credit_copyright";
$label = "credit & Copyright";

$form["solo_settings"]["settings_{$region}"] = [
  "#type" => "details",
  "#title" => t("<strong class='purple'>Copyright & Credit</strong> Settings - Solo Theme"),
  "#collapsible" => TRUE,
  "#collapsed" => TRUE,
  "#description" => t("Configure copyright text, footer links, and styling for credit/copyright section."),
];

// Create vertical tabs container.
$form["solo_settings"]["settings_{$region}"]["copyright_tabs"] = [
  "#type" => "vertical_tabs",
  "#default_tab" => "edit-copyright-content",
];

// Copyright & Link Settings Tab.
$form["solo_settings"]["settings_{$region}"]["copyright_content"] = [
  "#type" => "details",
  "#title" => t("Copyright & Link Settings"),
  "#group" => "copyright_tabs",
  "#weight" => -10,
  "#id" => "edit-copyright-content",
];

$form["solo_settings"]["settings_{$region}"]["copyright_content"]["classes_{$region}"] = _generate_css_classes($region, $label);


// Toggle: simple fields vs one formatted text field (HTML, e.g. ICP).
$form["solo_settings"]["settings_{$region}"]["copyright_content"]["footer_use_formatted_text"] = [
  "#type" => "checkbox",
  "#title" => t("Use a single formatted text field for copyright and credit"),
  "#description" => t("One field for copyright. When checked, four fields hide."),
  "#default_value" => theme_get_setting("footer_use_formatted_text"),
];

$form["solo_settings"]["settings_{$region}"]["copyright_content"]["footer_copyright"] = [
  "#type" => "textfield",
  "#title" => t("Enter Copyright Text"),
  "#description" => t("Type %year% instead of an actual number for a dynamic copyright year. (Copyright © %year% Company Name - All rights reserved)."),
  "#default_value" => theme_get_setting("footer_copyright"),
  "#states" => [
    "visible" => [
      ":input[name=\"footer_use_formatted_text\"]" => ["checked" => FALSE],
    ],
  ],
];

$allowed_formats = _solo_get_text_formats();
$footer_formatted = theme_get_setting("footer_copyright_formatted");
$form["solo_settings"]["settings_{$region}"]["copyright_content"]["footer_copyright_formatted"] = [
  "#type" => "text_format",
  "#title" => t("Copyright and credit (formatted)"),
  "#description" => t("Enter copyright, credit, and any footer legal text (e.g. ICP license, approval number). You can use the chosen text format for links and basic HTML. Type %year% for the current year."),
  "#default_value" => ($footer_formatted ?? [])["value"] ?? "",
  "#format" => ($footer_formatted ?? [])["format"] ?? "basic_html",
  "#allowed_formats" => $allowed_formats,
  "#states" => [
    "visible" => [
      ":input[name=\"footer_use_formatted_text\"]" => ["checked" => TRUE],
    ],
  ],
];

$form["solo_settings"]["settings_{$region}"]["copyright_content"]["footer_link"] = [
  "#type" => "textfield",
  "#title" => t("Enter Footer Link URL"),
  "#description" => t("Enter the URL for the footer link."),
  "#default_value" => theme_get_setting("footer_link"),
  "#states" => [
    "visible" => [
      ":input[name=\"footer_use_formatted_text\"]" => ["checked" => FALSE],
    ],
  ],
];

$form["solo_settings"]["settings_{$region}"]["copyright_content"]["footer_link_label"] = [
  "#type" => "textfield",
  "#title" => t("Enter Footer Link Label"),
  "#description" => t("Enter the Label for the footer link[Footer Link Label][Footer Link Text]."),
  "#default_value" => theme_get_setting("footer_link_label"),
  "#states" => [
    "visible" => [
      ":input[name=\"footer_use_formatted_text\"]" => ["checked" => FALSE],
    ],
  ],
];

$form["solo_settings"]["settings_{$region}"]["copyright_content"]["footer_link_text"] = [
  "#type" => "textfield",
  "#title" => t("Enter Footer Link Text"),
  "#description" => t("Enter the text for the footer link. This field is required if a URL is provided."),
  "#default_value" => theme_get_setting("footer_link_text"),
  "#states" => [
    "visible" => [
      ":input[name=\"footer_use_formatted_text\"]" => ["checked" => FALSE],
    ],
  ],
];

// Color Settings Tab.
$form["solo_settings"]["settings_{$region}"]["color_settings"] = [
  "#type" => "details",
  "#title" => t("Color Settings"),
  "#group" => "copyright_tabs",
  "#weight" => -8,
  '#attributes' => [
    'class' => ['solo-color-panel'],
    'data-solo-panel' => 'colors',
  ],
];

foreach ($attributes as $attribute_key => $attribute_label) {
  $form["solo_settings"]["settings_{$region}"]["color_settings"]["settings_{$region}_{$attribute_key}"] = _generate_form_element($region, $label, $attribute_key, $attribute_label);
}
