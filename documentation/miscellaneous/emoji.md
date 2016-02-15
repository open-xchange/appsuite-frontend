---
title: Emoji
description: Learn about how different icon sets can be included and configured.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Emoji
---

# Enabling emoji support

Emoji support is disabled by default. In order to enable the feature, you must define the capability __emoji__. 
This is done by just adding the word "emoji" to the property "permissions" in ``/opt/openexchange/etc/permission.properties``:


```javascript
permissions=...,emoji
```

# Settings

Configuration will be served via [jslob](TODO) service at the following path.


```
io.ox/mail/emoji
```


The following settings are relevant for emoji support:

```
io.ox/mail/emoji//defaultCollection=unified
io.ox/mail/emoji//availableCollections=unified,two,three
io.ox/mail/emoji//forceEmojiIcons=false
io.ox/mail/emoji//collectionControl=none # possible values 'none', 'tabs', 'dropdown'
io.ox/mail/emoji//autoClose=false
io.ox/mail/emoji//userCollection=emoji/defaultCollection
io.ox/mail/emoji//overrideUserCollection=false
io.ox/mail/emoji//sendEncoding=unified # possible values 'unified', 'pua'
```

In order to configure this server-side, just append to existing ``appsuite.properties`` or create a new file ``emoji.properties`` (in same directory; please mind the double-slash, this in not a typo! plus: changing such settings requires a backend restart).

| Setting | Setting |
|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| defaultCollection | Default collection. |
| availableCollections | Available collections. Comma separated. The order is important, since this will be used as an order for the fallback mechanism. If an icon is not found in the userCollection, the icon is looked up in each available collection and the first 'hit' will be used. |
| forceEmojiIcons | always convert emoji unicode characters to img-tags |
| collectionControl | none, dropdown, tabs. |
| autoClose | Emoji pallet closes when user click or presses any key inside editor |
| userCollection | Current user collection |
| overrideUserCollection | Set this setting to true and the current user collection will not be prefered when replacing unicode characters with an image. (See comment for availableCollections describing the fallback mechanism.) Since Mail compose works with a current collection object, this setting has no effect when inserting icons from the editor plugin into the text. But when rendering any text with unicode characters, this setting will have an effect on the icon that is shown. |
| sendEncoding | Override the default send encoding to use something else than unified (unicode6) |

# How to add a new icon set

It is possible to add new icon sets by [writing a core plugin](http://oxpedia.org/wiki/index.php?title=AppSuite:Writing_a_simple_application). It is recommended, to install the files to

```
apps/3rd.party/emoji/<iconSetName>/
```

Put all your CSS code and images into this directory and create a register.js adding the CSS/LESS files as dependencies.

Once this is done, you need to add the CSS also to the tinyMCE editor, because an iframe is used to edit the text and in order to have full emoji support, you need to load the CSS code there as well. 
Doing so is really easy. 
There is an extension point you can use to add the paths to your CSS files.

```javascript
define('3rd.party/emoji/greatestIconSet/register',
   ['io.ox/core/extensions',
    'css!3rd.party/emoji/greatestIconSet/emoji.css',
    'css!3rd.party/emoji/greatestIconSet/emoji_categories.css'
   ], function (ext) {

    "use strict";

    ext.point('3rd.party/emoji/editor_css').extend({
        id: 'greatestIconSet/categories',
        css: '3rd.party/emoji/greatestIconSet/emoji_categories.css'
    });
    ext.point('3rd.party/emoji/editor_css').extend({
        id: 'greatestIconSet/icons',
        css: '3rd.party/emoji/greatestIconSet/emoji.css'
    });
});
```

# Naming conventions in CSS code

The CSS must follow some easy structure. 
There must be a base class for all icons that defines the background image. 
It must match the name of your icon set prefixed with “.emoji-”.

Each icon will then be identified by a string that can be defined in the icon set metadata.

Find here a short example copied from the unified icon set shipped with Appsuite.

```css
.emoji-unified { 
    background: url("emoji.png") top left no-repeat;
    width: 20px;
    height: 20px;
    display: -moz-inline-stack;
    display: inline-block;
    vertical-align: top;
    zoom: 1;
    *display: inline;
}
.emoji2600 { 
    background-position: -500px -120px;
}
```
