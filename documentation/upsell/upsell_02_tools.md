---
title: Tools
---

The following features inside OX App Suite can be used to integrate additional cross-& upsell opportunities.

# Custom app

You are able to add an app to the app launcher which is completely customized. Icon, name as well as URL can be included and link to the upsell wizard as well as to an external page.
For more technical information please see [here]({{ site.baseurl }}/ui/customize/app/simple-application-iframe.html#add-app-to-launcher.)


# Widget

The widget is a widget displayed inside the portal and can show images, text or combinations thereof. A widget can contain several "slides".

A click on the widget can start the upsell wizard. There can be more than one widget for cross-& upsell but remember not to annoy your customer with too many advertisement.

The upsell widgets can be moved, but not removed from the portal and needs two different configurations:

```yaml
 io.ox/portal//widgets/protected:
   upsellads_0:
     plugin: "plugins/portal/upsellads/register"
     type: "upsellads"
     index: 0
     changeable:
       index: true
     props:
       ad: "openexchangeAdvertisement"
```

This part defines a widget as protected.
This is not upsell-specific, it is [an option for every kind of portal widget](http://oxpedia.org/wiki/index.php?title=AppSuite:Configuring_portal_plugins).

The upsell-specific part is the value of "props/ad", which identifies the content via the name "openexchangeAdvertisement".
That name points to another part of the YAML file that looks like this:

```yaml
 plugins/upsell//ads:
   delayInMilliseconds: 10000
   openexchangeAdvertisement:
     upsellWizard: "shop"
     slides:
       en_US:
         slide1:
           type: text-bottom
           image: 'https://image1'
           text: 'Awesome stuff'
         slide2:
           type: text-top
           image: 'https:image2'
           text: 'More awesome stuff'
```

What you can see here is that an advertisement consists of several slides.
Due to some peculiarities of the OX App Suite YAML parser, you have to name them "slide?" with a number and cannot use an array.
The slides will be sorted alphabetically, so if you plan to use more than 10 slides, remember to pad the number with enough zeros, the first slide being 00, the second being 01.

Slides can be provided in different languages.

This example provides slides only for en_US.
The slides need to match the user language exactly (sorry, no smart guessing so that British users with en_UK get the en_US version).
The system defaults to en_US when no appropriate language can be found.

The delayInMilliseconds represents the transition time from one slide to the next.

The text can contain HTML and is inserted via the innerHtml method of JQuery in case you feel the need for markup.

The value of "image" is put into the src attribute of an `<img/>` element, so you can use a local path as well as a URL.

The type can be one of text-top, text-bottom, text-only and image-only.
Text usually takes up a third of an ad that also contains an image.
Text and image are cut off in case they exceed the space.

For additional information see article about [Portal Widgets]({{ site.baseurl }}/ui/customize/portal-widget.html).

# Guided tour

In order to cross-/upsell right from the beginning, the guided tour can be used to walk the end user trough the OX App Suite UI as well as show/point out upsell/cross-sell opportunities (trigger).

# Bubbles

Bubbles are little popups based on hopscotch, similar to the guided tours.
They show up after a given amount of time and point to a defined UI element to display some text.
Clicking on them can start the upsell wizard (unless you click "cancel", of course).

```yaml
 plugins/upsell//bubbles:
   skipFirstLogin: true
   repeatInMilliseconds: 900000
   repeatPerLogins: 1
   bubbles:
     en_US:
       bubble1:
         app: 'io.ox/portal'
         content: "Did you know...?"
         startDate: '2013-07-01'
         endDate: '2019-06-31'
```

Upsell bubbles appear after the amount of time in repeatInMilliseconds has passed.
They can be set up not to bother the first time user (skipFirstLogin) and only to show up repeatPerLogins-times every login.

As with upsell widgets, they can be internationalized, this example only contains a version for American English (en_US).
The name must match the user locality exactly.

You can have several bubbles but each bubble needs to point to one application.
Moreover, each bubble can be set up to be valid only during a certain time span (or from a date, or to a date), but this can be omitted.
