---
title: FAQ
description: Frequently asked questions about running the App Suite UI
source: http://oxpedia.org/wiki/index.php?title=AppSuite:UI_FAQ
---

If you need a tool set for finding things out about the UI, see [Debugging the UI](TODO). Frequently asked by new developers. And forgetful veterans. Who therefore write documentation pieces like this.

# Does show the login screen after logging in

This means you managed to find a bug even before our error message module could be loaded. 
There is something rather basic broken, maybe the DB connection or some of the standard .js

The only hint we can give from a UI perspective is to use the developer console on your browser and, if applicable, turn on "halt on all errors" or "preserve logging data". 
You might see an error message that otherwise gets eaten by a redirect.

If you are running the backend yourself, you are in luck, go, look at the server error log.

# Does not load, fails with error: Could not read…

```javascript
"Could not read 'io.ox/core/http.js'" 
"Could not read 'io.ox/core/events.js'" 
```

That's not all, the system is probably hiding even more errors. 
It is more probable that the whole UI cannot be found. 
Check the com.openexchange.apps.path, usually hidden in `manifests.properties`.
Does it point to where your webserver serves the files from? The default is /_var/www/appsuite_, on OSX is is more likely to be _/Library/WebServer/Documents/appsuite_

# App Suite loads, but no apps show up

So bother backend and frontend are devoid of errors, the UI loads nicely, you see the top bar with settings, notifications and refresh button but no apps at all, right? 
This is a manifest problem. 
Check the capabilities (see hint in the beginning of this page). 
If even those are correct, check the backend's `/tmp` folder and the `manifest.properties` there: Are the paths of _com.openexchange.apps.path_ and _com.openexchange.apps.manifestPath_ pointing to your build directory?

# Could not read 'io.ox/office/preview/app/... when loading anything but the portal

You lack preview capabilities. 
Since you can choose what to use, here are your options

- use the URL parameter _disableFeature=document_preview%2Ctext_
- figure out how to install office
- use the existing preview bundles

# After logging in I'm dumped back to the login page with a #autologin=false added to the URL

You might not see an error message in the console then. 
Configure your JS console to preserve messages on navigation (so after a redirect), and you might get a hint as to what's wrong.

# UI build environment

There is an explicit [FAQ page](http://oxpedia.org/wiki/index.php?title=AppSuite:GruntFAQ) for grunt related questions when working with external modules.
