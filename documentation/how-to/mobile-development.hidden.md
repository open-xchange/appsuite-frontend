---
title: Mobile development
description: OX App Suite is designed to work on all device types and sizes. The UI uses responsive design principles to scale nicely on each device size.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Mobile
---

App Suite is designed to work on all device types and sizes.
The UI uses responsive design principles to scale nicely on each device size.
We do define three display sizes to macht the majority of devices.
These are simply named "small", "medium" and "large".
Theses classes are used to match smartphones, tablets and desktop PCs.
If you are developing a app for OX App Suite make sure it runs nicely and looks great on all of these three device categories.
(If you are not familiar with latest CSS techniques and the principles of responsive design you should have a look at this [article](http://oxpedia.org/wiki/index.php?title=AppSuite:UI_developer_primer)).

Often the simple use of media queries is not enough to customize your app for small and medium screens, you may need to customize your application code as well.
We have integrated a function to detect everything you might want to know during runtime in your javascript code.

# Sizes

The minimum device target size is 320 x 480 pixels.
Your App should work on devices with this resolution.

- small: up to 480px
- medium: 481px up to 1024px
- large: 1025px and higher

# The `_.device` function

We extended underscore with a new function called `_.device`.
The `_.device()` function can be used to retrieve informations about the device.
For more details please see `ui/src/browser.js`.
The device class 'smartphone' is used to determine a mobile device and is detected by several criteria.
For more details please see `ui/src/browser.js`.

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

[How to setup remote debugging for Chrome on android devices with a mac](../miscellaneous/debugging-mobile-devices)
