---
title: Configuration
icon: fa-cog
---

# Configuring OX App Suite UI

## Introduction

All UI settings are delivered via API from the Middleware. The Middleware parses all settings from property files and builds up a JSON structure which is delivered to the Client via the JSLlob interface.

All property files located in the `/opt/open-xchange/etc/settings/` directory will be parsed automatically on server start. You can create as many files as you want to change UI settings. A default file `appsuite.properties` is located there by default and is a good start for your custom settings.

## UI settings and injected Middleware settings

There are two different kind of settings appearing in the JSlobs for UI. The first type are classic UI settings which are configured via property file and a corresponding yaml file (more about this later). This is the main use case this article will deal with.

The other type of settings are "injected settings". These will be injected to the settings by the Middleware during runtime and might depend on other Middleware settings or the presence of a related package. For example a feature toggle which turns on functionality on server and client side like teaser texts in mail lists. These injected settings can of course not be overwritten via UI property as the setting is controlled by MW in this case. For those settings, the Middleware just advertises the existence of a feature by injecting a property to the JSlob. Those injected settings are always protected an can neither be changed by the user nor UI code. Those settings/features will not be listed in the [settings list](./configuration/settings-list-of.html). Take a look at the [Middleware Configuration Properties](https://documentation.open-xchange.com/latest/middleware/configuration/properties.html) instead.


## Property- and Yaml-files

Property files hold simple key/value pairs for each setting. You will not find a file containing all the defaults. Most of the defaults are located and documented in the UI code itself. Look for the desired UI setting you want to change in the [settings list](./configuration/settings-list-of.html). The list contains all relevant settings which are safe to configure in most cases.

To change a setting, the setting's full name (namespace + setting name) needs to be added to a property file in the `/opt/open-xchange/etc/settings/` directory.<br>
**As soon as you change the default by adding this string to a property file the setting will be set as protected by the Middleware**.

Protected settings **can not be edited by the end user in the UI or the UI code**. They are read-only. To unprotect the setting you will need to add the setting's name to a Yaml file and configure the "meta information" for this settings there, most often by simply adding `protected:false` or `protected:true`. The UI related yaml files are located in the `/opt/open-xchange/etc/meta/` directory.

**Summary**:

 * Every UI config is done on Middleware side via property files
 * Yaml files on MW side control if a certain setting can be edited in the UI
 * Changing a setting's default value in a property file alone marks this settings as protected by default
 * To change a user setting's default and let the user edit this setting later, the config needs to be set in the property file **and** needs to be marked as `protected:false` in the corresponding Yaml file
 * Property files go to `/opt/open-xchange/etc/settings/` and Yaml files to `/opt/open-xchange/etc/meta/`


## Example #1

In this example we will change the default for `io.ox/mail//forwardMessageAs`. This setting
controls if a forwarded message will be attached to the mail or is just quoted inline. We just
want to change the default to "Attachment" and let the user decide to change this later in his personal settings.

Step 1: Add the following to `/opt/open-xchange/etc/settings/appsuite.properties`

```
# Change default for forward from "Inline" to "Attachment"
io.ox/mail//forwardMessageAs=Attachment
```
Step 2: Add the following to `/opt/open-xchange/etc/meta/appsuite.yaml`

```
# Disable protection for "forwardMessageAs" in user settings
io.ox/mail//forwardMessageAs:
    protected: false
```

This ensures the config option is now (again) writeable by the user and the setting will show up in the UI.

## Example #2

In this example we will change and protect a setting so the user can not change it in
his personal settings. We will protect `io.ox./core//autoStart`. This setting controls
which App to start after login per default.

Step 1: Add the following to `/opt/open-xchange/etc/settings/appsuite.properties`

```
# Change default to Portal app (io.ox/portal)
io.ox/core//autoStart=io.ox/portal
```
Step 2: Optional, add the following to `/opt/open-xchange/etc/meta/appsuite.yaml`

```
# Setting is already protected but we set it explicitly to document this change for the admin
io.ox/core//autoStart:
    protected: true
```
Now the default App after login is the Portal. Also the user setting is hidden in the
settings pane, the user can not change this anymore.

## Further reading

 * Related Middleware article [Configuration Properties](https://documentation.open-xchange.com/components/middleware/config/7.10.3/)
 * We highly recommend to read the Config Cascade article. You will learn how to use cascading configs and how to provide config changes user-, context- and system-wide [Config Cascade on OXPedia] (https://oxpedia.org/wiki/index.php?title=ConfigCascade)

