---
---

<h1>Adding actions to the files detail area</h1>
<p>To add an action to the files app detail area the extensionpoint <em>io.ox/files/links/inline</em> is used.<br>
Use the Link pattern in <em>io.ox/core/extPatterns/links.js</em> to extend this point.<br>
</p>
<p>Try via console:</p>
```
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
        label: 'labelname',
        ref: 'io.ox/files/actions/testlink'
    }));
});

```

<b>Action</b><br><br>

The first argument is the unique id of the action. <br><br>

requires - checks for the needed components and the collection status. (<em>some</em> is used for multiple elements, <em>one</em> for an single one)<br><br>

If the action is used only on a single element use <em>action</em>.<br>
If the action should be applied to multiple elements use <em>multiple</em>.<br>
In both cases the baton is available to the action.<br><br>

<b>Link</b><br><br>

id - must be unique<br>
index - the position/order of the link<br>
label - the label for the link<br>
ref - the reference to the action id<br>
