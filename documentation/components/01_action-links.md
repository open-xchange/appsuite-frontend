---
title: Action links
description: Action links can be used to apply an action to an item or even a selection of items.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Action_links
---

Use them to extend actions for existing items or create a toolbox for your custom items available in your application.

# The API

## Action

Creating a new action is pretty straight forward. J
ust create a new Action and give it a unique name (internally we use slashes to indicate a module hierarchy, so names are inherently unique) and provide a few options.

```javascript
var action = new Action('unique/name/of/my/action', {
    //some options go in here
});
```


__Available options__

In the options parameter you can provide the actual logic for the action. 
You can provide callbacks, requirements and more.

- id
    - a unique identifier (String)
- requires (optional)
    - (String) - a String containing one or more special keywords that are required for this action to be active
        - toplevel
        - one
        - some
        - delete
        - …
    - (Function) - a function that returns a Boolean value and gets a Baton object as parameter
- multiple (optional)
    - (Function) - a callback function, called when the action is triggered with a list of elements
- action (optional)
    - (Function) - a callback function, called when the action is triggered for one element


## ActionLink

## ActionGroup

## Link

## XLink

## Button

## ButtonGroup

## ToolbarButtons

## ToolbarLinks

## InlineLinks

## DropdownLinks

## Dropdown

# Examples
