---
title: Modifying forms
description: Apply different changes to the contact form via modifying its extensionpoints and extensions
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Modifying_forms_by_using_extension_points
---

# Show available extension points[edit]

The edit form of the contacts app is constructed by a set of extension points.
Each extension point controls a single aspect of the form. 
To apply modifications, the id of the point and the extension is needed. 
For a quick overview of the available points and extensions you can use the browser console:


 ```javascript
// show all available extension points (across all apps)
require('io.ox/core/extensions').keys();
 ```

 ```javascript
// you can filter down the list by using regular expression 
_(require('io.ox/core/extensions').keys()).filter(function (point) {
    if (/io.ox\/contacts\/edit/.test(point)) {
        return point;
    }
});
 ```

 ```javascript
// show all available extensions of a known extension point
require('io.ox/core/extensions').point('io.ox/contacts/edit/personal').all();
 ```

# Modify extension points[edit]

As described in [Hands-on introduction](TODO) extension points can be modified in multiple aspects:

```javascript
// disable the display_name field
require('io.ox/core/extensions').point('io.ox/contacts/edit/personal').disable('display_name');
```

```javascript
// reenable the display_name field
require('io.ox/core/extensions').point('io.ox/contacts/edit/personal').enable('display_name');
```

```javascript
// replace the display_name field by "Hallo World!"
require('io.ox/core/extensions').point('io.ox/contacts/edit/personal')
.replace({
    id: "display_name",
    draw: function () {
        this.append(
            $("<div>").addClass("title").text("Hello World!")
        );
    }
});
```


 ```javascript
// modify the index of the display_name field to bring it on top
require('io.ox/core/extensions').point('io.ox/contacts/edit/personal')
.replace({
    id:"display_name",
    index: 50
});
 ```
 

```javascript
// modify the hidden status to hide the display_name field via get() as alternative way
require('io.ox/core/extensions').point('io.ox/contacts/edit/personal')
.get('display_name', function (extension) {
    extension.hidden = true;
});
```

# Extending the form validation via extension points[edit]

In addition to the default validation, another validation step can be implemented by extending the proper extension point:

```javascript
// extend the validation of the display_name field
require('io.ox/core/extensions')
.point('io.ox/contacts/model/validation/display_name')
.extend({
    id: 'check_for_klaus',
    validate: function (value) {
        if (value !== 'Klaus') {
            return 'The display name has to be Klaus';
        }
    }
});
```
