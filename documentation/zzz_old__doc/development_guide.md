---
---


<h1>AppSuite UI Development Style Guide</h1>

<div style="width: 600px">

<p style="text-align: right">
<i>There lots of stuff we don't need to talk about because JSHint will bug you!
(white space, formatting, undefined variables, globals, etc.)</i>
</p>

<p>
<b>Indentation is 4 spaces</b><br/>
No tabs! And there's no need for two consecutive empty lines.
If possible turn on "show white-spaces" in your editor.
</p>
<p style="text-align: right">
<i>Eclipse seems to have a bug on MacOS that makes the editor really slow when
showing white-spaces. However, as long as you configure Eclipse properly to
use spaces instead of tabs and remove all trailing white-space on save
(yep, there's a flag for that), you can leave that option turned off.</i>
</p>

<p>
<b>Use underscore's high-level functions (e.g. each, filter, map)</b><br/>
Because it's nice to read and it uses native code if available.
For example, iterating an array via .each() is faster than a classic for-loop
(in Chrome at least). Don't use jQuery's each (except for DOM nodes).
If you need "break" you have to use a classic for-loop.
(see <a href="http://documentcloud.github.com/underscore/" target="_blank">Underscore</a>)
</p>

<p>
<b>Don't make functions within a loop</b><br>
For most cases, JSHint will bug you. But when using .each(), for example, it won't.
However, you might still create functions over and over again - so avoid that.
And if there no good reason, try to avoid creating nested sub functions
(bit slower; might leak memory).
</p>

<p>
<b>Require modules only when they're required!</b><br>
Review your code if your module really needs all required modules upfront.
Check if some dependencies can be resolved at runtime, e.g. event handlers or
functions that are working asynchronously.
</p>
<p style="text-align: right">
<i>Hint: We patched require.js, so require() returns a deferred object.</i>
</p>

<p>
<b>Use jQuery's .on() and .off() instead of .bind() .unbind() .delegate()</b><br>
Because the new event system of jQuery 1.7 was completely redesigned and
bind/unbind are now marked as deprecated.
(see <a href="http://api.jquery.com/on/" target="_blank">jQuery API: On</a>)
</p>

<p>
<b>Use delegated event handlers if possible</b><br>
Instead of adding tons of click handlers for each element, use one (!) delegate
on the parent element (VGrid uses that technique for example).
</p>

<p>
<b>Don't create global code</b><br>
underscore.js is an exception. There some basic jQuery plugin that extend
jQuery.fn (that's global as well). Even for rarely used jQuery plugins create
AMDs (<i>Asynchronous Module Definition</i>) and load them via require().
</p>

<p>
<b>Naming</b><br>
Use camelCase for variables (e.g. variableName). Use upper-case/underscores
for constants (e.g. MAX_WIDTH). Use camel-case with upper-case first char for
class names (e.g. ClassDefinition). Don't use special notations for jQuery-Objects:
var node = $(…) is better than var $node = $(…);
</p>

<p>
<b>Try to define all variables at the beginning of a function</b><br>
And please just use one (!) "var" statement.
</p>

<p>
<b>Use $.Deferred() whenever possible</b><br>
Instead of using simple callbacks. Remember that your functions might need an
error callback as well.
(see <a href="http://api.jquery.com/category/deferred-object/" target="_blank">jQuery API: Deferred</a>)
</p>
<p style="text-align: right">
<i>Hint: You can use "return $.when();" instead of "return $.Deferred().resolve();"</i>
</p>

<p>
<b>Use options instead of long argument lists</b><br>
Avoid creating functions like <i>foo("1234", true, null, null, cb_success)</i>.
Instead use: <i>foo({ folder: "1234", cache: true }).done(….);</i>
</p>

<p>
<b>Don't use $('&lt;div class="foo" style="float: left">Hello&lt;/div>')</b><br>
This is hard to read, hard to extend, doesn't allow i18n. Might become evil
once 'Hello' is replaced by a variable (evil HTML injection).
Just use <i>$('&lt;div>')</i> plus proper helpers like addClass(), css(), text() etc.
</p>

<p>
Use <b>$('&lt;div>')</b> instead of <b>$('&lt;div/>')</b> - there's no need for XHTML
</p>

<p>
Prefer <b>$('&lt;input>', { type: 'radio' });</b> over <b>$('&lt;input>').attr('type', 'radio');</b><br/>
Actually there's a semantic difference (not just syntax) - IE will teach you this!<br>
Never please write $('&lt;label ...>&lt;/label>'), $('&lt;div>&lt;/div>') or even $('&lt;input...>&lt;/input>')
</p>

<p>
<b>Try to write <b>readable</b> code - even if JSHint is already happy.</b><br>
Example: <i>{ a: 1000, b: 2000 }</i> has better readability than <i>{a:1000,b:2000}</i>.
</p>

<p>
<b>Don't COPY/PASTE code you don't understand!<br>
Never ever do COPY/PASTE inheritance</b><br>
Always try to code stuff by yourself. Don't just imitate what others
developed. If it looks like what you need, understand it first.
If you can use it, try to really reuse it (define & require are your friends).
If you need a slight modification, try to add that via options. Talk to
the author if possible.
</p>

<p>
<b>Of course… Don't repeat yourself!</b>
Try to be smart. Look for patterns. Create local helper functions once you
have to do stuff twice.
</p>


<h2>Quotes</h2>
<p>Use single quotes, unless you are writing JSON.</p>
<p><i>Right:</i></p>
<script type="text/example">
  var foo = 'bar';
</script>
<p><i>Wrong:</i></p>
<script type="text/example">
  var foo = "bar";
</script>

<h2>Braces</h2>
<p>Your opening braces go on the same line as the statement.</p>
<p><i>Right:</i></p>
<script type="text/example">
if (true) {
  console.log('winning');
}
</script>
<p><i>Wrong:</i></p>
<script type="text/example">
if (true)
{
  console.log('losing');
}
</script>
<p>Also, notice the use of whitespace before and after the condition
statement.</p>


<h2>Conditions</h2>
<p>Any non-trivial conditions should be assigned to a descriptive
variable:</p>
<p><i>Right:</i></p>
<script type="text/example">
var isAuthorized = (user.isAdmin() || user.isModerator());
if (isAuthorized) {
  console.log('winning');
}
</script>
<p><i>Wrong:</i></p>
<script type="text/example">
if (user.isAdmin() || user.isModerator()) {
  console.log('losing');
}
</script>

<h2>Function length</h2>
<p>Keep your functions short. A good function fits on a slide that the
people in the last row of a big room can comfortably read. So don't
count on them having perfect vision and limit yourself to ~10 lines of
code per function.</p>

<h2>Return statements</h2>
<p>To avoid deep nesting of if-statements, always return a functions
value as early as possible.</p>

<p><i>Right:</i></p>
<script type="text/example">
function isPercentage(val) {
  if (val < 0) {
    return false;
  }

  if (val > 100) {
    return false;
  }

  return true;
}
</script>
<p><i>Wrong:</i></p>
<script type="text/example">
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
</script>
<p>Or for this particular example it may also be fine to shorten things even further:</p>
<script type="text/example">
function isPercentage(val) {
  var isInRange = (val >= 0 && val <= 100);
  return isInRange;
}
</script>

<h2>Creating instances</h2>
<p>Simple one-time instances</p>
<script type="text/example">
var obj = { foo: 'bar' };
</script>

<p>Classes. Must start with upper camel case (JSHint will bug you):</p>
<script type="text/example">
var Klass = function () {
    var local = 'foo';
    this.doSomething = function () {
        // has access to private variable local
    };
};
</script>

<p>Do <b>NOT</b> use (except for really good performance reasons):</p>
<script type="text/example">
var Klass = function () {
    this.local = 'foo';
};
Klass.prototype.doSomething = function () {
};
</script>

<!-- --------------------------------------------- -->

<h1>Educate yourself</h1>

<b>JavaScript</b>
<ul>
<li><a href="http://www.youtube.com/watch?v=hQVTIJBZook" target="_blank">JavaScript: The Good Parts</a> (Video)<br>
Watch it if you don't know it! (yes, it's a one hour video)
</li>
</ul>

<b>API</b>
<ul>
<li><a href="http://oxpedia.org/index.php?title=HTTP_API" target="_blank">OX HTTP API</a><br>
Fetching mails, updating contacts should be no black art for you.
</li>
</ul>

<b>Frameworks / Libs</b>
<ul>
<li><a href="http://api.jquery.com/" target="_blank">jQuery's API</a><br>
Mandatory. You should really know why it's great. Use it!
</li>
<li><a href="http://documentcloud.github.com/underscore/" target="_blank">underscore.js</a><br>
Get familiar with each(), map(), filter() and use it!
</li>
<li><a href="http://requirejs.org/" target="_blank">require.js</a><br>
Don't just copy/paste other modules. You should understand the idea of AMD loaders.
</li>
<li><a href="http://www.modernizr.com/" target="_blank">Modernizr</a><br>
You don't have to use that much - but please be aware of it and don't add your own test.
</li>
</ul>

<b>Performance</b>
<ul>
<li><a href="http://www.youtube.com/watch?v=mHtdZgou0qU" target="_blank">Speed up your JavaScript</a> (Video)<br>
Watch it. Should be no surprise to you.
</li>
<li><a href="http://www.bookofspeed.com/index.html" target="_blank">Book of Speed</a><br>
Nice overview about lots of performance relevant issues.
</li>
</ul>

<b>CSS / Theming</b>
<ul>
<li><a href="http://lesscss.org/" target="_blank">less.js</a><br>
Nice to know. Mandatory if you have to create theme.
</li>
</ul>



</div>
