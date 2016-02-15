---
title: Simple application (iframe)
description: Writing a simple application with an embedded iframe and launcher link
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Writing_a_simple_application_with_embedded_iframe
---

# Provide an iframe for the content area (since 7.8)


Developing an app with an iframe for the content area is quite easy.
All it needs is a manifest file (manifest.json) and the app file (main.js).

Both should be located in an designated folder in the apps folder.
In this example the namespace 'com.example' will be used. (apps/com.example)

To make use of the provided helper function io.ox/core/tk/iframe has to be required in the define section.

```
define('com.example/main', [
    'io.ox/core/tk/iframe',
    'gettext!com.example'
], function (createIframeApp, gt) {

    'use strict';

    var iframeApp = createIframeApp({
        name: 'com.example', // the name of the app
        title: gt('Hallo, World!'), // the title of the app as used in the launcher
        pageTitle: gt('Hallo, World!'), // the page Title
        url: 'https://www.example.com/', // the domain which should be used for the iframe
        acquireToken: true // generates a login token and appends it to the supplied url as ox_token parameter
    });

    return {
        getApp: iframeApp.getApp
    };
});
define('com.example/main', [
    'io.ox/core/tk/iframe',
    'gettext!com.example'
], function (createIframeApp, gt) {

    'use strict';

    var iframeApp = createIframeApp({
        name: 'com.example', // the name of the app
        title: gt('Hallo, World!'), // the title of the app as used in the launcher
        pageTitle: gt('Hallo, World!'), // the page Title
        url: 'https://www.example.com/', // the domain which should be used for the iframe
        acquireToken: true // generates a login token and appends it to the supplied url as ox_token parameter
    });

    return {
        getApp: iframeApp.getApp
    };
});
```

The provided token can be used to generate a valid session with the [redeem token login process](http://oxpedia.org/wiki/index.php?title=HTTP_API#Redeem_Token_.28since_7.4.0.29).

# Add app to the launcher (since 7.8)

To display an app in the launcher, the property 'topbar': true has to be set in the manifest.json file of the app.
To define the order, use the index value in the manifest.json file.


```
{
    "title": "Hallo, World!",
    "company": "external",
    "icon": "/images/icon.png",
    "category": "Dev",
    "settings": false,
    "index": 10000,
    "topbar": true
}
```

# Reorder / remove apps from launcher (since 7.6)

To define a custom order of the apps or remove an app from the laucher the server-side setting topbar/order can be used to provide a comma-separated list of apps which should be available in the launcher.

_Example: io.ox/core//topbar/order=io.ox/mail,com.example,io.ox/contacts,io.ox/portal_

An app which is not listed here, is not available in the launcher anymore.
