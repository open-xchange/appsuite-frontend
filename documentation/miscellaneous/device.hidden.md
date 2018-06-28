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

Hint: the device function uses `_.browser` object for informations in combination with `_.screenInfo`

## Browsers

### Numeric versions

**chrome**

**firefox**

**ie**

**opera**

**phantomjs**

> hint: phantomjs is a headless WebKit used for testing

**safari**

### Boolean flags

**chromeios**

**webkit**

**uiwebview**

## Operating systems

### Numeric versions

**android**

**blackberry**

**ios**

### Boolean flags

**macos**

**windows**

**windowsphone**

## Display metrics

**small**

> max-width of 480px in portrait OR max-height of 480px in landscape

**medium**

> between small` and `large`

**large**

> min-width of 1025px

**retina**

**landscape**

> hint: information about device orientation may change during usage.

**portrait**

> hint: information about device orientation may change during usage.

### Shorthands

**smartphone**

> small devices AND running a mobile OS

**tablet**

> medium sized devices AND running a mobile OS (may can also cover some Phablets)

**desktop**

> all devices _NOT_ running a mobile OS

## Feature detection

**touch**

> supports touch events (usually covers only smartphones and tablets but may also covers some convertibles)

**emoji**

> has native emoji support

## Language

The current language code is defined as a variable.
To match any variant of the current language, the second part can be replaced by an asterisk.
E.g. if the current language is en_US, then the following variables would be defined:

```javascript
// us english
_.device('en_us')
// any english language variant
_.device('en_*')
```

## Miscellaneous

**standalone**

> was added to home screen and is running as standalone app now

# Examples

The simplest example is a single variable, e.g.

```javascript
_.device('smartphone')
```

```javascript
_.device('firefox')
```

or negated

```javascript
_.device('!android'))
```

or

```javascript
_.device('de_*')
```

or checks based on logical OR is also possible
```javascript
// other information, simple browser detection
_.device('safari || firefox')
```

Workarounds for specific older browsers can be enabled by testing for a specific version, e.g.

```javascript
_.device('ie && (ie < 11)')
```

The additional check for the correct browser is necessary because in other browsers, the variable ie evaluates to undefined, and the comparisons with numbers always return false.
This may or may not be what is desired, so an explicit check for the browser is less error-prone and easier to understand.

# Best practices

**Disable space consuming features**

Do not use `_.device('touch')` if you just want do disable something on small devices like a smartphone.
`touch` is really just a feature detection and will be true on convertibles as well.
The preferred way to disable features for "touch devices" in terms of smartphones is to use _.device('smartphone')
