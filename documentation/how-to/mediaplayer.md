---
title: Mediaplayer
description: mediaelement.js is used as media player
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Mediaplayer
---

# Browser and device support

App Suite uses [mediaelement.js](http://mediaelementjs.com/) as media player. The player uses native HTML5 audio and video elements plus it falls back to flash or silverlight if they are not available.

Every browser supports a different set of supported codecs and container formats. Follow this link to see which ones: [http://mediaelementjs.com/#devices](http://mediaelementjs.com/#devices)

# Figure out version of mediaelement.js

We always try to integrate the latest version of mediaelement.js in order to get latest fixes. 
To figure out which version is integrated in your release, please run the following code:


```javascript
// logs "2.11.0" in current development branch (April 2013)
require(['apps/mediaelement/mediaelement-and-player.js'], function () {
  console.log(mejs.version);
});
```

# How to enable/disable the media player

In order to configure this server-side, just create a new property file or append to existing __appsuite.properties__ (mind the __double-slash__; this in not a typo!):

 ```property
io.ox/files//audioEnabled = true|false
io.ox/files//videoEnabled = true|false
 ```
  
