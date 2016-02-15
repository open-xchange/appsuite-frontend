---
title: Style Guide
description: Our set of standards when writing code for open-xchange appsuite
source: http://oxpedia.org/wiki/index.php?title=AppSuite:UI_Development_Style_Guide
---

TODO: Link to eslint rule set

There lots of stuff we don't need to talk about because ESLint will bug you! (white space, formatting, undefined variables, globals, etc.)

_Eclipse seems to have a bug on MacOS that makes the editor really slow when showing white-spaces._
_However, as long as you configure Eclipse properly to use spaces instead of tabs and remove all trailing white-space on save (yep, there's a flag for that), you can leave that option turned off._

# Javascript coding guidelines

## Basic rules

#### Indentation is 4 spaces
No tabs! And there's no need for two consecutive empty lines. 
If possible turn on "show white-spaces" in your editor.

#### Use underscore's high-level functions (e.g. each, filter, map)
Because it's nice to read and it uses native code if available. 
For example, iterating an array via .each() is faster than a classic for-loop (in Chrome at least). 
Don't use jQuery's each (except for DOM nodes). 
If you need "break" you have to use a classic for-loop.

#### Don't make functions within a loop
For most cases, ESLint will bug you. 
But when using .each(), for example, it won't. 
However, you might still create functions over and over again - so avoid that. And if there no good reason, try to avoid creating nested sub functions (bit slower; might leak memory).

#### Require modules only when they're required!
Review your code if your module really needs all required modules upfront.
Check if some dependencies can be resolved at runtime, e.g. event handlers or functions that are working asynchronously.
_Hint: We patched require.js, so require() returns a deferred object._

#### Use jQuery's .on() and .off() instead of .bind() .unbind() .delegate()
Because the new event system of jQuery 1.7 was completely redesigned and bind/unbind are now marked as deprecated.

#### Use delegated event handlers if possible
Instead of adding tons of click handlers for each element, use one (!) delegate on the parent element (VGrid uses that technique for example).

#### Don't create global code
underscore.js is an exception. 
There some basic jQuery plugin that extend jQuery.fn (that's global as well).
Even for rarely used jQuery plugins create AMDs (Asynchronous Module Definition) and load them via require().

#### Naming
Use camelCase for variables (e.g. variableName). 
Use upper-case/underscores for constants (e.g. MAX_WIDTH). 
Use camel-case with upper-case first char for class names (e.g. ClassDefinition). 
Don't use special notations for jQuery-Objects: var node = $(…) is better than var $node = $(…);

#### Try to define all variables at the beginning of a function
And please just use one (!) "var" statement.
An exception could be if you plan to break from the control flow before doing an expensive call in the variable definition.

#### Use $.Deferred() whenever possible
Instead of using simple callbacks. 
Remember that your functions might need an error callback as well.
_Hint: You can use "return $.when();" instead of "return $.Deferred().resolve();"_

#### Use options instead of long argument lists
Avoid creating functions like foo("1234", true, null, null, cb_success). Instead use: foo({ folder: "1234", cache: true }).done(….);

#### Don't use ``$('<div style="float: left">Hello</div>')``
This is hard to read, hard to extend, doesn't allow i18n. 
Might become evil once 'Hello' is replaced by a variable (evil HTML injection). 
Just use ``$('<div>')`` plus proper helpers like css(), text() etc. 
In contrast: ``$('<div class="foo">')`` or ``$('<a href="#" tabindex="1">')`` is fine.

#### Use ``$('<div>')`` instead of ``$('<div/>')``
There's no need for XHTML.

#### Prefer ``$('<input>', { type: 'radio' });`` over ``$('<input>').attr('type', 'radio');``
Actually there's a semantic difference (not just syntax) - IE will teach you this! Never please write ``$('<label ...></label>')``, ``$('<div></div>')`` or even ``$('<input...></input>')``.

#### Try to write readable code - even if ESLint is already happy. 
Example: ``{ a: 1000, b: 2000 }`` has better readability than ``{a:1000,b:2000}``.

#### Don't COPY/PASTE code you don't understand!
Never ever do COPY/PASTE inheritance.
Always try to code stuff by yourself. 
Don't just imitate what others developed. 
If it looks like what you need, understand it first. 
If you can use it, try to really reuse it (define & require are your friends). If you need a slight modification, try to add that via options. 
Talk to the author if possible.

#### Of course… Don't repeat yourself!
Try to be smart. 
Look for patterns. 
Create local helper functions once you have to do stuff twice.

## Quotes

Use single quotes, unless you are writing JSON.


```javascript
// right
var foo = 'bar';
// wrong
var foo = "bar";
```

## Braces

Your opening braces go on the same line as the statement.

```javascript
// Right
if (true) {
  console.log('winning');
}
// Wrong
if (true)
{
  console.log('losing');
}
```

Also, notice the use of whitespace before and after the condition statement.

## Conditions

Any non-trivial conditions should be assigned to a descriptive variable:

```javascript
// Right
var isAuthorized = (user.isAdmin() || user.isModerator());
if (isAuthorized) {
  console.log('winning');
}

// Wrong
if (user.isAdmin() || user.isModerator()) {
  console.log('losing');
}
```

### Function length

Keep your functions short. 
A good function fits on a slide that the people in the last row of a big room can comfortably read. 
So don't count on them having perfect vision and limit yourself to ~10 lines of code per function.

### Return statements

To avoid deep nesting of if-statements, always return a functions value as early as possible.


```javascript
// Right
function isPercentage(val) {
  if (val < 0) {
    return false;
  }
  if (val > 100) {
    return false;
  }
  return true;
}

// Wrong
function isPercentage(val) {
  if (val >= 0) {
    if (val < 100) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

// Or for this particular example it may also be fine to shorten things even further
function isPercentage(val) {
  var isInRange = (val >= 0 && val <= 100);
  return isInRange;
}
```

### Creating instances


```javascript
// Simple one-time instances
var obj = { foo: 'bar' };

// Classes. Must start with upper camel case (JSHint will bug you):
var Klass = function () {
  var local = 'foo';
  this.doSomething = function () {
    // has access to private variable local
  };
};

// Do NOT use (except for really good performance reasons):
var Klass = function () {
  this.local = 'foo';
};
Klass.prototype.doSomething = function () {
};
```

# Commit log & Bugzilla

Please use the commit log to generally explain what has changed. 
We need to use a consistent notation for bugs:

```
Fixed: <just copy&paste bugzilla title>
Fixed: Bug 12345 - Nothing works, all broken
```

Uppercase "Fixed", a colon, a space. 
For L3 bugs, please add a short explanation (1-2 sentences) to your bugzilla comment. 
Separate that using a complete newline (because several git tools send commit messages as e-mails, where the first line is the subject and the following empty line denotes the begin of the message body). 
This helps QA a lot.

# Accessibility

Every plugin, module or package released for AppSuite should be accessible.




