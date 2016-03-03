---
title: Extensions
description: Extensions add or replace functionality during runtime and are     referenced by a unique id
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Extending_the_UI
---

# Attributes

| property       | description                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------- |
| id             | unique                                                                                            |
| index          | (optional): numeric value used for specify order of execution (also valid are 'first' and 'last') |
| (functionname) | as required by the extension point contract                                                       |

**example**

```javascript
//defining a extension for some extension point that requires a draw function
{
    id: 'example1',
    index: 100,
    draw: function () {
        //draw something
    }
};
```

# Execution order

To ensure your extension is called first or last use the index 'first' or 'last'. 
Keep in mind that a defined call order does not guarantees all extensions with a lower index finished already when your extension is called (for example some asynchronous code). 
Nevertheless for the most common use case (draw extensions that create/modify nodes with already present data) this execution order should be quite reliable to do some DOM manipulation within an custom extension indexed as 'last'. 
If more than one extension of a point has the index 'first' or 'last' these will be executed first/last in the order they were added.

# Extensions patterns

OX App Suite uses extensions patterns. 
Please keep in mind that this list not necessarily covers all pattern currently used.

**io.ox/backbone/forms.js**

- CheckBoxField
- ControlGroup
- DateControlGroup
- DatePicker
- ErrorAlert
- Header
- InputField
- Section
- SectionLegend
- SelectBoxField
- SelectControlGroup

**io.ox/backbone/views.js**

- AttributeView

**io.ox/calendar/edit/recurrence-view**

- RecurrenceView

**io.ox/core/extPatterns/links**

- Button
- DropdownLinks
- InlineLinks
- link
- ToolbarLinks

**io.ox/core/tk/attachments**

- AttachmentList
- EditableAttachmentList

**io.ox/contacts/widgets/pictureUpload.js**

**io.ox/preview/main.js**

- Engine
