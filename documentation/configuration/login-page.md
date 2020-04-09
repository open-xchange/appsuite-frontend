---
title: Login page
---
# Introduction
With 7.10.4 a new, configurable login page has been introduced which offers a custom pages without a custom theme. The configuration will be loaded as part from the appsuite-configration. That means, it also supports multi-tenancy.

# Configuration
To configure the login page, different attributes in the `as-config.yml` to change the appearance of the login screen can be set. Every not configured property will fall back to its default.

To change the configuration, the properties in the config file `as-config.yml` need to be set.

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
This sections describes how the different attributes are configured. All values are **strings** and the nested structure is mandatory.

## loginPage
The attribute 'loginPage' is the root container that contains the whole configuration of the login page.

<config>backgroundImage</config>
The attribute 'backgroundImage' sets the background. It can be used with any valid values within css 'background', like a color, gradient or image url.

<config>backgroundColor</config>
The attribute 'backgroundColor' is used as a layer beyond the image while it's getting loaded or if the image can't be loaded at all. It can be used with any valid values within css 'background', like a color, gradient or image url.

<config>teaser</config>
The value of the attribute 'teaser' will be interpreted as HTML to display custom content next to the login box. The teaser will not shown if the login box is centered (see `loginBox`) or the screen is too small.

<config>logo</config>
The logo can be an image url or SVG.

<config>loginBox</config>
The attribute 'loginBox' describes the position of the login box on the page: `left`, `right` or `centered`.

<config>informationMessage</config>
The value of the attribute 'informationMessage' will be interpreted as HTML to display custom content below the login box. It will not be shown on mobile devices.

<config>customCss</config>
With attribute 'customCss' custom css rules can be applied for elements within the `div id="io-ox-login-screen"`. Note that the css rules will be scoped to the `io-ox-login-screen` id such that no other elements outside of the login page are affected.

### Section "topVignette":
To get a better contrast for the page header, a vignette shadow at the top of the page can be set.

<config>transparency</config>
This sets the transparency of the top vigenette between 0 and 1. Please note, that this is also a **string**.

### Section "header":
This section describe elements inside the header. The header elements are those, displayed in the top bar.

<config>title</config>
The attribute 'title' will be displayed as a string on top of the login box or on mobile devices in the header.

<config>textColor</config>
The attribute 'textColor' sets the color of the text within the header. Any valid values for css 'color' can be used.

<config>linkColor</config>
The attribute 'linkColor' sets the color of links within the header. Any valid values for css 'color' can be used.

<config>sorting</config>
The attribute 'sorting' describes the order of the header elements logo and language selector. It expecteds a comma separated list of elements, each element starting with `$`. Possible elements are `$language`, `$logo`, `$spacer`. The `$spacer` is used to determine the alignment of the element.
If the first element is the `$spacer`, following elements will be right aligned. If the `$spacer` is between `$logo` and `$language`, the logo will be left and the language selector will be right aligned.

### Section "form":
The form attributes describe the appearance of the login box.

<config>textColor</config>
The attribute 'textColor' sets the color of the text within the login box. Any valid values for css 'color' can be used.

<config>linkColor</config>
The attribute 'linkColor' sets the color of links within the login box. Any valid values for css 'color' can be used.

<config>header</config>
The header attributes describe the header of the login box.

- **background**: The attribute 'background' sets the background like the css attribute 'background' (color, gradient, image url).
- **textColor**: The attribute 'textColor' sets the color of the text. Any valid values for css 'color' can be used.

<config>button</config>
The attributes in the button section describe the buttons within the login box.

- **color**: The attribute 'color' sets the background color and border color of the button.
- **textColor**: The attribute 'textColor' sets the text color of the button. Any valid values for css 'color' can be used.

### Section "footer":
The attributes of the footer section describe the elemeents displayed at the bottom of the login page.

<config>sorting</config>
The attribute 'sorting' describes the order of the footer elements. There can be set multiple `$spacer` elements to align the elements the same way it's described for the 'sorting' attribute of the page header.

<config>privacy</config>
The attribute 'privacy' sets the link url to the privacy policy.

<config>imprint</config>
The attribute 'imprint' sets the link url to the legal.

<config>copyright</config>
The attribute 'copyright' describes the copyright text. The placeholder `$year` will be replaced by the current year, `(c)` will be replaced by the unicode copyright sign.

<config>background</config>
The attribute 'background' sets the background color of the footer like the css attribute 'background'. Transparency can be achieved with RGBA values.

<config>textColor</config>
The attribute 'textColor' sets the text color within the footer. Any valid values for css 'color' can be used.

<config>linkColor</config>
The attribute 'linkColor' sets the color of links within within the footer. Any valid values for css 'color' can be used.
