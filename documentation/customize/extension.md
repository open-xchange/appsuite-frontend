---
title: Detailview plugin (contacts)
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Writing_a_contacts_plugin
---

# Where and how to start

Plugins are collected in the folder ui/apps/plugins. Start your new plugin there: Create a folder and in this folder, create two files: register.js (where everything happens) and manifest.json

# What are you going to do

Your plugin code can interact with the app suite is by way of extension points and extensions. 
Stated briefly an extension point is an invitation to contributing an implementation to a part of the UI. 
For example the contact detail view consists of an extension point that receives contributions in the form of renderers, that render different parts of the contact. 
Say, one for rendering the display name, one for the mail addresses, one for the postal addresses and so on. 
All these, in turn then, make up the contacts detail view. 
It is easy for plugins to affect this set of extensions. 
A plugin can contribute its own extension to an extension point, thereby rendering a different part of a contact or contributing a new button to work on a contact. 
A plugin can also disable existing extensions, thereby removing parts of the UI.

# Hands-On

## Register

As an example, let's add a new renderer to the contact detail view. Let's create a new file myplugin/apps/com.example/contacts/register.js:


```javascript
define('com.example/contacts/register', ['io.ox/core/extensions'], function (ext) {
    'use strict';

    ext.point('io.ox/contacts/detail').extend({
        id: 'com-example-contact-reversename',
        after: 'contact-details',
        draw: function (baton) {

            var name = baton.data.display_name;
            var rev = name.split("").reverse().join("");

            this.append(
                $("<h1>").text(rev)
            );
        }
    });
});
```


## Manifest

Next we have to make sure our code is actually loaded by the UI at the right moment. 
The right moment in our case is right before it loads the file ``apps/io.ox/contacts/view-detail``, where the extension point is processed. 
For this, we need another manifest file at ``myplugin/apps/com.example/contacts/manifest.json``:


```js
    {
        "namespace": "io.ox/contacts/view-detail"
    }
```

After writing your code, always build your javascript code to make apply. 
See the development cycle to keep easy steps in mind you need while developing.

## Running a local backend?

If using a local backend, restart it to pick up on the changed manifest, or, for a remote backend, edit myplugin/src/manifests.js again so it reads:


```javascript
define(function () {
    return [
        {
            "path": "com.example/main",
            "title": 'Hello World App'
        },
        {
            "path": "com.example/contacts/register",
            "namespace": "io.ox/contacts/view-detail"
        }
    ];
});
```

Reload the UI and navigate to a contact. It should contain the new section with the display name in reverse.

## Extension Points

Trouble finding the right extension point? Learn more about Extension points regarding these articles.

## Stuck somewhere?

You got stuck with a problem while developing? OXpedia might help you out with the article about debugging the UI.
