---
title: Upsell tools
description: Several ways of promoting applications and other upgrades for App Suite. 
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Upsell_tools
---

# The Upsell Widget

The Upsell widget is a widget displayed on the portal. 
It can show images, text or combinations thereof. 
A widget can contain several "slides". 
A click on the widget starts the Upsell Wizard. 
There can be more than one Upsell Widget (just remember not to annoy your customer with too many!). 
Upsell widgets can be moved, but not removed from the portal.

The Upsell Widget needs two different configurations:

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
Due to some peculiarities of the App Suite YAML parser, you have to name them "slide?" with a number and cannot use an array. 
The slides will be sorted alphabetically, so if you plan to use more than 10 slides, remember to pad the number with enough zeros, the first slide being 00, the second being 01.

Slides can be provided in different languages. 
This example provides slides only for en_US. 
The slides need to match the user language exactly (sorry, no smart guessing so that British users with en_UK get the en_US version). 
The system defaults to en_US when no appropriate language can be found.

The delayInMilliseconds represents the transition time from one slide to the next.

The text can contain HTML and is inserted via the innerHtml method of JQuery in case you feel the need for markup.

The value of "image" is put into the src attribute of an ``<img/>`` element, so you can use a local path as well as a URL.

The type can be one of text-top, text-bottom, text-only and image-only. 
Text usually takes up a third of an ad that also contains an image. 
Text and image are cut off in case they exceed the space.

# The Upsell Bubbles

Upsell bubbles are little popups based on hopscotch, similar to the [guided tours](TODO). 
They show up after a given amount of time and point to a defined UI element to display some text. 
Clicking on them starts the Upsell Wizard (unless you click "cancel", of course).

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

As with Upsell Widgets, they can be internationalized, this example only contains a version for American English (en_US). 
The name must match the user locality exactly. 
You can have several bubbles.

Each bubble can be set up to be valid only during a certain time span (or from a date, or to a date), but this can be omitted. 
Each bubble needs to point to one application.

# The Upsell Wizard

The Upsell Wizard is a small shopping cart application that displays things that can be sold. 
They process is the usual three-step process of putting items in your cart, reviewing them and ordering them. 
Upon completion the Wizard calls an URL with the ordered items as well as the shoppers's ID and context number. 
It is left to the provider to implement some handler for that.


```yaml
 plugins/upsell//shop:
   priceFormat: '$%sUSD'
   target: 'http://localhost/order-confirmation?cartContents=OXUPSELLCART&context=OXUPSELLCONTEXT&user=OXUPSELLUSER'
   disclaimer:
     en_US: 'You're going to sell your soul to us'
 products:
   en_US:
     p0:
       image: 'https://product-image1'
       title: 'All - special offer'
       price: 99
       description: 'This Special Offer is only for a limited time. '
```

The price format is given as format string to provide maximum flexibility. %s represents the amount.

The target is the URL that is called after shopping is completed. 
The values OXUPSELLCART, OXUPSELLCONTEXT and OXUPSELLUSER are replaced by the Wizard with a comma-separated list of the ids of items bought, the buyer's context ID and their user ID.

The disclaimer can be internationalized like texts for upsell widgets and bubbles. 
The same possibilities and restrictions apply.

Products shown can also be country-specific. 
If only one locality (here: en_US) is given, that is always picked.

A product consists of an image (displayed on the left), a title (on the right), a description and a price value. 
The description can, as usual, be marked up as HTML.

# Making all of it work

The configuration for all three elements is done in YAML instead of JavaScript, assuming that most users of this feature are not developers but from marketing or sales departments. 
They will probably need starting help from a sysadmin, though, as by default, the whole Upsell process is disabled two-fold:

The configuration file is not deployed. 
To do so, one needs to create one in the settings subfolder of the server configuration. 
This is usually _/opt/openexchange/etc/settings_. 
And example can be found in the UI folder as upsell-examples.yml
The capability is not enabled. It is called "upsell" and, well, needs to be enabled.
After that, a server restart (necessary for every config change, sorry!) and some hard refreshing to get rid of eventual caching artefacts, you are good to go!
I
