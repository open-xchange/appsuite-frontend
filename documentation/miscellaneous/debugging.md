---
title: Debugging
description: A collection of hints to debug during UI development.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Debugging_the_UI
---

See also [AppSuite:UI FAQ]](http://oxpedia.org/wiki/index.php?title=AppSuite:UI_FAQ). 
Sister page: [Debugging the server](http://oxpedia.org/wiki/index.php?title=AppSuite:Debugging_the_server).

# What capabilities are available?

```javascript
_(ox.serverConfig.capabilities).pluck("id").sort();
```


# Is a specific capability set?


```javascript
require(['io.ox/core/capabilities'], function (cap) {
    console.log(cap.has('certain_cap'));
});
```

# Which files failed to load?

```javascript
requirejs.s.contexts._.registry
```

# What portal widgets are available?

```javascript
require(['io.ox/portal/widgets'], function (widgets) {
  console.log(widgets.getAvailablePlugins().sort());
});
```

# Check settings

```javascript
// check core settings
require('settings!io.ox/core').get();
// check mail settings
require('settings!io.ox/mail').get();
```

# Clear all persistent caches

Please mind that this does not clear the regular browser cache! It clears localStorage, IndexedDB, and WebSQL.

```javascript
ox.cache.clear();
```

# Clear all portal widgets

Sometimes you manage to build a portal widgets that messes up all kinds of things when a user adds it. This is a rather blunt way of solving the problem:

```javascript
require(['settings!io.ox/portal'], function(settings) {
 settings.set('widgets/user', '').save();
}); 
```

# Debug relogin

```javascript
ox.autoLogoutRestartDebug();
```
` 
# Enable/disable capability via URL hash

Just add the parameter "cap" to URL hash. A leading minus disables a capability. Multiple capabilities separated by comma. Example:

 ```
...&cap=emoji,-calendar
 ```
  
# Changes do not apply while developing

You did changes in your code and they don't simply don't apply? 
There are several possibilites, you should check in order to find a solution.

- Reload AppSuite with cleared Browser Cache. Using Firefox on Linux-Distributions you can simply press Ctrl+F5. Please check the documentation of your Browser for Shortcuts and how to clear the cache.
- Disable Source Caching. Therefor add the parameter "debug-js=true" to URL hash. Example:

```
...&debug-js=true
```

# Debug a specific folder

If you want to get details of a specific folder, just inspect it via dev tools and look for data-obj-id="...". 
Copy the id and run the following in console:


 ```javascript
void require('io.ox/core/api/folder').get({ folder: 'default0/INBOX' }).always(_.inspect);
 ```
  
# Finding the version

If you want to know the backend and frontend versions with revision numbers, specifically when you simply cannot find it from the WebUI's About button as some customer hides it, then you can use the following command:

```javascript
"Server version: " + ox.serverConfig.serverVersion + ", UI version: " + ox.version
 ```
  
