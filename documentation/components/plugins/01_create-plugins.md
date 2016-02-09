---
title: Your first plugin
description: Get you started to develop your own plugins and apps for OX app suite
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Getting_started_developing_the_UI
---

# Getting started

Hello and welcome to OX app suite development. 
This document will get you started to develop your own plugins and apps for OX app suite. 
We will look at the steps necessary but will also tempt you to learn more by linking you to some more in-depth documentation about these topics. 
Depending on how you wound up reading this page, you will probably have already completed some of the steps below.

# Prerequisites

Before we begin, here are a few things that you need to have set up before going on - an OX Backend. 
We will not cover how to set up one of these. 
Either have it running locally on your development machine, if you are also developing backend functionality, or install an OX server on another machine as a normal set up. 
Either one is fine. - To follow this guide, on your development machine you will need git, node (0.4 or later), an apache web server and a text editor, for the actual development.

# Check out the source

Firstly you will need to check out our source code. 
This also includes the most up to date version of this documentation. The source code for the frontend is hosted at [code.open-xchange.com/wd/frontend/web](code.open-xchange.com/wd/frontend/web). 
Since we're living on the edge here, we will use the branch where the actual development is going on, called _develop_. 
Depending on your needs and taste, the stable master branch might also be a good choice. 
In a shell navigate to where you want to work on the app suite and type:


```bash
git clone -b develop https://code.open-xchange.com/git/wd/frontend/web
```

and wait for the checkout to complete. 
This will create the directory web with the source code of the frontend in it. Building the ui and documentation

# Build
Please refer to the build process article [here](/ui/build-process/076_appserve.html)

# Develop

Getting ready to develop your own plugins / apps

Next, create a new directory in which you will develop your plugin(s) / app(s). 
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
Let us for now choose com.example. In your plugins directory ("myplugin") under apps create a directory:


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
Don't worry about the ``manifest.json`` if you do not have a locally running backend, just skip those steps. 
You can manually launch the app within your browser by typing in the javascript console:


```javascript
ox.launch("com.example/main")
```


# Apps, plugins and manifests

In order for an app to show up in the launcher grid, it has to be declared in a manifest file, so the UI can find out about the app. As in the example in the buildsystem documentation, create a file ``myplugin/apps/com.example/manifest.json``

```json
{
    title: 'Hello World App'
}
```

The buildsystem will automatically add the path to the main.js file to this entry, so when compiled it winds up looking like this:

```json
    {
        path: "com.example/main",
        title: 'Hello World App'
    }
```

If you are using a local backend you can use the trick described in the buildsystem documentation to have the app show up. 
You will have to restart your backend every time the manifests change, though.
If, on the other hand you are working with a remote backend, you can inject your own manifest definitions this way: 

Create the file ``myplugin/src/manifests.js` in your app:


```javascript
define(function () {
    return [
        {
            path: "com.example/main",
            title: 'Hello World App'
        }
    ];
});
```

In case you're rebuilding the base ui you might have to repeat the above step.
To activate the extra manifests in ``src/manifests.js``, reload the UI with the "customManifests" switch in the url set to true. 
So for example: _/appsuite/#!&customManifests=true__ and when you click the app grid icon (left most icon on the top), your custom app will be listed as well.

The second way – apart from your own apps – your plugin code can interact with the app suite is by way of extension points and extensions. 
Stated briefly an extension point is an invitation to contributing an implementation to a part of the UI. 
For example the contact detail view consists of an extension point that receives contributions in the form of renderers, that render different parts of the contact. 
Say, one for rendering the display name, one for the mail addresses, one for the postal addresses and so on. 
All these, in turn then, make up the contacts detail view. 
It is easy for plugins to affect this set of extensions. 
A plugin can contribute its own extension to an extension point, thereby rendering a different part of a contact or contributing a new button to work on a contact. 
A plugin can also disable existing extensions, thereby removing parts of the UI.

As an example, let's add a new renderer to the contact detail view. 
Let's create a new file myplugin/apps/com.example/contacts/register.js:


```javascript
    define('com.example/contacts/register', ['io.ox/core/extensions'], function (ext) {
        'use strict';

        ext.point('io.ox/contacts/detail').extend({
            id: 'com-example-contact-reversename',
            after: 'contact-details',
            draw: function (baton) {

                var name = baton.data.display_name;
                var rev = name.split('').reverse().join('');

                this.append(
                    $("<h1>").text(rev)
                );
            }
        });
    });
```

How can you find out which extension points exist and what you have to implement to extend them? 
App Suite contains an ever increasing set of examples in the lessons app, that you can open by typing the follwing in the console:


```javascript
ox.launch("io.ox/lessons/main")
```

If you do not find a suitable example here, your next best bet is to inspect the DOM structure. 
It may contain hints as to the extension points and extensions used. 
You might then still have to look up its current use in the frontend source code. 
Failing that, look for other identifying marks in the DOM structure, like a certain css class being set and just search for that in the frontend code base. 
Of course you can always just as us. 
This documentation is a work in progress, so for now, these are your best choices.

Next we have to make sure our code is actually loaded by the UI at the right moment. 
The right moment in our case is right before it loads the file ``apps/io.ox/contacts/view-detail``, where the extension point is processed. For this, we need another manifest file at ``myplugin/apps/com.example/contacts/manifest.json``:


```json
{
    namespace: "io.ox/contacts/view-detail"
}
```

the namespace denoting when a plugin should be loaded. 
Rebuild your plugin by issuing the


```javascript
build-appsuite app
```
   
command in the root directory of your plugin, and if using a local backend, restart it to pick up on the changed manifest, or, for a remote backend, edit ``myplugin/src/manifests.js`` again so it reads:


```javascript
    define(function () {
        return [
            {
                path: "com.example/main",
                title: 'Hello World App'
            },
            {
                path: "com.example/contacts/register",
                namespace: "io.ox/contacts/view-detail"
            }
        ];
    });
```

reload the UI and navigate to a contact. 
It should contain the new section with the display name in reverse.

# Further reading

Every article in this documentation is certainly worth your time, in particular, though, have a look at:

Buildsystem
Manifests
Also, for (interactive) examples, have a look at the lessons app by logging into app suite and typing:

```javascript
ox.launch("io.ox/lessons/main")
```

in the Javascript console.
