---
title: Metrics
description: Track user behaviour and conditions within OX Appsuite
---

The Metrics module provides a very flexible and extendible way to track user behaviour and conditions within OX Appsuite.

A common set of events is tracked by default. Out of the box PIWIK is supported as reference analytics framework. Every other analytics framework can be added easily by registering a new adapter within the metrics module where data and events are mapped to the special needs of the target analytics framework.

# Setup Metrics within AppSuite
Please follow [theses steps](TODO) to configure AppSuite metrics + PIWIK.

# Basics

The metrics framework is located in Appsuite’s front end and can be [configured](#backend) by backend properties. The components and their tasks are listed as follows:
 
  * listener/handler: waiting for events and call metrics module
  * metrics module: provides a central API for tracking and propagate events to enabled adapters
  * adapter: maps generic event data for a concrete analytics framework and calls their API


## Frontend

The parts a separated by their role/task with high flexibility and extendability in mind.

### Components

  - metrics listener: waiting for a event (example: click on an ‘mail reply’)
  - metrics handler: submits data to the metrics module
  - metrics module: central facade with a generic API as connecting piece between event handlers and adapters
  - metrics adapter: communicates with a concrete analytics framework API

### Source code

```javascript
  // core module
  io.ox/metrics/main.js

  // adapter for each target analytics framework
  io.ox/metrics/adapters

  // adapter for PIWIK
  io.ox/metrics/adapters/default.js

  // global listeners/handlers
  io.ox/metrics/extensions.js
```

## Backend 

Use the following setting properties to enhance/adjust usage. Please be aware of the double slashes that are used as separator for the namespaces.

### Global 

```
  # global switch [true/false]
  # current default: true
  io.ox/core//tracking/enabled
```

```
  # consider doNotTrack-flag in front end [true/false]
  # current default: false
  io.ox/core//tracking/donottrack
```

### Adapterspecific 

For more details visit the [adapter article](TODO).

```
  # ADAPTER BLOCK PIWIK: START 
 
  # adapter switch (PIWIK) [true/false]
  # current default: true
  io.ox/core//tracking/piwik/enabled

  # platform base url [url]
  # current default: https://[insert-your-host-here]/piwik/
  io.ox/core//tracking/piwik/url

  # platform page id [url]
  # current default: 1
  io.ox/core//tracking/piwik/id

  # ADAPTER BLOCK PIWIK: END 
```

