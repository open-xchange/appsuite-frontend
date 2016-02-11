---
title: Dynamic Theming
description: The dynamic theme plugin allows to have custom colors and logo without creating a real theme for each possible color combination.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Dynamic_Theme
---

The customization information is stored in the [Configuration Cascade](TODO) and applied at runtime, immediately after login.

# Installation

The theme generator consists of the single package open-xchange-dynamic-theme, which is installed on the OX middleware.

# Configuration

## Enabling the Plugin

The plugin is enabled or disabled by the capability _dynamic-theme_, e.g. in a file ``/opt/open-xchange/etc/dynamic-theme.properties`` set

```
com.openexchange.capability.dynamic-theme=true
```

When using the plugin, the actual theme should be the built-in default theme.
To prevent all users from changing it and hide the theme selector in the preferences, set the property __io.ox/core//theme__ to read-only. 
To do this, change the file ``/opt/open-xchange/etc/meta/appsuite.yaml`` as follows:

```yaml
io.ox/core//theme:
    protected: true
```

If some users won't use dynamic themes, this approach won't work. Instead, the theme selector can be disabled an enabled by controlling the list of available themes. The theme selector is hidden if the list is empty. 
To be able to do that with the Configuration Cascade, the entire list of themes needs to be specified as a single JSON value, e.g. by changing the file ``/opt/open-xchange/etc/settings/appsuite.properties`` as follows:


```bash
io.ox/core/settingOptions//themes={"default":"Default Theme"}
```

Then, to hide the theme selector for users with a dynamic theme, use the Configuration Cascade to change the value to {}.

# Specifying a Theme

The package installs the file ``/opt/open-xchange/etc/settings/open-xchange-dynamic-theme.properties``, which contains the global defaults for the custom theme settings. Any of the settings contained in that file can be changed per-context or at any other granularity supported by the Configuration Cascade. The individual settings are as follows:

```
# default: #333
io.ox/dynamic-theme//frameColor

# default: #bbb
io.ox/dynamic-theme//iconColor

# default: #39a9e1
io.ox/dynamic-theme//selectionColor

# default: 60
io.ox/dynamic-theme//logoWidth

# default: apps/themes/default/logo-small.png
io.ox/dynamic-theme//logoURL
```

The colors can be any CSS color; logoWidth is specified in pixels; logoURL can be relative (to /appsuite/), or absolute. 
When using absolute URLs to point to different hosts, use the form //hostname/path to keep the protocol (HTTP or HTTPS) and avoid any unnecessary security warnings.

# Maintenance

The source file ``apps/io.ox/dynamic-theme/definitions.less`` contains the Less rules for the theme. All keys in the namespace _io.ox/dynamic-theme//_ are converted to Less variables by prefixing them with _@io-ox-dynamic-theme-_. 
The set of keys in the following files must be kept in sync:

- apps/io.ox/dynamic-themes/definitions.less.in
- apps/io.ox/dynamic-theme/settings/defaults.js
- lib/update-dynamic-theme.js
- conf/settings/open-xchange-dynamic-theme.properties
