---
title: Manifests
description: Manifest files in the app suite declare either apps or plugins.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:UI_manifests_explained
---

They tell the appsuite runtime which files to load when, so the code in it can take effect at the appropriate time. 
This document should be read by everyone that wants to either build a plugin or an app and contains a description of how to get app suite to run your code. 

# Declaring apps

The minimal declaration for an app looks like this:

```json
{
    "title": "My App",
    "path": "com.example/myapp/main"
}
```

It consists of a title for the app and the path to the main entry file, by convention always called _main.js_. This declaration is usually found in the file _manifest.json_ right next to the app in question, but could theoretically be located anywhere. If the file is located in the same directory as the main entry file and the file is, as is the convention, called _main.js_ you can leave out the path as it will be added automatically by the buildsystem, so the minimal definition then becomes:

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

The _namespace_ contains the name of a frontend module for which the plugin is relevant. 
Declaring a plugin like this has the effect, that the plugin is loaded before the file named as the namespace is loaded, so it can affect what the core file is doing, commonly by extending an extension point. 
The convention is to always put plugins into the file _register.js_, so again, the path can be omitted if the _manifest.json_ is placed alongside the _register.js_ containing the plugin. 
A plugin may be associated with more than one namespace, in that case, just use a list as the value for the namespace attribute:

```json
{
    "namespace": ["io.ox/contacts/view-detail", "io.ox/contacts/edit/view-form"]
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

Which capabilities are available can be checked by either reading through existing manifests or by running this in the javascript console once logged into appsuite:

```javascript
_(ox.serverConfig.capabilities).pluck('id')
```

# Device tests

If a plugin is designed only for specific devices, screen sizes or languages, then its loading can be disabling by specifying the criteria in a device attribute:

```js
{
    "namespace": "io.ox/contacts/view-detail",
    "requires": "calendar"
}
```

The full list of available device tests is documented in the [Device reference](http://oxpedia.org/wiki/index.php?title=AppSuite:Device_reference).

# Multiple declarations in one file

If you need more than declaration in a _manifest.json_ file, you can include them in a list:

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

During a build run the buildsystem picks up these manifest files and consolidates them into a single file _build/manifests/[myapp].json_. 
This file, either by creating a symlink to a locally run backend or by installing the app package on a remote backend, winds up in the manifests directory of the backend and is processed and sent to the frontend. 
You can see all manifest declarations, that have been sent by the backend by looking at

```javascript
ox.serverConfig.manifests
```

in the javascript console. 

# Special namespaces

__signin__

Plugins that choose "signin" as (or amongst) their namespace, are loaded when the login page is shown. 
The code can be used to rearrange parts of the signin page or add custom behaviour to it.

__core__

Core plugins are loaded as soon as the frontend starts up after successfully logging in or reauthenticating with the autologin. 
This is useful if you need to run code very early.
