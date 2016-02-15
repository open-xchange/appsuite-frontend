---
title: Add Actions 
description: To add an action to the files app detail area the extensionpoint io.ox/files/links/inline is used.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Files_App_Actions
---

# Examples

## Adding actions to the files detail area

To add an action to the files app detail area the extensionpoint _io.ox/files/links/inline_ is used.

Use the Link pattern in _io.ox/core/extPatterns/links.js_ to extend this point.

__Try via browser console__

```javascript
require(['io.ox/core/extensions', 'io.ox/core/extPatterns/links'], function (ext, links) {

    new links.Action('io.ox/files/actions/testlink', {
        requires: function (e) {
            e.collection.has('some') && capabilities.has('webmail');
        },
        multiple: function (baton) {
            console.log(baton);
        }
    });

    ext.point('io.ox/files/links/inline').extend(new links.Link({
        id: 'testlink',
        index: 400,
        label: 'Test Action',
        ref: 'io.ox/files/actions/testlink'
    }));
});
```

### Action

The first argument is the unique id of the action. 

requires - checks for the needed components and the collection status. (_some_ is used for multiple elements, _one_ for an single one)

- If the action is used only on a single element use _action_.
- If the action should be applied to multiple elements use _multiple_.
- In both cases the baton is available to the action.

### Link

- id: must be unique
- index: the position/order of the link
- label:  the label for the link
- ref:the reference to the action id
