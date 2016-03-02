---
title: Add Actions 
description: To add an action to the files app detail area the extensionpoint io.ox/files/links/inline is used.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Files_App_Actions
---

For details about actions and links please refer to the main [action article](TODO).


# Adding actions to the files detail area

Creating a new action is pretty straight forward.
Just create a new Action and give it a unique name (internally we use slashes to indicate a module hierarchy, so names are inherently unique) and provide a few options.

To add an action to the drive app file detail area the extension point _io.ox/files/links/inline_ is used.

Use the Link pattern in _io.ox/core/extPatterns/links.js_ to extend this point.

__Try via browser console__

```javascript
require(['io.ox/core/extensions', 'io.ox/core/extPatterns/links'], function (ext, links) {

    // create action
    new links.Action('io.ox/files/actions/testlink', {
        requires: function (e) {
            e.collection.has('some') && capabilities.has('webmail');
        },
        multiple: function (baton) {
            console.log(baton);
        }
    });

    // extend this classic toolbar extension point to add the new link there
    ext.point('io.ox/files/classic-toolbar/links').extend(new links.Link({
        id: 'testlink',
        index: 101,
        label: 'Test Action',
        prio: 'hi',
        ref: 'io.ox/files/actions/testlink'
    }));
});
```


# Disable existing action

Basically a action is a extension point (id: action id) with exactly one action (id: 'default') - so disabling is quite simple:

```
ext.point('[insert action id here]').disable('default');
```
