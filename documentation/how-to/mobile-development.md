---
title: Developing for mobile devices
description: App Suite is designed to work on all device types and sizes. The UI uses responsive design principles to scale nicely on each device size.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Mobile
---

App Suite is designed to work on all device types and sizes. 
The UI uses responsive design principles to scale nicely on each device size.
We do define three display sizes to macht the majority of devices. 
These are simply named "small", "medium" and "large". 
Theses classes are used to match smartphones, tablets and desktop PCs. 
If you are developing a app for App Suite make sure it runs nicely and looks great on all of these three device categories. 
(If you are not familiar with latest CSS techniques and the principles of responsive design you should have a look at this [article](http://oxpedia.org/wiki/index.php?title=AppSuite:UI_developer_primer)).

Often the simple use of media queries is not enough to customize your app for small and medium screens, you may need to customize your application code as well. 
We have integrated a function to detect everything you might want to know during runtime in your javascript code.

# Sizes

The minimum device target size is 320 x 480 pixels. 
Your App should work on devices with this resolution.

- small: up to 480px
- medium: 481px up to 1024px
- large: 1025px and higher

# The _.device function

We extended underscore with a new function called __.device_

The __.device()_ function can be used to retrieve informations about the device. The function takes a string as argument which contains a boolean expression. 
This expression will be evaluated and the result is returned as a boolean.

The device function uses __.browser_ object for informations in combination with __.screenInfo_

The device class 'smartphone' is used to determine a mobile device and is detected by several criteria. For more details, see this [article about smartphone classification](http://oxpedia.org/wiki/index.php?title=AppSuite:UI_smartphone_device_classification).

# Examples for _.device

```javascript


// handle different mobile operating systems
if (_.device('ios')) {
   // true for all devices running iOS, no matter what version
   console.log('you are running iOS');
}

// combined statements
if (_.device('ios && android')) {
   // true for all android and iOS devices
}

// negation
if (_.device('!android')) {
    // true for all devices except android 
}

// screen information
if (_.device('small && iOS ')) {
   // true for iPhone, not for iPad
}

// shorthands
_.device('smartphone')
// true for small devices running a mobile OS (iOS, Android, BB or Windowsphone)

_.device('tablet')
// true for medium sized devices running a mobile OS

_.device('desktop')
// true for all devices not running a mobile OS

// getting version informations
_.device('ios > 5 || android > 4') 
// true for ios > 5, i.e. 5.1 and 6. Same for Android, 4.0 will fail 4.1 or 4.2 will be true. 

// enhanced screen information 
_.device('iOS && retina && small')
// true for iPhone 4, 4s and 5 (retina display)

_.device('landscape && android && medium') 
// true for android tablet held in landscape mode

// other information, simple browser detection
_.device('safari || firefox')
```

Please note that information about device orientation may change during usage.

# Mobile considerations

As of today mobile usage has become much more important than some years ago
Always consider the the fact a user may want to use your App on a smartphone.
So, optimizing for mobile should not be last step in your development process, it should be one of the first. 
This will safe you a lot of painful debugging and layout fixes.

You should ask you a simple question: Does function X in my App do have a mobile use case? 
Or more simple: Will anybody use this on a smartphone? 
If not, disable or remove this function on a mobile device. 
Nobody will perform a complex 35-click action in your App on a smartphone.

Developing for mobile should follow some simple rules:

- Mobile phones do have small screens. Safe space in your layout, reduce margins and paddings.
- Touch is not click, keep buttons and links big enough to be touchable. 40px should be a minium.
- Mobile networks are slow and have a high latency. Safe network requests and handle failing requests properly
- Mobile devices are not as fast as desktop PCs. Not everybody has a high end smartphone so keep your code clean and fast
- Always test your App on a real device

# Remote Debugging

To setup remote debugging on windows, mac and linux you can follow the instructions from the chrome developer tools website.

[Remote Debugging on Android with Chrome](https://developer.chrome.com/devtools/docs/remote-debugging)


If this is not working or not applicable for you, use the following description:

[How to setup remote debugging for Chrome on android devices with a mac](http://oxpedia.org/wiki/index.php?title=AppSuite:UI_remote_debugging_android_mac)
