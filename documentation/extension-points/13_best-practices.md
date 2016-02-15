---
title: Best practices
description: 
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Extending_the_UI_(best_practices)
---

The extension points system allows different strategies to realize the desired behavior. 
This is a list of solutions for common scenarios pointing out also some disadvantages of different solutions.


# scenario: writing extension in general

_separate extension declaration and logic for reusability_

example: io.ox/mail/common-extensions.js and io.ox/mail/detail/view.js

```javascript
var fnProcess = function (baton) { ... };
// use function within some extension
ext.point('io.ox/mail/detail/content').extend({
   id: 'links',
   index: 100,
   process: fnProcess
});
// use function within another extension
ext.point('io.ox/mail/detail/content').extend({
    id: 'images',
    index: 100,
    process: fnProcess
});
```


# scenario: hide/show action

_simply register a fresh new extension with an index less than the original action extension._


```javascript
// original extension
new Action('io.ox/mail/actions/compose', {
    id: 'compose',
    index: 100,
    requires: function() {
        return true;
    },
    ...
});
// your extension to hide it
ext.point('io.ox/mail/actions/compose').extend({
    // must be a different id than used in original extension
    id: 'compose_preprocess',
    // important: must be smaller than the one used in original extension that is usually 'default'
    index: 50,
    requires: function(e) {
        // is your condition meet?
        if (myCondition === true) {
            // stop propagation to suppress execution of
            // requires-handlers of extensions with a higher index
            e.stopPropagation();
            // force hide (or force show by using 'return true')
            return false;
        }
    }
});
```


__unfavorable variants__

_using ext.point(...).replace_

- original requires function is replaced and can not be accessed anymore
- also copy and paste it contents does not help cause future changes are not carried over automatically
- see documentation for .replace


```javascript
 // please do not use replace to overwrite 'requires'
ext.point('io.ox/mail/actions/compose').replace({ 
    requires: function () {
        // my custom logic
    } 
})
```

# scenario: stop propagation of action

_simply register a fresh new extension with an index less than the original action extension.__


```javascript
 // original extension
new Action('io.ox/mail/actions/compose', {
    index: 100,
    requires: function () {
        return true;
    },
    ...
});
```


```javascript
// your extension to hide it
ext.point('io.ox/mail/actions/compose').extend({
    // must be a different id than used in original extension that is usually 'default'
    id: 'compose_preprocess',
    // important: must be smaller than the one used in original extension
    index: 50,
    action: function(baton) {
        // be robust when clicked again and conditions may have changed
        baton.enable('default');
        if (myCondition === true) {
            baton.disable('default');
        }
    }
});
```

__hint__ 

In case the condition for a single action target (f.e. a mail item) do not change you can use 'baton.preventDefault()' alternatively when you condition is met.
