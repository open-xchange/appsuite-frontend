---
title: _.device()
description: The function _.device() is used to test various device-specific aspects of the runtime environment.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Device_reference
---

It is also used to evaluate the device clause of manifest entries.

# Syntax

The single parameter of the function is a string describing the test to perform. 
The string is evaluated as a JavaScript expression which uses one or more pre-defined variables. 
The result is then always converted to a boolean value. 
Empty strings and other 'falsy' values evaluate to true. 
While the implementation currently simply uses the native JavaScript interpreter, only parentheses, boolean operators and numerical comparisons are guaranteed to actually work.

# Variables

This section lists the supported variable names which can be passed to `_.device()`.
The current list of variables and their values can be displayed by calling `_.device()` without arguments in the browser's JavaScript console.
All variables are case-insensitive, and by convention are lower-case.

While all variables can be used as boolean flags, most variables representing browsers and operating systems are actually numbers and can be used to check for specific browser or OS versions. 
The remaining browser and OS variables can become numbers in the future, too. The numbers are usually integers, i.e. they contain only the major version number.

## Browsers

**Numeric versions**

- ie
- opera
- safari
- phantomjs
- chrome
- firefox

**Boolean flags**

- webkit
- chromeios
- uiwebview

## Operating systems

**Numeric versions**

- blackberry
- ios
- android

**Boolean flags**

- windowsphone
- macos
- windows

## Display metrics

- small (up to 480px)
- medium (481px to 1024px)
- large (1025px and more)
- landscape
- portrait
- retina
- smartphone
- tablet
- desktop

## Language

The current language code is defined as a variable. 
To match any variant of the current language, the second part can be replaced by an asterisk. 
E.g. if the current language is en_US, then the following variables would be defined:

- en_us
- en_*

## Miscellaneous

- touch
- standalone
- emoji

# Examples

The simplest example is a single variable, e.g.

```javascript
_.device('smartphone')
```

```javascript
_.device('firefox')
```

or

```javascript
_.device('de_*')
```

Workarounds for specific older browsers can be enabled by testing for a specific version, e.g.

```javascript
_.device('ie && (ie < 11)')
```

The additional check for the correct browser is necessary because in other browsers, the variable ie evaluates to undefined, and the comparisons with numbers always return false. 
This may or may not be what is desired, so an explicit check for the browser is less error-prone and easier to understand.
