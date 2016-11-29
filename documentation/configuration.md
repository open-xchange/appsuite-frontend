---
title: Configuration
icon: fa-cog
description: Server settings (property files), config cascade and how they affect the ui
---

There a plenty of available *[serverside-configuration possibilities](https://documentation.open-xchange.com/latest/middleware/configuration/properties.html)* that partly affects ui in different ways.

# General Config

```
/opt/open-xchange/etc/as-config.yml
/opt/open-xchange/etc/as-config-defaults.yml
```

These values are available as part of ``ox`` object in the global namespace of the brower (ox.serverConfig).

> Please note that only some special ones of the available settings are listed here.

| Path | Values | Description |
|----------------------------------------|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **forgotPassword** | _undefined, false, STRING_ | Enables and configures the 'Lost Password' link on the App Suite login page. If 'forgotPassword' is falsy, you don't see the link. Otherwise the UI treats forgotPassword as a URL. |


# Config Cascade and it's property files

```
/opt/open-xchange/etc/meta/[FOOBAR].properties
```

**example**

```
// middleware property file: specify default value
io.ox/core//some/setting=true

// ui settings module: reads default value and sets custom value for this user
require(['settings!io.ox/core'],
    function(coreSettings) {
        coreSettings.get('some/setting');
        coreSettings.set('some/setting', 'custom').save();
    }
);
```
