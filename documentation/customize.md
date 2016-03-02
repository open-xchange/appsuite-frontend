---
title: Customize
icon: fa-plug
description: Getting ready to develop your own plugins / apps
---

There are two ways that your code can interact with the appsuite.
First of all there are **apps** that are described briefly [here](/ui/customize/app/first-app.html).

The second way is using **extension points and extensions**.
Stated briefly an extension point is an invitation to contributing an implementation to a part of the UI.

# Prerequisites

Create a new directory in which you will develop your plugin(s) / app(s). 
Let us call it myplugin for now. 
Depending on where you want to keep your projects, do something like this:

```bash
cd ~/projects/appsuite
mkdir myplugin
cd myplugin
mkdir apps
/path/to/appsuite/frontend/web/ui/bin/build-appsuite init-packaging package=myplugin
```

And answer the questions.

Bonus points for putting the build-appsuite program into your PATH (see buildsystem for how to do that).
We'll assume from now on, that it is in the PATH. Now you will have to decide on a namespace for your code.
Let us for now choose **com.example**.
In your plugins directory ("myplugin") under apps create a directory:

```bash
 cd apps
   mkdir com.example
   touch com.example/main.js
```

In order to use short commands, add the binary path to the environment variable containing all paths from which binaries should be executed directly:

```bash
   export PATH=$PATH:/path/to/appsuite/frontend/web/ui/bin
```

and run the buildscript once:

```bash
   cd ..
   build-appsuite app
```

For the rest of this exercise follow the steps outlined here.
Don't worry about the `manifest.json` if you do not have a locally running backend, just skip those steps.
You can manually launch the app within your browser by typing in the javascript console:

```javascript
ox.launch("com.example/main")
```
