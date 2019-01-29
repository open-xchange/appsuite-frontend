---
title: Action and Links
description: Action can be used to apply an action to an item or even a selection of items. Links representing their visualisation in toolbars or dropdowns.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Action_links
---

source code: _io.ox/core/extPatterns/links.js_

# API

## Action

These are the options available when you creating a new action.

**id**

- a unique identifier
- type: string

**requires (optional)**

- type: string or function
- (string) a string containing one or more special keywords ('toplevel', 'one', 'some', 'delete', …) representing needed components, permissions or collection statuses
- (function) - a function that returns a Boolean value and gets a _Baton_ object as parameter

**action (optional)**

- type: function
- baton is available to the action as parameter
- a callback function, called when the action is triggered for **one** element

**multiple (optional)**

- type: function
- baton is available to the action as parameter
- a callback function, called when the action is triggered for **multiple** (a list of) elements

**capabilities (optional)**

- type: string
- outcome depends of state of capability and it's corresponding upsell config
- draw action link only if at least one capability is active OR corresponding upsell is available
- example: `capabilities: '!alone infostore'` expresses 'not alone OR infostore'

## ActionLink

- id: must be unique
- index: the position/order of the link
- label:  the label for the link
- ref:the reference to the action id

# Common usage

For some examples how to create and customize please refer to the [customize action article](../customize/action.html).
