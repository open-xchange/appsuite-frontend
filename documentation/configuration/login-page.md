---
title: Login page
---
# Introduction
The new login screen supports several different modes and layouts all based on a configuration. This way we can offer a core component which can be re-used to apply basic branding to the screen without installing a custom login theme. The configuration will be loaded from the middleware, supporting different hostnames to handle multi tenancy as well.

# Configuration
To configure the login page you can set different attributes in the `as-config.yml` to change the appearance of the login screen. You don't need to set all properties. Unset properties will get the default values that are defined in the code.

To change the configuration you have to login to the server and set properties in the config file `as-config.yml`.

```bash
  vim /opt/open-xchange/etc/as-config.yml
```

If changes were made, the `as-config.yml` has to be reloaded with the following command:

```bash
  /opt/open-xchange/sbin/reloadconfiguration
```

# Default configuration
The default configuration has the following structure and values:

```yaml
  default:
      host: all
      loginPage:
          backgroundImage: "radial-gradient(at 33% 50%, #3b6aad, #1f3f6b)"
          backgroundColor: "radial-gradient(at 33% 50%, #3b6aad, #1f3f6b)"
          #teaser: "<div>any html ... </div>"
          logo: "https://www.open-xchange.com/typo3conf/ext/sem_ox_content/Resources/Public/Images/ox-logo-new.png"
          topVignette:
              transparency: "0.1"
          header:
              title: "App Suite"
              textColor: "#fffff"
              linkColor: "#94c1ec"
              sorting: "$logo,$language,$spacer"
          loginBox: "right"
          form:
              textColor: "#333333"
              linkColor: "#94c1ec"
              header:
                  background: "#f5f5f5"
                  textColor: "#333333"
              button:
                  color: "#3662a0"
                  textColor: "#ffffff"
          # informationMessage: '<div style="text-align: center;">Watch out for phishing mails. For more details see: <a style="color: #ffc800;" href="https://en.wikipedia.org/wiki/Phishing">Wikipedia Phishing</a></div>',
          footer:
              sorting: "$spacer,$copyright,Version: $version,$privacy,$imprint,$spacer"
              privacy: "https://www.open-xchange.com/privacy/"
              imprint: "https://www.open-xchange.com/legal/"
              copyright: "(c) $year OX Software GmbH"
              background: "rgba(0, 0, 0, 0.15)"
              textColor: "#ffffff"
              linkColor: "#94c1ec"
          #customCss: "#any-selector { text-transform: uppercase; }"
```

# Properties
This sections describes how you can use the different properties. Pay attention to the nested structure. You always have to add the values as **strings**!

## loginPage
The attribute 'loginPage' is the root attribute that contains the whole configuration of the login page.

<config>backgroundImage</config>
The attribute 'backgroundImage' sets the background. You can use it like the css attribute 'background' for defining a color, gradient or image url.

<config>backgroundColor</config>
The attribute 'backgroundColor' is used as a layer beyond the image while it's getting loaded or if the image can't be loaded at all. You can use it like the css attribute 'background' for defining a color, gradient or image url.

<config>teaser</config>
The value of the attribute 'teaser' will be interpreted as pure HTML to display custom content next to the login box. If the login box is centered, the screen to small or disiplayed by a mobile device it will be hidden.

<config>logo</config>
The logo can be an image url or SVG.

<config>loginBox</config>
The attribute 'loginBox' describes the position of the login box on the page: Left, right or centered.

<config>informationMessage</config>
The value of the attribute 'informationMessage' will be interpreted as pure HTML to display custom content below the login box. If it is disiplayed by a mobile device it will be hidden.

<config>customCss</config>
The attribute 'customCss' allows it to introduce some custom css rules that are valid for the `div id="io-ox-login-screen"` section.

### Section topVignette:
To get a better contrast for the page header you can set a vignette shadow at the top of the page.

<config>transparency</config>
For the top vignette you can define a transparency between 0 and 1.

### Section header:
Header elements will be displayed at the top of the login page.

<config>title</config>
The attribute 'title' will be displayed as a string on top of the login box or on mobile devices in the header.

<config>textColor</config>
The attribute 'textColor' sets the color of the text within the header. You can use it as the css atribute 'color'.

<config>linkColor</config>
The attribute 'linkColor' sets the color of links within the header. You can use it as the css atribute 'color'.

<config>sorting</config>
The attribute 'sorting' describes the order of the header elements logo and language selector. There can be set multiple `$spacer` elements to align the elements.
If you put a spacer element at the beginning of the sorting, the other elements will be placed to the right. If you put a spacer element between the logo and language selector, the logo will be placed to the left and the language selector to the right.

### Section form:
The form attributes describe the appearance of the login box.

<config>textColor</config>
The attribute 'textColor' sets the color of the text within the login box. You can use it as the css atribute 'color'.

<config>linkColor</config>
The attribute 'linkColor' sets the color of links within the login box. You can use it as the css atribute 'color'.

<config>header</config>
The header attributes describe the header of the login box.

- **background**: The attribute 'background' sets the background like the css attribute 'background' (color, gradient, image url).
- **textColor**: The attribute 'textColor' sets the color of the text. You can use it as the css atribute 'color'.

<config>button</config>
The attributes in the button section describe the buttons within the login box.

- **color**: The attribute 'color' sets the background color and border color of the button.
- **textColor**: The attribute 'textColor' sets the text color of the button. You can use it as the css atribute 'color'.

### Section footer:
The attributes of the footer section describe the elemeents displayed at the bottom of the login page.

<config>sorting</config>
The attribute 'sorting' describes the order of the footer elements. There can be set multiple `$spacer` elements to align the elements the same way it's described for the 'sorting' attribute of the page header.

<config>privacy</config>
The attribute 'privacy' defines the link url to the privacy policy.

<config>imprint</config>
The attribute 'imprint' defines the link url to the legal.

<config>copyright</config>
The attribute 'copyright' describes the copyright text. The placeholder `$year` will be replaced by the current year, `(c)` will be replaced by the unicode copyright sign.

<config>background</config>
The attribute 'background' sets the background color of the footer like the css attribute 'background'. If you use a RGBA value you can set some transparency.

<config>textColor</config>
The attribute 'textColor' sets the text color within the footer. You can use it as the css atribute 'color'.

<config>linkColor</config>
The attribute 'linkColor' sets the color of links within within the footer. You can use it as the css atribute 'color'.
