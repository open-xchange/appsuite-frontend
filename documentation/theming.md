---
title: Theming
icon: fa-paint-brush
description: Learn how to create customized themes and use them to change the look of you OX App Suite installation
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Theming
---

<!-- TODO: improve comments in less files and link to them from here -->

# LESS.JS

Appsuite used LESS as dynamic stylesheet language. LESS extends CSS with dynamic behavior such as variables, mixins, operations and functions.

Please read [LESS.JS](http://lesscss.org/#docs) documentation first.

## Using less.js

If your theme depends on less.js, you will need one more step to make it work.
Why? To accelerate the login, compilation of LessCSS files was moved from the login process in the browser to the installation process on the backend.

So all packages just ship their .less files as sources within the package that is due to be installed
on the middleware nodes.
Every change to the less files on a middleware node must be announced by calling
`/opt/open-xchange/share/update-themes.sh --later`.
This should be called from postinst/postun sections of packages shipping less files.
This will force the init script of the middleware to compile the less files during start of
the middleware using update-themes.sh as well.
This can be forced manually by running the script without any option.
This means operators *must* run the script manually or restart the open-xchange service after
changing packages which do contain less files.

Note: Since 7.2.1, LessCSS files must have the file extension .less to be usable with the 'less' RequireJS plugin (module dependencies of the form 'less!filename.less'). Previously we were more lenient and dealt with .css, too.

# File structure

A theme basically consists of two files located in `/opt/open-xchange/appsuite/apps/themes/THEME_ID/`. These files are described in this and the following sections.

_THEME_ID_ is a unique identifier for your theme, which is not visible to users. By convention, it is best derived from a domain name you control, e.g. com.example.prettytheme.

## definitions.less

This file can be used to override variables described in `ui/apps/themes/definitions.less`. The content of that file is also provided [here](theming/variables.html).

## style.less

This file can be used to define any CSS you like. Before doing this, check, if there really is no variable that can be used to achieve the same thing.

## Referencing paths

Since 7.2.1, all URLs are relative to the source .less file in which they are contained. This means that unless a theme changes an image it does not need to include that image anymore.

Old themes must be updated if they change an image from the default theme: All styles from the default theme which refer to a changed image must be overwritten in the custom theme. This way the URLs resolve to the new image.

### Static assets

While most JavaScript code as well as CSS files compiled from less files are being requested from the
middleware via the “apps/load” servlet, it's also possible to bundle static assets which are served
directly from the web server.

If a plugin contains static assets (this also counts for JavaScript files which are not delivered using
the “apps/load” servlet but requested directly), packaging needs to be provided for web server nodes as
well as middleware nodes.
There are grunt tasks in pace to handle these cases:

* `grunt install:dynamic --prefix=/opt/open-xchange/` will copy relevant files for middleware nodes to the directory provided in the prefix option.
* `grunt install:static --htdoc=/var/www/html` will copy relevant files for web server nodes to the directory provided in the htdoc option.

## Replacing the logo

The logo in the top left corner is a `<img>` as only child of a wrapping `<div>` with the id _io-ox-top-logo_. The relative path to the image file consists of the follwing parts:

```
ox.base + '/apps/themes/' + ox.theme + '/logo.png'
```

In case you want to apply more general changes please replace extension `logo` of extension point `io.ox/core/appcontrol`.

### Mobile and retina screens

Almost any mobile device and some newer desktop devices use retina screens. These screens do have a very high pixel density which offer very sharp text rendering. To offer sharp and correctly sized images on retina screens there is and additional CSS directive encapsulated in a media query which must be set in your custom theme.

```
@media only screen and (-webkit-min-device-pixel-ratio: 1.5),
     only screen and (-moz-min-device-pixel-ratio: 1.5),
     only screen and (min-device-pixel-ratio: 1.5),
     only screen and (min-resolution: 240dppx) {
     #io-ox-top-logo-small {
         background-size: 60px 22px;
         background-image: url('apps/themes/default/logo-large.png');
    }
}
```

**It is important that you provide your brand logo in two sizes**, the standard size of 60x22px and a large version with doubled pixel sizes of 120x44px. All retina devices will use the large logo and scale it down the CSS pixel size of 60x22px. This will result in a sharp image as the retina screen can make use of the additional available pixels in the source image.

**Important note:** Your logo must not be wider than 70px (including margins) for mobile devices. Otherwise the toolbar will be broken on mobile devices as the large logo will cause a line wrap in the toolbar. If you need a larger logo use a custom, smaller one for mobiles.

Always test your theme on mobiles, too. You can emulate popular screen sizes with the Google Chrome Dev-Tools.

Remember that images in OX App Suite are served by the web server and not by the application server. This means that images need to be packaged separately (for dedicated web servers) and installed in `/var/www/appsuite/` (or similar, depending on the target platform) instead of `/opt/open-xchange/appsuite/`.

### Replacing Favicons and mobile homescreen icons

Note: This chapter is not about changing AppSuite icons which are used in the application like the brand on the upper right.

AppSuite ships with a standard set of icons containing a favicon and a set of touch icons which are mainly used by iOS and Android devices. These icons are used as default for all devices and browsers as long as you don't deliver your own icons with your theme. To provide your own icons, put them into your theme's directory, e.g. `apps/themes/icons/theme-name`.

**Attention**: Safari and Internet Explorer do not support dynamic changes to the favicon for a webpage. This means, the default icon will be shown even if a custom favicon is provided within a custom theme. To enable the right favicon for a theme on Safari and IE, the overall standard favicon.ico located under `apps/themes/icons/default` on the web server must be replaced with a custom version.

Remember that images in OX App Suite are served by the web server and not by the application server. This means that images need to be packaged separately (for dedicated web servers) and installed in `/var/www/appsuite/` (or similar, depending on the target platform) instead of `/opt/open-xchange/appsuite/`.
