---
title: Settings
---

# Introduction

Settings (sometimes 'jslob' is used synonymously) fulfils a double function.

**user settings**

First of all they're used to store the user settings - no suprise here.
The settings object has a _get_ and _set_ function to get and manipulate the different properties.
A _save_ function syncs the current state with the database.

**configurations**

The second usage is to communicate small configuration 'switches'.
In contrast to capabilites these attributes cover small impacts on the ui.
Of course they are read only are not synced when calling _save_.

Usually they provide a simple on/off information (often called 'feature switch') or they provide configuration details maybe in form of a list of folders.

# Capability vs. setting

Capabilities covers more global configurations with it's simple enabled/disabled states.
For example the capability _tasks_ controlls the availability of the task app.

Settings in opposite are more flexible (more than true/false) and tend to affect the ui in more subtler ways.

# Setting namespaces

```javascript
settings!io.ox/core

// modules
settings!io.ox/portal
settings!io.ox/mail
settings!io.ox/calendar
settings!io.ox/contacts
settings!io.ox/files
settings!io.ox/tasks

// settings
settings!io.ox/settings/configjump

// timezones and available themes
settings!io.ox/core/settingOptions

// migration states
settings!io.ox/core/updates

// calendar & tasks
settings!io.ox/caldav

// plugins
settings!plugins/portal/oxdriveclients
settings!plugins/upsell
```

# Debugging

You can use this snippet to get a quick look at the differnt settings - just replace the core namespace with one of the listed ids above

## list all

```javascript
require(['settings!io.ox/core']).done(function(settings) {
    console.log(settings.get());
})
```

## change

```javascript
require(['settings!io.ox/core']).done(function(settings) {
    settings.set('some/id', 'some-value').save();
})
```

# Best practices

- use the `feature/` namespace for feature switches or feature details (`feature/[foobar]/...`)
- do not user slashes as part of the key (f.e. 'folder/hidden') cause slashes are uses as dividers when building up the settings tree
- prefer camelCase instead of underscores or dashses

# List

A full list of settings are available [here](../miscellaneous/settings-list-of)
