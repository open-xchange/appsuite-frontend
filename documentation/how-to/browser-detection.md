---
title: Browser detection 
description: AppSuite detects the client browser and collects some information about the current device the visitor is using with formlogin. 
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Browserdetection
---

AppSuite detects the client browser and collects some information about the current device the visitor is using. 
This information is used to serve the appropriate UI and enable/disable certain features for the visitor's device.

The browser detection is done by a standalone, dependency free lib that can be included via script-tag to other sites. 
The original AppSuite login page performs this browser detection. 
But if you use a form-login and jump directly into AppSuite, the user will miss the warning where AppSuite statesthat an unsupported browser is used.

To show the same warning to a user without using the original AppSuite login page, you should include the browser detection lib in your own login page. That way you can show a warning to the user if they do not use a supported browser.

# Including the browser.js lib

You can easily include the browser detection via script-tag in your own login page. 
It's a small, dependency free piece of Javascript code which adds a function to the global scope called

```javascript
isBrowserSupported()
```

The lib is located in the AppSuite UI under http://somedomain.com/appsuite/src/browser.js. Add this script tag to your page head

```html
<script src="http://somedomain.com/appsuite/src/browser.js" type="text/javascript" charset="UTF-8"></script>
```

In your page onLoad you can then call the global function _isBrowserSupported_ which returns a boolean. 
If false is returned by the function you should show a warning to the user that his browser is not supported.
