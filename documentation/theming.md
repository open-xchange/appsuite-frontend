---
title: Theming
icon: fa-paint-brush
description: Learn how to create customized themes and use them to change the look of you appsuite installation
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Theming
---

# LESS.JS

Appsuite used LESS as dynamic stylesheet language. LESS extends CSS with dynamic behavior such as variables, mixins, operations and functions.

Please read [LESS.JS](http://lesscss.org/#docs) documentation first.

## Using less.js

If your theme depends on less.js, you will need one more step to make it work.
Why? To accelerate the login, compilation of LessCSS files was moved from the login process in the browser to the installation process on the backend.

Backend packages for themes and any apps which ship .less files require the following changes:

1. Add "skipLess=1" to the build command in *.spec and in debian/rules:
```bash
  sh /opt/open-xchange-appsuite-dev/bin/build-appsuite app skipLess=1
```

2. Add %post and %postun sections to *.spec:

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

  #!/bin/sh
  UPDATE=/opt/open-xchange/appsuite/share/update-themes.sh
  [ -x $UPDATE ] && $UPDATE


For multiple binary packages, the postinst and postrm files should apply only to backend packages which contain .less files.

Note: Since 7.2.1, LessCSS files must have the file extension .less to be usable with the 'less' RequireJS plugin (module dependencies of the form 'less!filename.less'). Previously we were more lenient and dealt with .css, too.

# File structure

A theme basically consists of two files located in ``/opt/open-xchange/appsuite/apps/themes/THEME_ID/``. These files are described in this and the following sections.

_THEME_ID_ is a unique identifier for your theme, which is not visible to users. By convention, it is best derived from a domain name you control, e.g. com.example.prettytheme.

## definitions.less

This file can be used to override variables described in the "Variables" section of this article.

## style.less

This file can be used to define any CSS you like. Before doing this, check, if there really is no variable that can be used to achieve the same thing.

## Referencing paths

Since 7.2.1, all URLs are relative to the source .less file in which they are contained. This means that unless a theme changes an image it does not need to include that image anymore.

Old themes must be updated if they change an image from the default theme: All styles from the default theme which refer to a changed image must be overwritten in the custom theme. This way the URLs resolve to the new image.

# Variables

Naming of the variables should be straight forward. Variables containing the word Background will always refer to the background color. Variables containing Color will refer to the foreground color of an element, like color of a font. Hover in most cases means "hovered" elements. Selected relates to the currently selected item. Elements that are supposed to catch the users eye can use the _Highlight_ class and the variable contains this word.

Variables are defined in variables.less from twitter-bootstrap and our default definitions.less. Variables that are defined in definitions.less always override variables from bootstrap's variables.less

## Most relevant variables

| Variable | Default |
|------------------------------------|---------------------------|
| @topbar-background | #3774A8 (blue) |
| @topbar-launcher-color | rgba(255, 255, 255, 0.70) |
| @topbar-launcher-color-hover | #fff |
| @topbar-launcher-color-active | #fff |
| @topbar-launcher-background-hover | rgba(0, 0, 0, 0.30) |
| @topbar-launcher-background-active | rgba(0, 0, 0, 0.20); |
| @topbar-icon-color | #fff |
| @selected-background | #428BCA (blue) |
| @contact-picture-radius | 50% |

The most significant visual change is achieved by changing the following variables:

- __@topbar-background__ (top navigation bar)
- __@selected-background__ (selection background color in list views and folder tree)
- __@link-color__ (almost all hyperlinks)

## Font

| Variable | Default |
|-------------------------|---------------------------------------------------|
| @font-family-sans-serif | "Helvetica Neue", Helvetica, Arial, sans-serif |
| @font-family-serif | Georgia, "Times New Roman", Times, serif |
| @font-family-monospace | Monaco, Menlo, Consolas, "Courier New", monospace |
| @font-size-base | 14px |
| @line-height-base | 1.428571429; // 20/14 |
| @font-size-touch | 15px |
| @headings-font-family | inherit |
| @headings-font-weight | 500 |
| @font-size-large | ceil((@font-size-base * 1.25)); // ~18px |
| @font-size-small | ceil((@font-size-base * 0.85)); // ~12px |
| @vgrid-font-size | 13px |

## Colors

| Variable | Default |
|--------------------|--------------------------|
| @background | #fff |
| @text-color | @gray-dark |
| @link-color | @brand-primary |
| @link-hover-color | darken(@link-color, 15%) |
| @link-accent-color | #ffad00 |
| @badge-color | @white |
| @badge-bg | #aaa |
| @headings-color | inherit |
| @black | #000 |
| @gray-darker | #222 |
| @gray-dark | #333 |
| @gray | #555 |
| @gray-light | #999 |
| @gray-lighter | #eee |
| @white | #fff |
| @blue | darken(#049cdb, 5%) |
| @blue-dark | #0064cd |
| @blue-light | lighten(#049cdb, 25%) |
| @green | #1A8D1A |
| @green-light | #92D050 |
| @red | #cc0000 |
| @yellow | #F8E400 |
| @orange | #f89406 |
| @pink | #E01CD9 |
| @purple | #7E16CF |

# Space

| Variable | Default |
|-----------------------|----------------|
| @border-radius-base | 4px |
| @border-radius-large | 6px |
| @border-radius-small | 3px |

# Pagination

| Variable | Default |
|-----------------------|----------------|
| @pagination-bg | #fff |
| @pagination-border | #ddd |
| @pagination-active-bg | @brand-primary |

# Buttons

| Variable | Default |
|-----------------|-----------------------|
| @btn-primary-bg | @link-color |
| @btn-info-bg | #5bc0de |
| @btn-success-bg | #62c462 |
| @btn-warning-bg | lighten(@orange, 15%) |
| @btn-danger-bg | #ee5f5b |
| @btn-inverse-bg | #444 |

# Dropdowns

| Variable | Default |
|-----------------------------|-------------------------|
| @dropdown-bg | #fff |
| @dropdown-border | rgba(0,0,0,.15) |
| @dropdown-divider-bg | #e5e5e5 |
| @dropdown-divider-bg | #e5e5e5 |
| @dropdown-link-color | @gray-dark |
| @dropdown-link-hover-color | darken(@gray-dark, 5%) |
| @dropdown-link-active-color | @component-active-color |
| @dropdown-link-active-bg | @component-active-bg |
| @dropdown-link-hover-bg | #f5f5f5 |

# Foldertree

| Variable | Default | Description |
|---------------------------------|---------------------|---------------------------------------------------------------|
| @foldertree-sidepane-background | #f5f5f5 |  |
| @foldertee-section-title-color | #888 | Color for sectiontitles in foldertree (like "Public" folders) |
| @foldertree-active-label-color | #333 | Active means, user can perform an action on this item |
| @foldertree-passive-label-color | @hc-gray | Passive means, user can not perform any action with this item |
| @foldertree-hover-background | rgba(0, 0, 0, 0.05) |  |
| @foldertree-selected-background | rgba(0, 0, 0, 0.10) |  |
| @foldertree-badge-background | @bagde-bg | see #Colors for definition of @badge-bg |
| @foldertree-badge-color | @badge-color | see #Colors for definition of @badge-color |

# Calendar

| Variable | Default | Description |
|--------------------------------|----------------------|-----------------------------------------------------------------|
| @appointment-reserved | #08c /* blue */ | Appointment status color |
| @appointment-temporary | #ffbb00 /* yellow */ | Appointment status color |
| @appointment-absent | #913f3f /* red */ | Appointment status color |
| @appointment-free | #8eb360 /* green */ | Appointment status color |
| @appointment-private | #555 /* gray */ | Appointment status color |
| @appointment-declined-font | #888 /* dark gray */ | Font color for declined Appointments |
| @appointment-unconfirmed-alpha | 0.4 | Transparency value for unconfirmed Appointments |
| @appointment-declined-alpha | 0.3 | Transparency value for declined Appointments |
| @appointment-hover-pct | 15% | Percentage increase of the dark pigment content on hover effect |

## Week view

| Variable | Default | Description |
|--------------------------------|----------------------|-----------------------------------------------------------------|
| @appointment-reserved | #08c /* blue */ | Appointment status color |
| @appointment-temporary | #ffbb00 /* yellow */ | Appointment status color |
| @appointment-absent | #913f3f /* red */ | Appointment status color |
| @appointment-free | #8eb360 /* green */ | Appointment status color |
| @appointment-private | #555 /* gray */ | Appointment status color |
| @appointment-declined-font | #888 /* dark gray */ | Font color for declined Appointments |
| @appointment-unconfirmed-alpha | 0.4 | Transparency value for unconfirmed Appointments |
| @appointment-declined-alpha | 0.3 | Transparency value for declined Appointments |
| @appointment-hover-pct | 15% | Percentage increase of the dark pigment content on hover effect |

## Month view

| Variable | Default | Description |
|----------------------------|--------------------------|-----------------------------------------------|
| @monthview-appointment-out | #aaa /* light gray */ | Color of appointments, which are not in focus |
| @monthview-today | #daefff /* light blue */ | Background color of the current day |

