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

Backend packages for themes and any apps which ship .less files require the following changes:

1. Add "skipLess=1" to the build command in \*.spec and in debian/rules:

   ```bash
     sh /opt/open-xchange-appsuite-dev/bin/build-appsuite app skipLess=1
   ```

2. Add %post and %postun sections to \*.spec:

```bash
  %post
  if [ "$1" = 1 ]; then
  UPDATE=/opt/open-xchange/appsuite/share/update-themes.sh
  [ -x $UPDATE ] && $UPDATE
  fi
  %postun
  UPDATE=/opt/open-xchange/appsuite/share/update-themes.sh
  [ -x $UPDATE ] && $UPDATE
```

For multiple binary packages, the %post and %postun sections should apply only to backend packages which contain .less files.

3. Add debian/postinst and debian/postrm containing the same content:

   \#!/bin/sh
   UPDATE=/opt/open-xchange/appsuite/share/update-themes.sh
   [ -x $UPDATE ] && $UPDATE

For multiple binary packages, the postinst and postrm files should apply only to backend packages which contain .less files.

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

