---
title: Hands-on introduction
description: Extension points are an architecture for letting plugins contribute functionality to other parts of the program
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Extending_the_UI_(Hands-on_introduction)
---

Abstractly speaking extension points are an architecture for letting plugins contribute functionality to other parts of the program. 
They form the core of the OX App Suite plugin architecture. 
This is a hands-on introduction based on simple code examples. 
For more details take a look at Extending the UI.

# Extending the UI

In case you want try code by your own please follow these steps:

- get a appropriate browser to execute custom javascript during runtime (for example chrome with it's developer tools)
- login on OX App Suite
- copy code from beyond to you console and execute
- perhaps it could be necessary to switch app or reload the page

## Your first extension

Let's start with some example code.

```javascript
 // The extension point system lives in the
 // 'io.ox/core/extensions' module
 require(["io.ox/core/extensions"], function (ext) {
  
     // An extension point represents the system that can be extended
     // It has an id (in this case 'io.ox/mail/detail')
     var point = ext.point("io.ox/mail/detail");

     // Now, let's extend that extension point. Every extension point
     // has some kind of contract about what it expects its extensions to provide.
     // In this case, the extension is supposed to provide a draw method
     // and is passed the node to draw into as the 'this' variable
     point.extend({
         id: 'example1', // Every extension is supposed to have an id
         index: 1, // Extensions are ordered based on their indexes
         draw: function () {
             // This function is called by the part of the code that
             // offers this extension point
             this.append($("<h3>").text("Hello, Traveller!"));
         }
     });
 });
```

Please have a look at the detail view of a mail now. 
Perhaps you have to select another mail to see the difference.

_step 1: default mail detail_

![](01_introduction-01.png)

_step 2: execute code in chrome dev tools console_

![](01_introduction-02.png)

_step 3: extended mail detail_

![](01_introduction-03.png)

## A qualified mail footer

Let's try and add a section to the mails detail view and use some data of the currently viewed mail. 
For information about the baton object please take a look at the more detailed article how to extend the UI.


```javascript
require(['io.ox/core/extensions'], function (ext) {
    ext.point("io.ox/mail/detail").extend({
        id: "lessonExample",
        index: 300,
        draw: function (baton) {
            var data = baton.data;
            this.append("<br>");
            this.append($("<em>").append(
                $.txt("The eMail '"),
                $("<b>").text(data.subject),
                $.txt("' was brought to you by: "),
                $("<b>").text("Your Name Inc.")
            ));
        }
    });
});
```

Again: When navigating back to the email view you might have to select another mail to make this change visible.


_step 1: default mail detail_

![](01_introduction-04.png)

_step 2: execute code in chrome dev tools console_

![](01_introduction-05.png)
 
_step 3: mail detail with disabled inline links_

![](01_introduction-06.png)

After switching to the mail app again, you might have to select another mail to once again run through the rendering process that calls on the extensions.
As you can see in the example above, the code calling the extension passes along the eMail in the data attribute of the baton parameter.
The _index_ of the extension means that it is rendered after the mail body, who's extensions index is __300__.
Currently (until we have more comprehensive documentation) you can only find the indexes (and the way an extension is supposed to behave) by reading our code.
Reload the page (to clear out the registered extensions) and try switching the index to __190__ and see where the added sentence shows up now.

# Customizing the UI

Since extensions are a property of the runtime system, you can also modify them. 
The extension system offers a couple of things you can do with existing extensions like __changing their order, disabling them or replacing them__. 
Let's look at how to accomplish all of these, again by modifying the mail detail view.

## switch off inline links


```javascript
require(["io.ox/core/extensions"], function (ext) {
    // Here the id of the extension comes into play again.
    // If you look at the code of the mail detail view (in io.ox/mail/view-detail)
    // You can see the extension registers itself with the id 'inline-links'
    // So that is the argument we pass to disable
    ext.point("io.ox/mail/detail").disable('inline-links');
});
```

Again: When navigating back to the email view you might have to select another mail to make this change visible.

_step 1: default mail detail_

![](01_introduction-07.png)

_step 2: execute code in chrome dev tools console_

![](01_introduction-08.png)

_step 3: mail detail with disabled inline links_

![](01_introduction-09.png)

## replace the way time is rendered


```javascript
require(["io.ox/core/extensions", "io.ox/mail/util", "io.ox/core/date"], function (ext, util, date) {
    ext.point("io.ox/mail/detail/header").replace({
        //current extension will extended not fully replaced
        // so we do not have to specify the index to keep time on it's place 
        id: 'receiveddate', // The extension we want to replace has this id as well
        draw: function (baton) {
            var data = baton.data;
            //show unix timestamp (plus trailing '000' for milliseconds )
            var timeToRender = (data.received_date || data.sent_date || 0);
            this.append(
                $('<div>').addClass('date list').text(timeToRender)
            );
        }
    });
});
```

_step 1: default mail detail_

![](01_introduction-10.png)

_step 2: execute code in chrome dev tools console_

![](01_introduction-11.png)

_step 3: extended mail detail with unix timestamp_

![](01_introduction-12.png)

## change order

And now let's switch the order around:


```javascript
require(["io.ox/core/extensions"], function (ext) {
    // From the extension point 'io.ox/mail/detail' get the extension with
    // the id 'subject' (which is passed to the callback)
    ext.point("io.ox/mail/detail/header").get("subject", function (extension) {
        // Put it last
        extension.index = 300;
    });
});
```


_step 1: default mail detail_

![](01_introduction-13.png)

_step 2: execute code in chrome dev tools console_

![](01_introduction-14.png)

_step 3: pushed subject to header bottom_

![](01_introduction-15.png)

# Trouble finding the right extension point?

You don't know where to append your plugin's content / which extension point you should use? 
A good way to find the suitable extension point, is to search in the OX Source Code for an HTML-element displayed in the user interface. 
For example an easy to identify text. 
Once found the HTML-element in the source, you can see which extension point was used appending this element to the UI and append your content there aswell.
