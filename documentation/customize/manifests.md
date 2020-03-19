---
title: Manifests
description: Manifest files in the OX App Suite declare either apps or plugins.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:UI_manifests_explained
---

They tell the OX App Suite runtime which files to load when, so the code in it can take effect at the appropriate time.
This document should be read by everyone that wants to either build a plugin or an app and contains a description of how to get OX App Suite to run your code.

# Declaring apps

The minimal declaration for an app looks like this:

```json
{
    "title": "My App",
    "path": "com.example/myapp/main"
}
```

It consists of a title for the app and the _path_ to the main entry file, by convention always called `main.js`.
This declaration is usually found in the file `manifest.json` right next to the app in question, but could theoretically be located anywhere.
If the file is located in the same directory as the main entry file and the file is, as is the convention, called _main.js_ you can leave out the path as it will be added automatically by the buildsystem, so the minimal definition then becomes:

```json
{
    "title": "My App"
}
```

# Declaring a plugin

In turn, this is the definition of a plugin file:

```json
{
    "namespace": "io.ox/contacts/view-detail",
    "path": "com.example/myapp/contacts/register"
}
```


The convention is to always put plugins into the file `register.js` so again, the path can be omitted if the `manifest.json` is placed alongside the register.js` containing the plugin.

**Important**

The _namespace_ contains the name of a frontend module for which the plugin is relevant. Declaring a plugin like this has the effect, that the _plugin is loaded before_ the file named as the namespace is loaded, so it can affect what the core file is doing, commonly by extending an extension point.

A plugin may be associated with more than one namespace, in that case, just use a list as the value for the namespace attribute:

```json
{
    "namespace": [
        "io.ox/contacts/view-detail",
        "io.ox/contacts/edit/view-form"
    ]
}
```

Whichever module is loaded first will trigger the plugin to be loaded.

# Capabilities

Sometimes a plugin or an app is only available if either the backend has a certain bundle installed or the user must have a certain permission.
Both permissions and backend capabilities are rolled into the concept of a "capability".
If your plugin, for example, is only relevant when the user has access to the calendar module, you can add a _requires_ attribute to the declaration:

```json
{
    "namespace": "io.ox/contacts/view-detail",
    "requires": "calendar"
}
```

In case you have to consider more than one capability use the same logial operators like you would do when calling `capabilies.has` directly:

```js
    # logical conjunction
    "requires": "calendar && tasks"
    # logical disjunction
    "requires": "calendar || tasks"
```

Which capabilities are available can be checked by either reading through existing manifests or by running this in the javascript console once logged into OX App Suite:

```javascript
_(ox.serverConfig.capabilities).pluck('id')
```

# Device tests

If a plugin is designed only for specific devices, screen sizes or languages, then its loading can be disabling by specifying the criteria in a device attribute:

```js
{
    "namespace": "io.ox/contacts/view-detail",
    "requires": "!smartphone"
}
```

In case you have to consider more than one aspect use the same logial operators like you would do when calling  `_.device` directly:

```js
{
    "namespace": "io.ox/contacts/view-detail",
    "requires": "en_US || en_GB"
}
```

For a full list of available device tests please see `ui/src/browser.js`.

# Multiple declarations in one file

If you need more than declaration in a `manifest.json` file, you can include them in a list:

```json
[
    {
        "namespace": "io.ox/contacts/view-detail",
        "path": "com.example/myapp/contacts/viewPlugin"
    },
    {
        "namespace": "io.ox/contacts/view-form",
        "path": "com.example/myapp/contacts/formPlugin"
    }
]
```

# What happens to these files?

During a build run the buildsystem picks up these manifest files and consolidates them into a single file `build/manifests/[myapp].json`.
This file, either by creating a symlink to a locally run backend or by installing the app package on a remote backend, winds up in the manifests directory of the backend and is processed and sent to the frontend.
You can see all manifest declarations, that have been sent by the backend by looking at

```javascript
ox.serverConfig.manifests
```

in the javascript console.

# Special namespaces

**signin**

Plugins that choose "signin" as (or amongst) their namespace, are loaded when the login page is shown.
The code can be used to rearrange parts of the signin page or add custom behaviour to it.

**core**

Core plugins are loaded as soon as the frontend starts up after successfully logging in or reauthenticating with the autologin.
This is useful if you need to run code very early.
