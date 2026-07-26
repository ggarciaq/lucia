# Solo - W3CSS Theme

Solo is the third generation of the W3CSS Theme and has been thoroughly
revamped. This version does not rely on jQuery, making the inclusion of
the w3.css library optional.

Should you wish to construct a more intricate website, consider utilizing
the [Paragraphs Bundles](https://www.drupal.org/project/paragraphs_bundles)
module. This module equips you with robust capabilities to create complex
components such as 3D cards, slideshows, 3D carousel, tabs, cards,
accordions, and more.

## Features

### 24 Regions

The theme offers 24 distinct regions, each with its own unique settings,
allowing for a high degree of customization and control over the look and
feel of your website. The regions in this theme are designed to accommodate
a wide variety of content types and layouts.

### Intelligent Design

If a region is not being used, its settings will be hidden. This helps to
keep the theme's interface clean and uncluttered, making it easier for you
to find and adjust the settings you need.

### Responsive Design

Solo theme is fully responsive, ensuring your website will look and function
perfectly on all devices, including desktops, tablets, and smartphones.

### Five Breakpoints

The Solo theme provides 5 breakpoints for the site and 5 for the menu,
enabling you to display the most optimal layout to the user.

### Three-Level Main Menu and Megamenu

Includes a three-level main menu, enabling you to create a complex navigation
structure with ease. Hoverable or clickable.

### Sidebar Main Menu

In addition to the three-level main menu, the theme also includes a sidebar
main menu, providing an additional navigation option.

### Customized Colors

Customize 15 color fields per region to align the colors with your brand
identity.

Variable Definitions:
Solo theme uses CSS custom properties for region-specific theming, providing 
granular control while ensuring consistency across layouts. Below are the 
available region variables:

--r-bg: Region background color. Sets the overall background color of the 
region wrapper.

--r-tx: Region text color. Sets the default text color for all paragraph and 
inline text within the region.

--r-h1: Region heading color. Specifically controls the color for headings (h1,
 h2, h3) within the region.

--r-lk: Region link color. Sets the color for anchor (<a>) links in their 
  normal (non-hover) state.

--r-lk-h: Region link hover color. Sets the color for links when hovered or 
focused, aiding user feedback.

--r-br: Region border color. Sets the border color for the region, allowing 
clear section separation.

--r-bg-fr: Form background color within the region. Targets backgrounds of 
forms such as login and search blocks within the region.

--r-tx-lk: Menu link text color within the region. Sets the text color for 
navigation/menu links.

--r-tx-lk-h: Menu link hover text color within the region, aiding clear 
navigation feedback.

--r-bg-lk: Menu link background color in the region (normal state).

--r-bg-lk-h: Menu link background hover color in the region.

--r-tx-bt: Button text color within the region (normal state).

--r-tx-bt-h: Button text hover color within the region.

--r-bg-bt: Button background color within the region (normal state).

--r-bg-bt-h: Button background hover color within the region.

### Customized Layout

Customize your website's layout with seven styles for two-column layouts,
three styles for three-column layouts, and four styles for four-column layouts.

### Preloader, Back to Top, Menu Template Assignment, and Formatted Copyright

Features added for loading experience, scroll behavior, menu presentation, and 
footer content.

#### Preloader (Global Settings)

Load-based preloader: displays while the page is loading and hides when ready.
No minimum display time—fast loads show it briefly; slow loads keep it until
complete. Configurable **max display time** (3–60 seconds) acts as a fallback
only if the load event never fires. **Visibility:** enable/disable, **hide
trigger** (“Page appears” via `DOMContentLoaded` — default, or “Page fully
loaded” via `window.load`), max display (sec), “Force show for testing” (30s),
disable on admin routes, disable for authenticated users, and **path
include/exclude rules** (one path per line; prefix with minus to exclude, e.g.
`-/contact`; list paths without prefix to show only on those paths).
**Appearance:** style (spinner, progress bar, text, logo, or logo + text).
**Transition effect** (fade, slide up/down/left/right, zoom out, blur) controls
how the preloader disappears. Spinner: modern thin ring with optional percentage
inside. Progress bar: centered rounded bar (320px max-width) with animated fill
and percentage label. Text/logo: optional text, font, animation effect, font
size; logo can **use theme logo** or a custom path (public://, themes/..., or
filename). Background color with **separate opacity** (0–100%, applied only to
background, not content) and text color. Library and CSS are attached only when
the preloader is enabled (scoped under `html.solo-preloader-enabled`). Shows
**instantly on link click** (capture phase) and hides when the new page is
ready. Critical CSS in head; respects reduced motion.

#### Back to Top (Global Settings)

Accessible back-to-top button under Global Settings: enable/disable, visibility
(admin routes, authenticated users, small screens), scroll distance (200–800 px),
position (bottom-right or bottom-left), style (solid/outline), optional colors,
and icon (arrow-up, chevron-up, arrow-minimal). Styling uses **CSS variables**
only (no inline layout); scroll threshold is set as a variable and applied in
CSS. Uses proper button semantics and respects reduced motion.

#### Menu Template Assignment (Global Settings)

Under Global Settings, assign any of Solo's responsive menu Twig templates to any
menu (primary, footer, or custom). Control how each menu is rendered—e.g. use the
main menu in the header with a specific responsive template—without custom code.

#### Formatted Copyright and Credit

Option to use a single formatted (rich-text) field for copyright and credit in the
footer. Enter all copyright, legal text, links, and ICP in one field with a chosen
text format. When off, the four separate copyright/credit fields remain available.

### Conclusion

Solo is perfect for those who want a high degree of control over their
website's design, but also value simplicity and ease of use. Whether you are
creating a simple blog or a complex corporate website, Solo theme will provide
you with the tools you need to create an effective online presence.

## Solo Regions

The Solo theme encompasses two types of regions: **Single and Grouped regions**.

### [1] Single Regions

The theme consists of the following single regions:

1. Popup Login Block
2. Fixed Search Block
3. Header
4. Primary Sidebar Menu
5. Primary Menu
6. Welcome Text
7. Highlighted
8. System Messages
9. Page Title
10. Breadcrumb
11. Footer Menu Container

All single regions are visible on all site pages, except 'Page Title' (not
visible on the home page) and 'Welcome Text' (visible on the home page only).

### [2] Grouped Regions

The theme also includes the following grouped regions:

| TOP         | MAIN         | BOTTOM        | FOOTER        |
|-------------|--------------|---------------|---------------|
| 1. Top 1    | 1. Sidebar L | 1. Bottom 1   | 1. Footer 1   |
| 2. Top 2    | 2. Content   | 2. Bottom 2   | 2. Footer 2   |
| 3. Top 3    | 3. Sidebar R | 3. Bottom 3   | 3. Footer 3   |
|             |              | 4. Bottom 4   |               |

# Theme Architecture

The `div` element with the class `page-wrapper` wraps around 2
4 distinct regions.
Both the `page-wrapper` and each of these regions can have up to 15 different
color inputs applied to them. The color inputs can be categorized as follows:

## Color Categories

- **General**
  - Background color
  - Text color
  - Border color
  - HTML heading color (h1, h2, h3)
  - Background color for Form Input Field

- **Links**
  - Text link color
  - Text link hover color

- **Menus**
  - Text menu link color
  - Text menu link hover color
  - Background menu link color
  - Background menu link hover color

- **Buttons**
  - Text color for buttons
  - Text hover color for buttons
  - Background button color
  - Background button hover color

**Note:** The construction of the 15 colors is as follows: First, apply global
colors to the page wrapper. Then, for each region, apply specific colors. Note
that the colors of the regions will override the global colors.

# Theme Settings

## Blueprint

The blueprint for the Solo theme regions is a structured layout that defines
the various sections of a web page. Here's a brief description of each region:

- `highlighted`: This block is for highlighted or important content.
- `popup_login_block`: This is a block that pops up for user login.
- `fixed_search_block`: This block is for the search bar, fixed in place.
- `header`: The topmost part of the webpage, usually with the logo and
navigation.
- `primary_sidebar_menu`: The main sidebar menu, on the left or right of the
page.
- `primary_menu`: The main navigation menu, usually in the header.
- `welcome_text`: A text block welcoming the user to the website.
- `top_first`, `top_second`, `top_third`: Container blocks at the top of the
page.
- `system_messages`: This block displays system messages to the user.
- `page_title`: Displays the title of the current page.
- `breadcrumb`: Navigation links showing the user's path to the current page.
- `sidebar_first` (Left Sidebar), `sidebar_second` (Right Sidebar).
- `content`: The main content area of the webpage.
- `bottom_first`, `bottom_second`, `bottom_third`, `bottom_fourth`: Bottom
blocks.
- `footer_first`, `footer_second`, `footer_third`: Footer container blocks.
- `footer_menu`: The navigation menu in the footer.

Each of these regions can contain various types of content, such as text,
images, links, and more, depending on the needs of the website.

This blueprint serves as a starting point and guide for developers, designers,
and other site builders involved in the development process.

## Global Site Settings

- Solo theme provides features to adjust website width and breakpoints.
- It allows altering spaces between regions and modifying layout settings.
- Solo theme enables font size modifications and custom data formats.
- Ability to import Google fonts and add custom CSS to the header.
- Modify login, register, and password pages; change header and menu order.
- Offers animation features and layout changes for multiple value fields.
- Apply reading mode to content types, setting max width for content regions.
- **Preloader:** Load-based preloader (no minimum time; configurable max display fallback). Hide trigger: “Page appears” (DOM ready, default) or “Page fully loaded”. Path include/exclude rules. Styles: spinner (with optional %), progress bar, text, logo, logo+text. Transition effects: fade, slide up/down/left/right, zoom out, blur. Background opacity (0–100%, bg only). Optional theme or custom logo, text/font/effects, colors. Instant show on link click; scoped CSS; “Force show for testing” 30s; respects reduced motion.
- **Back to top:** Accessible button; visibility, scroll distance (200–800 px), position, style (solid/outline), colors, icon. CSS variables only (no inline layout).
- **Menu template assignment:** Assign any responsive menu Twig template to any menu (primary, footer, or custom) so each menu can use a different template.
- **Formatted copyright and credit:** Option to use one rich-text field for all copyright and credit in the footer; when off, the four separate fields are used.

## Libraries and Fonts Settings

- Feature to upload and use the w3.css library locally.
- Modify the font family of the entire website with Google fonts.
- Alter font family of h1, h2, h3 with Google fonts selections.
- Offers 25 special Google fonts for application to HTML tags.

## Page Wrapper Settings

- Input field for predefined CSS classes from Solo or third-party libraries.
- 15 color input fields for global use across the site.

## Predefined Color Scheme Settings

- Dropdown select list with 50 predefined Color Scheme Themes for the site.

## Social Media Links Settings

- Options for social media icon sizes (Small, Medium, Large).
- Input color field to change social media icon colors.
- Checkbox to show or hide social icons.
- Eight social text fields and one RSS field.

# Single Regions Settings

## Highlighted Settings

- Change visibility options for the highlighted block.
- Text input for predefined CSS classes.
- 15 color input fields for this region.

## Popup Login Block Settings

- Input field for predefined CSS classes.
- Checkbox for popup block login feature.
- Text field to customize login wording.
- 15 color input fields for this region.

## Fixed Search Block Settings

- Input field for predefined CSS classes.
- 15 color input fields for this region.

# Theme Settings Documentation

## Header Settings

- Text input for predefined CSS classes from Solo or third-party libraries.
- Checkbox to center Site's Name, Slogan, and Logo.
- Checkbox to adjust positioning of Search Icon, User Menu, Sidebar Menu, and
  Sidebar Hamburger to the left.
- Dropdown for 24 predefined CSS text animations for the Site name.
- 15 color input fields for this region.

## Primary Sidebar Menu Settings

- Text input for predefined CSS classes.
- Checkbox to apply borders to menu items.
- 15 color input fields for this region.

## Primary Menu Settings

- Text input for predefined CSS classes.
- Checkbox for hover-to-show main menu dropdowns.
- Checkbox to apply borders to menu items.
- Checkbox for even space distribution between menu items.
- 15 color input fields for this region.
- Checkbox for Mega Menu transformation with additional fields:
  - Mega Menu Layout options (2-4 columns with various percentages).
  - Mega Menu Header checkbox for second level headers.

## Welcome Settings

- Text input for predefined CSS classes.
- 15 color input fields for this region.

## System Message Settings

- Text input for predefined CSS classes.
- 15 color input fields for this region.

## Page Title Settings

- Text input for predefined CSS classes.
- Dropdown for 24 predefined CSS text animations for the page title.
- 15 color input fields for this region.

## Breadcrumb Settings

- Text input for predefined CSS classes.
- Checkbox to hide page title from the breadcrumb.
- 15 color input fields for this region.

## Footer Menu Settings

- Text input for predefined CSS classes.
- Dropdown for 24 predefined CSS text animations for the page title.
- 15 color input fields for this region.

## Copyright and Credit Settings

- Text input for predefined CSS classes.
- 15 color input fields for this region.
- Text field for dynamic copyright year.
- Checkbox to show or hide credit.
- **Formatted copyright and credit:** When enabled, one rich-text field is used for all copyright and credit; when off, the four separate fields above are used. See *Formatted Copyright and Credit* above for details.

## Grouped Regions

Regions grouped together are enclosed within a div. While the region wrapper
has its own settings, individual regions maintain their own settings.

### The (TOP, MAIN, BOTTOM, FOOTER) Region Wrapper Settings

- Two, three, and four columns settings with various percentage distributions.
- Change visibility options (Visible on all pages, Home Page Only, All Pages
Except Home Page).
- Checkbox for animation on individual region's border (Not for Main).
- Checkbox to apply borders to each individual region.
- Radio field for round corners on each individual region.
- Text input for predefined CSS classes.
- 15 color input fields for this region.

### Individual Region Settings

- Text input for predefined CSS classes.
- 15 color input fields for this region.
