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

$form["solo_settings"]["settings_blueprint"] = [
  "#type" => "details",
  "#title" => t("<strong class='purple'>Theme Blueprint & Flexibility Showcase</strong> - Solo Theme"),
  "#collapsible" => TRUE,
  "#collapsed" => TRUE,
  "#description" => t("

<div class='hero-banner'>
  <h2>🚀 Unleash Your Creativity with 25+ Flexible Regions!</h2>
  <p><strong>Solo Theme gives you unprecedented control</strong> - Build anything from simple blogs to complex business sites with our intuitive region system.</p>
</div>

<div class='features-grid'>
  <div class='feature-card beginners'>
    <h3>✨ Perfect For Beginners</h3>
    <p>Drag, drop, and configure - no coding required!</p>
  </div>
  <div class='feature-card developers'>
    <h3>🔧 Developer Paradise</h3>
    <p>Full control with custom CSS classes and advanced styling options.</p>
  </div>
</div>

<div class='pro-tip'>
  <h3>💡 Pro Tip: Start with our most popular combinations!</h3>
  <ul>
    <li><strong>Business Sites:</strong> Header + Primary Menu + Welcome Text + Content + Footer regions</li>
    <li><strong>Portfolios:</strong> Highlighted + Top regions + Sidebar + Content showcase</li>
    <li><strong>E-commerce:</strong> Fixed Search + Primary Menu + Product regions + Social integration</li>
  </ul>
</div>

<h3 class='section-title'>🗺️ Your Website Blueprint - Every Region Explained</h3>
<p><strong>Hover over any region below to see real-world examples and use cases!</strong></p>

<div class='blueprint page-wrapper'>
  <div class='highlighted'>
    <h2>🌟 Highlighted Region</h2>
    <p><strong>Perfect for:</strong> Hero sections, special announcements, promotional banners<br><strong>Examples:</strong> 'Welcome to our site!', seasonal promotions, breaking news</p>
  </div>

  <div class='primary-sidebar-menu'>
    <h2>📱 Primary Sidebar Menu</h2>
    <p><strong>Perfect for:</strong> Mobile-friendly navigation, off-canvas menus<br><strong>Examples:</strong> Hamburger menu, category navigation, user account links</p>
  </div>

  <div class='fixed-search-block'>
    <h2>🔍 Fixed Search Block</h2>
    <p><strong>Perfect for:</strong> Always-accessible search, e-commerce product search<br><strong>Examples:</strong> Floating search bar, autocomplete search, filter options</p>
  </div>

  <div class='popup-login-block'>
    <h2>🔐 Popup Login Block</h2>
    <p><strong>Perfect for:</strong> User authentication, member areas, subscription forms<br><strong>Examples:</strong> Modal login, registration forms, social media login</p>
  </div>

  <div class='primary-menu'>
    <h2>🧭 Primary Menu</h2>
    <p><strong>Perfect for:</strong> Main site navigation, mega menus, dropdown categories<br><strong>Examples:</strong> Horizontal nav bar, multi-level menus, CTA buttons</p>
  </div>

  <div class='header'>
    <h2>🏠 Header Region</h2>
    <p><strong>Perfect for:</strong> Logo placement, contact info, social media icons<br><strong>Examples:</strong> Company branding, phone numbers, 'Follow us' links</p>
  </div>

  <div class='welcome-text'>
    <h2>👋 Welcome Text</h2>
    <p><strong>Perfect for:</strong> Hero content, value propositions, mission statements<br><strong>Examples:</strong> 'We build amazing websites', company intro, featured services</p>
  </div>

  <div class='top-regions'>
    <div class='top-one'>
      <h3>📈 Top One</h3>
      <p><strong>Perfect for:</strong> Key metrics, testimonials<br><strong>Examples:</strong> '500+ Happy Clients', featured review</p>
    </div>
    <div class='top-two'>
      <h3>🎯 Top Two</h3>
      <p><strong>Perfect for:</strong> Service highlights, features<br><strong>Examples:</strong> '24/7 Support', key benefits</p>
    </div>
    <div class='top-three'>
      <h3>⚡ Top Three</h3>
      <p><strong>Perfect for:</strong> Call-to-action, special offers<br><strong>Examples:</strong> 'Get Started Today', discount banners</p>
    </div>
  </div>

  <div class='system-messages'>
    <h2>💬 System Messages</h2>
    <p><strong>Perfect for:</strong> User feedback, form confirmations, error notifications<br><strong>Examples:</strong> 'Message sent successfully!', login errors, update notices</p>
  </div>

  <div class='page-title-solo'>
    <h2>📄 Page Title</h2>
    <p><strong>Perfect for:</strong> SEO-friendly headings, page identification<br><strong>Examples:</strong> 'About Us', 'Our Services', dynamic page titles</p>
  </div>

  <div class='breadcrumb'>
    <h2>🍞 Breadcrumb Navigation</h2>
    <p><strong>Perfect for:</strong> User orientation, SEO, site hierarchy<br><strong>Examples:</strong> 'Home > Products > Laptops', navigation trail</p>
  </div>

  <div class='main-regions'>
    <div class='sidebar-first'>
      <h3>📋 Sidebar First</h3>
      <p><strong>Perfect for:</strong> Secondary navigation, widgets, ads<br><strong>Examples:</strong> Category filters, recent posts, newsletter signup</p>
    </div>
    <div class='content'>
      <h3>📝 Main Content</h3>
      <p><strong>Perfect for:</strong> Your primary content, articles, products<br><strong>Examples:</strong> Blog posts, product listings, page content</p>
    </div>
    <div class='sidebar-second'>
      <h3>📊 Sidebar Second</h3>
      <p><strong>Perfect for:</strong> Related content, social feeds, promotions<br><strong>Examples:</strong> 'You might also like', Twitter feed, special offers</p>
    </div>
  </div>

  <div class='bottom-regions'>
    <div class='bottom-one'>
      <h3>🏢 Bottom One</h3>
      <p><strong>Perfect for:</strong> Company info, contact details<br><strong>Examples:</strong> Office locations, business hours</p>
    </div>
    <div class='bottom-two'>
      <h3>🔗 Bottom Two</h3>
      <p><strong>Perfect for:</strong> Quick links, resources<br><strong>Examples:</strong> 'Useful Links', download center</p>
    </div>
    <div class='bottom-three'>
      <h3>📞 Bottom Three</h3>
      <p><strong>Perfect for:</strong> Support info, help center<br><strong>Examples:</strong> FAQ links, support tickets</p>
    </div>
    <div class='bottom-four'>
      <h3>📰 Bottom Four</h3>
      <p><strong>Perfect for:</strong> News, updates, blog feed<br><strong>Examples:</strong> Latest articles, company news</p>
    </div>
  </div>

  <div class='footer-regions'>
    <div class='footer-one'>
      <h3>🌐 Footer One</h3>
      <p><strong>Perfect for:</strong> Essential links, legal pages<br><strong>Examples:</strong> Privacy Policy, Terms of Service</p>
    </div>
    <div class='footer-two'>
      <h3>📧 Footer Two</h3>
      <p><strong>Perfect for:</strong> Contact forms, newsletters<br><strong>Examples:</strong> 'Subscribe to our newsletter', contact info</p>
    </div>
    <div class='footer-three'>
      <h3>🌍 Footer Three</h3>
      <p><strong>Perfect for:</strong> Social media, location info<br><strong>Examples:</strong> Social icons, office addresses</p>
    </div>
  </div>

  <div class='footer-menu'>
    <h2>🔗 Footer Menu</h2>
    <p><strong>Perfect for:</strong> Secondary navigation, sitemap links<br><strong>Examples:</strong> 'Quick Links', footer navigation, accessibility links</p>
  </div>

  <div class='copyright'>
    <h2>© Copyright & Credits</h2>
    <p><strong>Perfect for:</strong> Legal information, theme credits<br><strong>Examples:</strong> '© 2024 Your Company', 'Powered by Solo Theme'</p>
  </div>

  <div class='hidden-region'>
    <h2>🔧 Hidden Region</h2>
    <p><strong>Perfect for:</strong> Developer tools, admin blocks, staging content<br><strong>Examples:</strong> Custom blocks for Twig rendering, admin utilities</p>
  </div>
</div>

<div class='ready-to-build'>
  <h3>🎉 Ready to Build Something Amazing?</h3>
  <p><strong>With Solo Theme, you're not just getting a theme - you're getting a complete website building system!</strong> Start with any region above and create exactly what you envision. No limitations, just possibilities.</p>
</div>

"),

];
