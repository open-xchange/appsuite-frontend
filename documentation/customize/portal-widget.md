---
title: Portal Widget
description: How to write a plugin that shows on the portal page
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Writing_a_portal_plugin
---

This articles covers how to write a plugin that shows on the portal page. 
A portal plugin always gives a short overview on a piece of information (the so-called 'tile'). 
It can link a longer view that is opened when the tile is clicked, this we call the side pop-up. The side pop-up is optional.

# Where and how to start

Plugins are collected in the folder ``ui/apps/plugins``. 
Start your new plugin there: Create the following folder ``folder ui/apps/plugins/portal/myAd`` and in this folder, create two files: ``register.js`` (where everything happens) and ``manifest.json``

# An advertisement widget

The simplest portal plugin comes without a side pop-up and shows static content on its tile. 
Two uses for this would be presenting an advertisement (or your daily creed, an often used check list....) or showing a link list (for example to other parts of an company's intranet that are not integrated into the AppSuite (yet)). 
We will now build an advertisement, which is just a slogan.

The beauty of this is that we do not have any dependencies (for example needing another module like the file store), so the content of our ``manifest.json`` is rather simple:

 ```json
{
    "namespace": "portal"
}
 ```
 
Nothing to see here. We say we belong in the portal namespace and that's it. We do not need to define any dependencies on other modules.

Our register.js is only slightly longer:


```javascript
define('plugins/portal/myAd/register', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    ext.point('io.ox/portal/widget').extend({
        id: 'myAd'
    });

    ext.point('io.ox/portal/widget/myAd').extend({
        preview: function () {
            var content = $('<div class="content">')
                .text("Buy stuff. It's like solid happiness.");
            this.append(content);
        }
    });

    ext.point('io.ox/portal/widget/myAd/settings').extend({
        title: 'My advertisement',
        type: 'myAd'
    });
});
```

Please keep in mind, that the first parameter of define()-method refers to your app's path. 
According to the code above ``plugins/portal/myAd/`` should contain the upper displayed ``register.js``.

So what do we have here? We have two extension points:

The first one is for the ad itself, _io.ox/portal/widget/myAd_. This one contains a single method that we implement, preview.
 _Preview_ is responsible for the tile you see whenever you look at your portal. Technically, _this_ contains the container to which you can attach your content. 
 If you are brave, you can do changes on the container, too. 
But that is not needed for now.

The second is less obvious: It creates an option in the settings area for the portal (the one you reach by "customize this page"). 
There you will have to enable your setting (yes, this is a very polite advertisement). 
The title is what is shown as the name of your plugin (so chose a readable one), the type references the one you used in the definition. 
__Attention__: the type attribute has to be identical to the module name in the extension point. 
In this case "io.ox/portal/widget/myAd/settings" has the module name myAd and the referenced type is identical: myAd. 
Also make sure, the type doesn’t contain any "/" or "-" characters. 
You are save if you limit the characters used to numbers, alphabetical characters and "_".

# A more typical portal plugin

A typical portal plugin uses the tile to display a short summary or teaser of its contents and uses a side-popup to show the whole content.

The manifest.json can stay the same, but the register.js needs to do a little more now:


```javascript
define("plugins/portal/myAd/register", ['io.ox/core/extensions'], function (ext) {

    "use strict";

    // register widget
    ext.point('io.ox/portal/widget').extend({
        id: 'myAd'
    });

    // specify content and functionality of the widget
    ext.point('io.ox/portal/widget/myAd').extend({
        title: "My Advertisement",

        load: function (baton) {
            var def = $.Deferred();
            def.resolve("It's like solid happiness.").done(function (data) {
                baton.data = {
                    teaser: 'Buy stuff',
                    fullText: 'Buy stuff. It is like solid happiness.'
                };
            });
            return def;
        },

        preview: function (baton) {
            var content = $('<div class="content pointer">')
                .text(baton.data.teaser);
            this.append(content);
        },

        draw: function (baton) {
            var content = $('<div class="myAdd">')
                .text(baton.data.fullText);
            this.append(content);
        }
    });

    // add widget to portal settings including the 'add widget' dropdown
    ext.point('io.ox/portal/widget/myAd/settings').extend({
        title: 'My advertisement',
        type: 'myAd'
    });
});
```

What happened here? We have gained two new methods and all three methods seems to be passing something called baton around. 
The _baton_ is actually just that - something to pass around. The baton carries data between different methods.

## Order of execution

How do the three functions interact? 

__load__

When a plugin is supposed to be rendered, the first method to be called is "load". 
Load usually does some (asynchronous) loading of data, be it from the file store or some external source. 
Meanwhile, the empty tile (well, if you give it a title, that is already rendered, so it is not completely naked) is rendered on the portal page.

__preview__

When the loading is done, it is consensus that the loaded data is stored as baton.data. 
Then _preview_ is called and usually does something with the data in the baton. It then renders its content, which is appended to the tile.

__draw__

When the tile is clicked on, a side popup is drawn (which, again, is nearly naked). 
Meanwhile, the function draw is called and is used to draw content into the almost empty side popup.
As with _preview_, _draw_ usually uses the data from the baton.

The given example is a stereotypical use case: First, load gets the data. 
Then preview renders a short version of the data on the tile. 
When clicked, draw renders a longer, more detailed view of that data on a side popup.

## Notes

If you look closely, you will find that the class of the container on the tile has changed to "content pointer". 
This is relevant, as this makes the whole tile clickable (there is a delegate for '.item .content.pointer' that does that). 
This is just a comfortable way to do so, you don't have to use it. 
If you want to have different sections of your tile to execute different actions, you will have to implement handlers yourself.

This covers the most common uses of portal widgets. 
But if you are looking for more, we got more:

# Advanced plugins

## Initialize

Sometimes you want to do things even before loading. Maybe pre-populate the baton. For this we have the method _initialize_:


```javascript
 
ext.point('io.ox/portal/widget/myAd').extend({
    ...
    initialize: function (baton) {
        baton.default = "Defaultiness";
    }
});
```

## Action

In case you want to make the widget title clickable and perform some action when this happens.


```javascript
ext.point('io.ox/portal/widget/myAd').extend({
    ...
    action: function () {
        console.log('widget title was clicked!');
    }
});
```


## Things that require a setup

There are some external sources that need some kind of set up before they can be used. Services that need an OAuth authorization, for example. For this, you need to implement two more functions, named _requiresSetup_ and _performSetup_. The former determines whether it is necessary to run a setup, the latter starts the setup process if the former returns _true_.


```javascript
ext.point('io.ox/portal/widget/myAd').extend({
    ...
    requiresSetup: function () {
        return isMissingAnAccount();
    },
    performSetup: function () {
        createANewAccount();
    }
});
```


## Unique

Talking about things with OAuth... a lot of data sources are unique - people only have one twitter account. To make sure the widget can only be created once, set it to _unique_:


```javascript
ext.point('io.ox/portal/widget/myAd/settings').extend({
    title: 'My advertisement',
    type: 'myAd',
    unique: true
});
```


## Error handling

Occasionally, it might happen that there is an error when loading an external source. 
Should this occur and load (which, as you know, uses a $.Deferred) call fail instead of done, the function error is called. 
This allows you to handle this case differently.


```javascript
ext.point('io.ox/portal/widget/myAd').extend({
    ...
    error: function (error) {
        $(this).empty().append(
            $('<div>').text('An error occurred.');
        );
    }
});
```

This is not a catch-all solution, though: If you do not use _load_ to load that data, but do it in either _preview_ or _draw_, this will not work. 
It will also not work if the service that is called wraps the error nicely in a valid response.

## Configurable settings

Sometimes you want to fine-tune your widget. 
The place to do so is in the settings. 
If you mark your settings editable, your settings gets a little 'edit' link and you get to define a function that is called. 
This function is given both the model and the view so you can build your own settings pane:

```javascript
ext.point('io.ox/portal/widget/myAd/settings').extend({
    editable: true,
    edit: function (model, view) {
       ...
    }
});

```

# Stuck somewhere?

You got stuck with a problem while developing? OXpedia might help you out with the article about [debugging the UI](http://oxpedia.org/wiki/index.php?title=AppSuite:Debugging_the_UI).

## Checklist: Paths, names and Types

Remember:

- The path of the extension point must be io.ox/portal/widget/$name
- You have to have settings!
- The path of the settings extension point must be io.ox/portal/widget/$name/settings
- The type of the settings extension point must match the $name of the portal plugin!
- go all lowercase with your widget name, versions <7.6 sometimes had issues with that

## My shiny new widget does not show up in the widget selection

Yes. 
That is surprising, isn't it? 
There is a small peculiarity about manifests: They may be in the frontend, but the backend needs to know about them. 
Luckily, that is done automatically on system startup. 
You probably did not restart your server, didn't you?

If you cannot simply restart your server, but you want to test (good!), you can hack your widget into the list of loaded widgets. 
Open the io.ox/portal/widgets.js and look for the variable DEV_PLUGINS. 
Add the name of your plugin in there and re-build the UI.

# Finishing touches

Now that you have learned all there is about portal plugins, it is time to clean up. 
Check whether your plugin only [works when a certain module is active](http://oxpedia.org/wiki/index.php?title=AppSuite:UI_manifests_explained). 
Also, maybe we can interest you in [preparing the text for readers from other countries](http://oxpedia.org/wiki/index.php?title=AppSuite:I18n)? 
There is also an article on [plugins only showing under certain circumstances](http://oxpedia.org/wiki/index.php?title=AppSuite:Configuring_portal_plugins).



