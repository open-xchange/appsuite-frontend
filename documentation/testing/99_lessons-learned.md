---
title: Lessons learned
description: Lessons learned painfully while doing testing
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Test_basics
---

# Lessons learned painfully while doing testing:

- PhantomJS thinks it is a __touch__ device (Modernizr.touch === true)
- Almost no CSS is loaded. Don't rely on classes like "hidden" (bootstrap class)
- Turn off CSS transitions - any DOM-based test might fail (caused by random DOM reflow delay)
- Don't clear <body> (e.g. $(document.body).empty()). UI is not robust against that.
    - instead attach a new element to the body (or anywhere else) and remove it afterwards
- The browser window is elastic. It has no fixed size. Usually affects scrolling tests.
- If weird things happen, try to check if your app/window/node is really still in the DOM.
- HTML fixtures cannot be loaded (don't know why yet); just rename your files to *.txt
- Please mind that your fake server only works inside "description" (not across specs)
- PhantomJS fails at: Date.parse("2012-01-01"); (see [code.google.com/p/phantomjs/issues/detail?id=267#c2](https://code.google.com/p/phantomjs/issues/detail?id=267#c2))
- The fake server is global, if someone has registered your desired api/call already, your response will never get send
    - it is possible to use this.server.responses.filter to remove another problematic response implementation
- Any checks for z-index will probably fail due to the lack of loaded CSS. If an element is not positioned (relative or absolute) the computed style is "auto". Just reposition affected elements in your spec.

# Testing on windows

A small and incomplete collection of things, that might work different on a windows machine:

- the UI relies on zonefiles being installed on the system, this is the case for mac and linux environments, but not on windows
    - it should be possible to install the zonefiles manually and make karma serve those

# Fixtures

- using 0 as identifier value (id, user_id, etc.) could cause unexpected system behavior
