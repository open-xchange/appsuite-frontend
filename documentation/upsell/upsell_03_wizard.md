---
title: Wizards
---

# Upsell wizard

Customers usually want to offer context-sensitive content in an IFRAME if the upsell is triggered.
Therefore, OX App Suite comes with an integrated but optional plugin that takes care of this.
Just enable `plugins/upsell/simple-wizard` by setting the capability simple-wizard server-side (or by adding *&cap=simple-wizard* to the URL for testing/development purposes).

This plugin registers for the event 'upsell:requires-upsell', opens a modal popup/layer, and loads a custom URL in an embedded IFRAME.

The upsell wizard is a small shopping cart application that displays packages/services.

They process is the usual three-step process of putting items in your cart, reviewing and ordering them.
Upon completion the upsell wizard calls an URL with the ordered items as well as the shoppers's ID and context number.
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

The price format is given as format string to provide maximum flexibility. '%s' represents the amount.

The target is the URL that is called after shopping is completed.
The values OXUPSELLCART, OXUPSELLCONTEXT and OXUPSELLUSER are replaced by the wizard with a comma-separated list of the ids of items bought, the buyer's context ID and their user ID.

The disclaimer can be internationalized like texts for upsell widgets.
The same possibilities and restrictions apply.

Products shown can also be country-specific.
If only one locality (here: en_US) is given, that is always picked.

A product consists of an image (displayed on the left), a title (on the right), a description and a price value.
The description can, as usual, be marked up as HTML.


## Settings

In order to configure this server-side, just create a new file `upsell.properties` or append to existing `appsuite.properties` (mind the double-slash; this is not a typo!).


```javascript
plugins/upsell/simple-wizard//url=blank.html?user=$user,user_id=$user_id,context_id=$context_id
plugins/upsell/simple-wizard//overlayOpacity=0.5
plugins/upsell/simple-wizard//overlayColor=black
plugins/upsell/simple-wizard//zeroPadding=true
plugins/upsell/simple-wizard//width=750
plugins/upsell/simple-wizard//height=390
plugins/upsell/simple-wizard//closeButton=true
```

| Settings       | Description                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------- |
| url            | Custom URL that is loaded in IFRAME; can contain special variables.                               |
| overlayOpacity | CSS opacity value for overlay; default is 0.5                                                     |
| overlayColor   | CSS background color for overlay; default is black                                                |
| zeroPadding    | If true (default) there is no inner padding inside modal dialog, i.e. the IFRAME covers the popup |
| width          | Width of outer popup (not IFRAME) in pixel                                                        |
| height         | Height of IFRAME in pixel                                                                         |
| closeButton    | If true (default) the wizard shows its own close button                                           |

**Note**: Changing such settings requires a backend restart

## Custom URL variables
The upsell wizard offers a set of variables that help providing context-sensitive content.
$missing is probably the most prominent one.
Other variables help identifying the user. An example:

```javascript
upsell.php?user_id=$user_id&context_id=$context_id&language=$language&missing=$missing
```

| Settings    | Description                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Variable    | Description                                                                                                        |
| $context_id | context_id of current user                                                                                         |
| $hostname   | hostname of current session, e.g. www.one-of-countless-virtual-hosts.com                                           |
| $id         | The trigger's identifier, e.g. "io.ox/files". Can refer to an app, an inline action, or a portal plugin. See $type |
| $language   | The current user's language, e.g. de_DE or en_US                                                                   |
| $mail       | The current user's primary email address                                                                           |
| $missing    | The set of missing capabilities, comma separated, e.g. "files"                                                     |
| $session    | The current user's session id                                                                                      |
| $type       | Either app, inline-action, or portal-widget. Describes what triggered the upsell. See $id                          |
| $user       | The current user's login name (can include context name, i.e somebody@foo)                                         |
| $user_id    | The current user's numeric id                                                                                      |
| $user_login | The current user's login (usually without context name)                                                            |

## Development and debugging

While experimenting or developing, you can use the following helpful functions:

```javascript
// get plugin (this must be properly loaded, otherwise you get a runtime error)
var wizard = require('plugins/upsell/simple-wizard/register');

// if you have no chance to enable this plugin server-side, use the following approach
   // but don't use this in production plugins, it's just a hack for console:
   // if you don't know the difference please take a look at
   // http://requirejs.org/docs/errors.html#notloaded
var wizard; require(['plugins/upsell/simple-wizard/register'], function (w) { wizard = w; });

// get variables (optional: options from upsell:require-upgrade event)
wizard.getVariables({ type: 'app', id: 'io.ox/files', missing: 'files' });

// get URL (optional: options from upsell:require-upgrade event)
   // replaces placeholders ($foo) by variable values
wizard.getURL({ type: 'app', id: 'io.ox/files', missing: 'files' });

// get all settings (can be changed on the fly)
console.log(wizard.settings);

// global upsell events; parameters: (e, popup)
ox.on('upsell:simple-wizard:show:before', _.inspect);
ox.on('upsell:simple-wizard:show', _.inspect);
ox.on('upsell:simple-wizard:close', _.inspect);

// special event to customize settings (e, variables, settings)
   // triggered before creating dialog instance;
   // 2nd parameter has variables like type, missing, user_id etc.
   // 3rd parameter refers to a local copy of wizard settings
ox.on('upsell:simple-wizard:init', _.inspect);

// open wizard manually
wizard.open();

// close wizard manually
wizard.close();

// disable wizard (unregisters upsell event)
wizard.disable();

// and of course: enable wizard (registers for upsell event)
wizard.enable();
```

Some examples for customizations in UI plugin/console:

```javascript
// get plugin (this muse be properly loaded, otherwise you get a runtime error)
var wizard = require('plugins/upsell/simple-wizard/register');

// extend IFRAME constructor (see http://underscorejs.org/#compose)
var custom = function (iframe) {
  return iframe.css({ border: '5px solid #08c', boxSizing: 'border-box' });
};
wizard.getIFrame = _.compose(custom, wizard.getIFrame);

// use an event to customize the IFRAME
ox.on('upsell:simple-wizard:show:before', function (e, popup) {
  popup.getContentNode().find('iframe')
    .css({ border: '5px solid #08c', boxSizing: 'border-box' });
});
```

## Close function

The upsell wizard can easily be closed via javascript or by redirecting the IFRAME to a prepared HTML page.
In order to see this in action, run the following code (step by step):

```javascript
// get plugin (this must be properly loaded, otherwise you get a runtime error)
var wizard = require('plugins/upsell/simple-wizard/register');

// open wizard
wizard.open();

// redirect now
wizard.setSrc('apps/plugins/upsell/simple-wizard/close.html');
```

Custom backend systems that run [on a different domain cannot use javascript](http://en.wikipedia.org/wiki/Cross-site_scripting) to close the wizard.

However, such systems can redirect to close.html.
Since this page is part of the UI and therefore located on the same domain, it is allowed to call the wizard's close function.





# Welcome wizard
You are able to use the Welcome Wizard in order to include upsell as well as cross-sell content. For more information please see [Writing a wizard]({{ site.baseurl }}/ui/customize/welcome-wizard.html)
