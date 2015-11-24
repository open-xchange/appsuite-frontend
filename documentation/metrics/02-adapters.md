---
title: Adapters
description: Map metrics data to requirements of a concrete analytics solutions.
---

Adapters can be registered or extended by using the well established
technology of extension points.

Here is an basic example how the PIWIK adapter is registered. The
metrics module will call/invoke the defined functions for all registered
adapters.

# Your Adapter

## Check preconditions

Please add at first a line into the code that checks for the user
settings. In case the current adapter is disabled we should prevent
registering the adapter.

```javascript
  if (!settings.get('tracking/[add-your-id-here]/enabled', false)) return;
```

## Register Adapter

```javascript
  ext.point('io.ox/metrics/adapter').extend({
        id: 'piwik',
        setup: function () {
          // called once
        },
        trackVisit: function () {
          // called for each tracked visit (usually called once)
        },
        trackEvent: function (baton) {
           // called for each tracked event
        },
        trackPage: function (baton) {
          // called for each opened application/module
        },
        trackVariable: function (baton) {
          // usually called once
        }
    });
```

For more details the source code of the PIWIK adapter is A very good
starting point.

## Overwrite predefined adapter

Please take a look at the extension point documentation.

# PIWIK

Predefined adapter for the open-source analytics platform.

## source

```javascript
  io.ox/metrics/adapters/default.js
```

## hint

Be aware to not use a name for your javascript files that matching
common patterns of adblockers. For example in case we would name
default.js PIWIK.js the adblocker would block the request and an error
occurred in the the browser.

## data mapping: app starting

This represents the impact of a user interaction not the interaction
itself.

### Page titles

Every time a module/app is used for the first time for each visit the
corresponding event will be triggered.

You can interpret page titles as '\[appname\] was started \[x\] times'.
Please be aware that after a full refresh of the browser tab used by OX
Appsuite the app usage is tracked again.

## data mapping: tracked user interaction

This represents a user interaction like a click on a functional ui
element.

### Event action

This part contains all main information about the whole event data
condensed in a single string.

```
// example: 'mail/toolbar/delete'
\[appname\]/\[location in the ui\]/\[action\]
```

### Event category

This part of the event data contains the application were the event
occurred. You can Interpret it as 'a user action within \[appname\]
occurred'. Please be aware that the category is based on the technical
app that might differ from the abstract application that is communicted
by the user interface.

__example: 'io.ox/mail'__

### Event name

The event id.

__example: 'delete'__

### Event value

An optional value that might contain further details about the event.


# Console

A special predefined debugging adapter that simply writes events to
console.

## source

```javascript
  io.ox/metrics/adapters/console.js
```

## hint

You can activate this special adapter that writes events to console and
tracks all events in browsers localstorage. To activate/deactivate
simply paste this code into your console when you are logged in at
appsuite:

```javascript
  // enable
  require('settings!io.ox/core').set('tracking/console/enabled', true).save();
  
  // disable
  require('settings!io.ox/core').set('tracking/console/enabled', false).save();
```

 You can see all tracked events by using the browers console again:

```javascript
  //directly accessing to the data
  metrics.hash
  
  // please use the following only in chrome cause it is using console.table
  metrics.show();
```
