---
title: Upsell
---

This section is mainly for UI developers and introduces the concept of upsell from a technical point of view.

In short: End user have a set of so-called capabilities.

UI, however, offers functionality beyond that limited set for promotion purposes e.g. inline links, that require missing capabilities, trigger an in-app upsell. This process leads to a trial period or a new subscription.

Technical challenge for the UI developer is to check what the end user has, what can be shown beyond that, and how to handle upsell.
It is also possible for hosting companies to easily integrate their own online shop since the internal mechanisms are loosely coupled via events.

# Upsell Enablement

In order to configure upsell server-side, create a new file `upsell-appsuite.properties`
or append to existing file `appsuite.properties` (mind the double-slash; this is not a typo!).

If you configure upsell in the `upsell-appsuite.properties`, the properties are loaded when you trigger the live reload function.

```javascript
io.ox/core//upsell/enabled/infostore=true
io.ox/core//upsell/enabled/portal=true
io.ox/core//upsell/enabled/tasks=true
```

Each line enables a specific [capability](../customize/manifests.html#capabilities) for upsell.
That means whenever a feature misses one of these capabilities, a special upsell related event is triggered.

**Note**: For simple demo purposes, you can enable an internal upsell configuration by appending *&demo=upsell* to the URL and reload the specific page.


# Upsell Trigger
In the following, all custom triggers are listed as well as how they can be configured.


| ID                          | Configuration                              | Text | Default capabilities              | Description                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | ----------------------------------- | ----- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| secondary-launcher          | icon, color                         | title | active_sync or caldav or carddav  | This trigger is located in the secondary toolbar next to the App Launcher. Icon, Text and color can be customized. Due to space limitations, the trigger is not shown on mobile devices.                                                                                                                                             |
| folderview/mail             | icon, color                         | title | active_sync                       | This trigger is located below the folderview of the mail app/module.                                                                                                                                                                                                                                                                                                                                                   |
| folderview/mail/bottom^1      | color                               | title | active_sync                       | This trigger is located at the bottom of the folderview of the mail app/module in the premium area. This trigger is styled as button with the default text 'Try now' and has no icon by default.                                                                                                                                                                                                              |
| folderview/contacts         | icon, color                         | title | carddav                           | This trigger is located below the folderview of the addressbook app/module.                                                                                                                                                                                                                                                                                                                                        |
| folderview/contacts/bottom^1  | color                               | title | carddav                           | This trigger is located at the bottom of the folderview of the contacts app/module in the premium area. This trigger is styled as button with the default text 'Try now' and has no icon by default.                                                                                                                                                                                                          |
| folderview/calendar         | icon, color                         | title | caldav                            | This trigger is located below the folderview of the calendar app/module.                                                                                                                                                                                                                                                                                                                                            |
| folderview/calendar/bottom^1  | color                               | title | caldav                            | This trigger is located at the bottom of the folderview of the calendar app/module in the premium area. This trigger is styled as button with the default text 'Try now' and has no icon by default.                                                                                                                                                                                                          |
| folderview/infostore/bottom^1 | color                               | title | boxcom or google or msliveconnect | This trigger is located at the bottom of the folderview of the drive app/module in the premium area. This trigger is styled as button with the default text 'Try now' and has no icon by default.                                                                                                                                                                                                             |
| topbar-dropdown             | icon, color                         | title | active_sync or caldav or carddav  | This trigger is located on the first position of the dropdown in the secondary toolbar. It contains text and an icon.                                                                                                                                                                                                                                                                                  |
| portal-widget               | imageURL, removable (boolean), icon | title | active_sync or caldav or carddav  | This trigger adds a draggable Portal Widget with default text to the OX App Suite Portal. You can add a background image with 'imageURL'; If no image is used, the widget displays the text centered with a customizable space separated list of font-awesome icons. This widget is not removable by default; you have to  set ‘removable’ to true. |
| mail-folderview-quota       | upsellLimit, icon, color            | title | active_sync or caldav or carddav  | This trigger is appended below the folderview and has no icon by default. You can set the upsell limit in Bytes. If the maximum mail quota is larger than upsell limit, the trigger will not be shown.                                                                                                                                                  |

^1 These upsell trigger are placed inside the premium area at the bottom of the folderview. Therefore, these upsell trigger are only shown if the premium area is enabled. You can enable it by setting *io.ox/core//upsell/premium/folderView/visible=true*.


## Visibility of Trigger

The OX App Suite provides several upsell trigger which can be configured via settings, since upsell trigger compared to the usual links would require custom UI development.

If you configure the upsell settings, the custom upsell trigger will be enabled by default. Those trigger will appear when the expression of required [capability](../customize/manifests.html#capabilities) is not satisfied and the required set of upsell trigger is satisfied.

To clearify, when triggers are shown or not, we proceed with an example:

A hoster can provide a custom upsell trigger in the secondary toolbar (next to the App Launcher). This upsell trigger should promote a premium account to the user and has the default requirement of *active_sync* or *caldav* or *carddav*.
That means, if one of those capability is not set for a user and upsell is activated for *active_sync* and *caldav* and *carddav*, the upsell trigger will be shown.

You can enable upsell for those [capability](../customize/manifests.html#capabilities) inside an existing or new file `.properties` with

```javascript
io.ox/core//upsell/enabled/active_sync=true
io.ox/core//upsell/enabled/caldav=true
io.ox/core//upsell/enabled/carddav=true
```

Note: You have to restart the server so that the changes take place.

If the user clicks on the upsell trigger, a upsell event of type 'custom' with id 'secondary-toolbar' is triggered so that the page/dialog which opens can react depending on the clicked link.


**Visibility based on capabilities**

If you want certain upsell trigger to appear on different capabilities, you can configure this inside the `.properties` file.

Therefore, you have to configure the required field with a logical expression of capabilities for the trigger. If the actual capabilities does not satisfy the expression and the upsell capabilites satisfies the expression, the upsell trigger will be drawn.

See the following example which requires *eas* and *caldav* or not *carddav*.
```
io.ox/core//features/upsell/$id/requires="active_sync && (caldav || !carddav)"
```

**Disable individual trigger**

If you want to disable a custom upsell trigger, you can add
```javascript
io.ox/core//features/upsell/$id/enabled=false
```
to the `.properties` file.


## Customize Appearance

**Change default icon**

All custom upsell trigger have a 'fa-star' as default icon. You can change the default icon to any font-awesome icon or a set of space separated icons.
```
io.ox/core//upsell/defaultIcon="fa-star"
```

**Change single icon**

You can replace the icon of individual trigger with
```
io.ox/core//features/upsell/$id/icon="fa-star"
```
where '$id' is the id of the upsell trigger.

**Change color for individual trigger**

You can change the color of some upsell trigger with
```
io.ox/core//features/upsell/$id/color="#f00"
```
where '$id' is the id of the upsell trigger and the color can be any css color.

**Change text**

Some of the custom upsell trigger use a title (or other strings) which a hoster could customize. You can provide your own text via
```
io.ox/core//features/upsell/$id/i18n/$lang/title="A custom title"
```
where '$lang' is the current language identifier (e.g. "en_US"). **Note**: It is important, that several translations are provided.

You can see the current language identifier when you open the webconsole and type
```
ox.language
```

## Upsell Feature Toggles

App Suite UI offers different feature toggles. These toggles control the appearance of different features in the UI. Find upsell toggles [here]({{ site.baseurl }}/ui/configuration/settings-list-of.html#upsell.)

# Upsell Widget

The Upsell widget is a widget displayed inside the portal and can show images, text or combinations thereof. A widget can contain several "slides".

A click on the widget starts the Upsell Wizard. There can be more than one Upsell Widget (just remember not to annoy your customer with too many!).

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

For additional information see [Portal Widgets]({{ site.baseurl }}/ui/customize/portal-widget.html).

# Upsell Bubbles

Upsell bubbles are little popups based on hopscotch, similar to the [guided tours](../components/wizards/guided-tours.html).
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

You can have several bubbles but each bubble needs to point to one application.
Moreover, each bubble can be set up to be valid only during a certain time span (or from a date, or to a date), but this can be omitted.


# Upsell Wizard

Customers usually want to offer context-sensitive content in an IFRAME if the upsell is triggered.
Therefore, OX App Suite comes with an integrated but optional plugin that takes care of this.
Just enable `plugins/upsell/simple-wizard` by setting the capability simple-wizard server-side (or by adding *&cap=simple-wizard* to the URL for testing/development purposes).

This plugin registers for the event "_upsell:requires-upsell_", opens a modal popup/layer, and loads a custom URL in an embedded IFRAME.

The Upsell Wizard is a small shopping cart application that displays packages/services.

They process is the usual three-step process of putting items in your cart, reviewing and ordering them.
Upon completion the Upsell Wizard calls an URL with the ordered items as well as the shoppers's ID and context number.
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
The values OXUPSELLCART, OXUPSELLCONTEXT and OXUPSELLUSER are replaced by the Wizard with a comma-separated list of the ids of items bought, the buyer's context ID and their user ID.

The disclaimer can be internationalized like texts for upsell widgets and bubbles.
The same possibilities and restrictions apply.

Products shown can also be country-specific.
If only one locality (here: en_US) is given, that is always picked.

A product consists of an image (displayed on the left), a title (on the right), a description and a price value.
The description can, as usual, be marked up as HTML.


## Settings

In order to configure this server-side, just create a new file `upsell.properties` or append to existing `appsuite.properties` (mind the double-slash; this is not a typo!).


```
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

### Custom URL variables

The upsell wizard offers a set of variables that help providing context-sensitive content.
$missing is probably the most prominent one.
Other variables help identifying the user. An example:

```
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

## Development and Debugging

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

## Close Function

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

# Welcome Wizard

You are able to use the Welcome Wizard in order to include upsell as well as cross-sell content. For more information please see [Writing a wizard]({{ site.baseurl }}/ui/customize/welcome-wizard.html)

# Guided Tours

In order to upsell/cross-sell right from the beginning, the guided tour can be used to walk the end user trough the OX App Suite UI including upsell/cross-sell trigger & tools.
See more information under [Guided tours]({{ site.baseurl }}/ui/components/guided-tours.html.)


# Custom App inside App Launcher

You are able to add an App to the launcher which is completly customized. Icon, name as well as URL can be included and link to the Upsell Wizard as well as to an external page.
For more information please see [here]({{ site.baseurl }}/ui/customize/app/simple-application-iframe.html#add-app-to-launcher.)

<!--
# Custom Tab inside Setting Area

any infos here?

# Upsell Notification

any infos here?
ext-botto-->

# Upsell Tracking

The [Metrics]({{ site.baseurl }}/ui/features/metrics.html) module provides a very flexible and extendible way to track user behaviour and conditions within OX App Suite.

Upsell can be tracked via the specific [events]({{ site.baseurl }}/ui/features/metrics/09-events.html#upsell).

For more information see [trackevent]({{ site.baseurl }}/ui/features/metrics/01-details.html#trackevent).

# Custom Development

This section documents some of the inner workings of upsell.
It should provide some useful insights and hopefully help implementing custom upsell solutions.

## Upsell Capabilities

There are lots of different capabilities. They are defined on the server-side and basically, they are just strings.

Let's keep it simple and understand them as either services (e.g. mobility), specific functionalities (e.g. multiple_mail_accounts) or applications (e.g. calendar).
Some obvious examples:

| Capability | Description                 | Upsell trigger (if capability is missing)                                                                                                                |
| ---------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| calendar   | User has "Calendar" app     | Mail/All recipients: Invite to appointment; Add portal widget; Top bar                                                                                   |
| contacts   | User has "Address Book" app | Mail/App recipients: Save as distribution list; Calendar: Save participants as distribution list; Top bar                                                |
| infostore  | User has "Files" app        | Mail: Save in infostore; Add portal widget (My latest files, Recently changed files); Top bar                                                            |
| portal     | User has "Portal" app       | Mail: Add to portal; Contacts: Add to portal; Files: Add to portal; Top bar                                                                              |
| tasks      | User has "Tasks" app        | Mail: Remind me; Add portal widget; Top bar                                                                                                              |
| webmail    | User has "Mail" app         | Calendar: Send mail to all participants; Contacts: Send mail; Contacts: Send vCard; Files: Send as link; Files: Send by mail; Add portal widget; Top bar |

```javascript
// list all available capabilities
_(ox.serverConfig.capabilities).pluck('id').sort();
```

**Example**

Freemail users might just have *webmail* and *contacts*.
If *infostore* is enabled for upsell, end users will see the link to store mail attachments.
But since this capability is missing, the event "upsell:requires-upgrade" is triggered which starts the upsell process.
Upon successful completion this process should unlock the capability *infostore* for the end user.

The advantage of using rather atomic capabilities as the foundation for upsell is that developers don't have to consider/implement sale programs or marketing matrices in UI code.

### Check Capability

Whenever the user starts an app or clicks on an inline-action, a capability-check is performed.
For example, all inline actions have native support for such checks:

```javascript
new Action('io.ox/calendar/detail/actions/sendmail', {
    // this action requires the capability "webmail"
    capabilities: 'webmail',
    action: function (baton) {
        // send mail
    }
});
```

If the end user does not have "webmail" (e.g. in a files-only setup) but calls this action, a proper event is fired:

```javascript
// if any action misses a capability
ox.trigger('upsell:requires-upgrade');
// which provides the following data for apps:
{
  type: "app", // type of the upsell trigger
  id: "io.ox/mail/main", // upsell trigger ID
  missing: "webmail"
}
// and for inline-actions:
{
  type: "inline-action",
  id: "io.ox/calendar/detail/actions/sendmail",
  missing: "webmail"
}
```

## Access Upsell Settings

The upsell configuration is located in the namespace *io.ox/core*, the path is *upsell/enabled* e.g.:

```javascript
// get all capabilities that can trigger upsell
require('settings!io.ox/core').get('upsell/enabled');

// contains data like this
{
  infostore: true,
  portal: true,
  tasks: true
}
```

If upsell is not enabled and the end user lacks specific capabilities, the app or the inline-action is not shown.
If upsell is enabled by the upper configuration, inline-actions are shown and trigger the upsell event "_upsell:requires-upgrade_" if clicked (but do not execute the action itself).

```javascript
/*
 * if you want to create your own controls, you can use the following helpers
 */
var upsell = require('io.ox/core/upsell');

// check capabilities (space-separated)
upsell.has('portal webmail');

// get missing capabilities (would return "calendar" in demo mode)
upsell.missing(['portal webmail', 'contacts', 'calendar']);

/* checks if upsell is enabled for a set of capabilities
 * true if at least one set matches
 */
upsell.enabled(['portal webmail', 'webmail calendar']);

/* convenience function: "visible"
 * checks if something should be visible depending on required capabilities
 * true if any item matches required capabilities
 * true if any item does not match its requirements but is enabled for upsell
 * this function is used for any inline link, for example, to decide whether or not showing it
 */
upsell.visible(['portal webmail', 'contacts', 'calendar']);

// likewise, if neither capability set nor enabled for upsell, we get a false
upsell.visible(['foo']);

// in case something weird happens (usually bad configuration) debug() helps
upsell.debug();

// and this one
_(ox.serverConfig.capabilities).pluck('id').sort();
```

## Example: Upsell Wizard

Whenever the event "_upsell:requires-upgrade_" is triggered there should be some response for the end user.
Usually an upsell popup/layer should open. This can be implemented as follows:

```javascript
function showUpgradeDialog(e, options) {
    require(['io.ox/core/tk/dialogs'], function (dialogs) {
        new dialogs.ModalDialog({ easyOut: true })
            .build(function () {
                this.getHeader().append(
                    $('<h4>').text('Upgrade required')
                );
                this.getContentNode().append(
                    $.txt('This feature is not available.'),
                    $.txt('You need to upgrade your account now.'),
                    $.txt(' '),
                    $.txt('The first 90 days are free.')
                );
                this.addPrimaryButton('upgrade', 'Get free upgrade');
                this.addButton('cancel', 'Cancel');
            })
            .setUnderlayStyle({
                opacity: 0.70,
                backgroundColor: '#08C'
            })
            .on('upgrade', function () {
                ox.trigger('upsell:upgrade', options);
            })
            .on('show', function () {
                ox.off('upsell:requires-upgrade', showUpgradeDialog);
            })
            .on('close', function () {
                ox.on('upsell:requires-upgrade', showUpgradeDialog);
            })
            .show();
    });
}

function upgrade(e, options) {
    console.debug('upgrade', options);
    alert('User decided to upgrade! (global event: upsell:upgrade)');
}

ox.on('upsell:requires-upgrade', showUpgradeDialog);

/*
 * convention: 'upsell:upgrade' is used to trigger final upsell
 * the current user and user_id can be found in global variables ox.user and ox.user_id
 */
ox.on('upsell:upgrade', upgrade);
```

The second event "_upsell:upgrade_" can be understood as the final imperative to request the upsell server-side.

## Example: Upsell Widget

Besides waiting for the user to click on such links, it's always a good idea to offer explicit control to trigger upsell.
One option is creating a widget inside the Portal that advertises a premium subscription:

```javascript
define('plugins/portal/upsell/register',
    ['io.ox/core/extensions',
     'io.ox/files/api',
     'gettext!plugins/portal'], function (ext, api, gt) {

    'use strict';

    var title = gt('Upgrade to premium');

    ext.point('io.ox/portal/widget/upsell').extend({

        title: title,

        preview: function (baton) {

            this.addClass('hide-title').append(
                $('<div class="content centered" style="cursor: pointer; padding-top: 3em;">').append(
                    $('<h2>').append(
                        $.txt(title + ' '),
                        $('<i class="icon-star">')
                    ),
                    $('<div>').text(gt('Click here for free trial.'))
                )
                .on('click', function () {
                    ox.trigger('upsell:upgrade', {
                        type: 'widget',
                        id: 'io.ox/portal/widget/upsell',
                        missing: ''
                    });
                })
            );
        }
    });
});
```

## Making all of it work

The configuration for the Upsell Widget, Upsell Bubbles and the Upsell Wizard is done in YAML instead of JavaScript, assuming that most users of this feature are not developers but from marketing or sales departments.
They will probably need starting help from a sysadmin, though, as by default, the whole upsell process is disabled two-fold:

The configuration file is not deployed.
To do so, you need to create one in the settings subfolder of the server configuration.
This is usually *_/opt/openexchange/etc/settings_*.
Please find example in the UI folder as upsell-examples.yml
The capability is not enabled. It is called "upsell" and, well, needs to be enabled.
After that, a server restart (necessary for every config change, sorry!) and some hard refreshing to get rid of eventual caching artefacts, you are good to go!
