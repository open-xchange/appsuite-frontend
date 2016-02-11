---
title: Backbone views
icon: 
keywords: backbone
---

This article introduces a set of special views we use troughout the UI. All based on http://backbonejs.org/#View

# Disposable View

This one is all about garbage collection and avoiding memory leaks. 
It's main feature is the ability to detect that it got removed from the DOM. 
In that case, the view cleans up itself, i.e. removes all event handlers and nulls all properties automatically.

All your custom views should be based on DisposableView! 
And please please please **favor Backbone's listenTo(...) over .on(...)** 
(see http://backbonejs.org/#Events-listenTo)! 
The first one will be subject to garbage collection, the latter one won't.

See ``io.ox/backbone/views/disposable.js``


# Extensible View

A very simple view based on DisposableView, of course. 
Its central option is **point** (string) which defines or refers to an extension point. 
For convenience, you can call .extend({ ... }) to define extensions on the fly.

Purpose is to simplify and promote the use of extensions.

See ``io.ox/backbone/views/extensible.js``

## Methods

**extend(options)**

Add extensions. 
This method expects a simple key-value object; 
key becomes the extension id, the value becomes the "render" function; 
the extensions index is auto-incremented by 100. 
This function is only executed once per point before render() to avoid duplicates (extensions are static, i.e. not bound to any view instance).

## Example

```javascript
require(['io.ox/backbone/views/extensible'], function (ExtensibleView) {
    new ExtensibleView({ point: 'extensible/xmpl' })
    .extend({
        default: function () {
            this.append(
                $('<h1>').text('Hello World')
            );
        }
    })
    .render()
    .$el.insertBefore('section.body');
});
```


# Modal Dialog View

A modal dialog based on ExtensibleView that uses the markup and CSS of Bootstrap's Modal Dialog (see http://getbootstrap.com/javascript/#modals).

See ``io.ox/backbone/views/modal.js``

## Options:

- **async**: call busy() instead of close() when invoking an action (except "cancel"). This allows to do asynchronous stuff after an action has been invoked.
- **container**: parent DOM element of the dialog; default is 'body'
- **enter**: this action is triggered on <enter> by default
- **focus**: set initial focus on this element
- **help**: link to online help article
- **keyboard**: close popup on <escape>; default is true
- **maximize**: popup uses full height
- **point**: extension point id to render content; not mandatory but you should use it
- **title**: dialog title
- **width**: dialog width

## Methods

- **open()**<br>
  Calls render(), adds to DOM (i.e. container, see options), shows modal dialog.
- **close()**<br>
  Closes dialog, remove it from DOM, dialog gets disposed.
- **busy()**<br>
  Disables all form elements, adds opacity.
- **idle()**<br>
  Enables all form elements - except those that were already disabled when calling .busy(). Removes opacity.
- **extend(options)**<br>
  See ExtensibleView
- **build(callback)**<br>
  Run a simple builder as a callback.
- **addButton(options)**<br>
  Add a button. Options are:
  - **placement** (string): 'left' or 'right' (default)
  - **className** (string): 'btn-primary' (default) or 'btn-default'
  - **label** (string): Button label
  - **action** (string): Button action
- **addCancelButton(options)**<br>
  Adds a cancel button. Action is "cancel", label is "Cancel".
- **addCloseButton(options)**<br>
  Adds a cancel button. Action is "cancel", label is "Close".
- **addAlternativeButton(options)**<br>
  Adds an alternative button. Placement is "left".
- **invokeAction(action)**<br>
  Process an action (string).

## Example

```javascript
require(['io.ox/backbone/views/modal'], function (ModalDialog) {
    new ModalDialog({ enter: 'woohoo', focus: '.foo', help: 'xmpl', point: 'modal/xmpl', maximize: true, title: 'Example' })
    .extend({
        default: function () {
            this.append(
                $('<div class="form-group">').append(
                    $('<label>').text('Label'),
                    $('<input type="text" class="form-control foo" tabindex="1">')
                )
            );
        },
        text: function () {
            this.append(
                $('<p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>')
            );
        }
    })
    .addCancelButton()
    .addCloseButton()
    .addAlternativeButton()
    .on('all', _.inspect)
    .open();
});
```

