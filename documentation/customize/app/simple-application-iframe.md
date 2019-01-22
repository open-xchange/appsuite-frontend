---
title: Simple application (iframe)
---

# Provide an iframe for the content area (since 7.8)

Developing an app with an iframe for the content area is quite easy.
All it needs is a manifest file (manifest.json) and the app file (main.js).

Both should be located in an designated folder in the apps folder.
In this example the namespace 'com.example' will be used. (apps/com.example)

To make use of the provided helper function io.ox/core/tk/iframe has to be required in the define section.

```JavaScript
define('com.example/main', [
    'io.ox/core/tk/iframe',
    'gettext!com.example'
], function (createIframeApp, gt) {

    'use strict';

    var iframeApp = createIframeApp({
        id: 'com.example', // the id of the app, needed to add to launcher
        name: 'com.example', // the name of the app
        title: gt('Hallo, World!'), // the title of the app as used in the launcher
        settings: false, // this app has no settings
        pageTitle: gt('Hallo, World!'), // the page Title
        url: 'https://www.example.com/', // the domain which should be used for the iframe
        acquireToken: true // generates a login token and appends it to the supplied url as ox_token parameter
    });

    return {
        getApp: iframeApp.getApp
    };
});
```

The provided token can be used to generate a valid session with the [redeem token login process](/components/middleware/http{{ site.baseurl }}/index.html#!/Login/redeemToken).

# Manifest file

To load the UI plugin, a manifest file is needed.
In our case, it looks like this:

```JSON
{
    "namespace": "core",
    "path": "com.example/main"
}
```

# Add App to launcher

In order for the app to show up in the launcher, it needs to be configured on the middleware.
The `id` provided to create the iframe app (see example code, above) is used to register the app to the launcher.

```properties
io.ox/core//apps/list = "io.ox/mail,com.example,io.ox/contacts"
```

# Example repository

This example has been published [here](https://gitlab.open-xchange.com/frontend/examples/iframe).
