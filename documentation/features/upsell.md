---
title: Upsell
description: End-user has a set of so-called capabilities. UI, however, offers functionality beyond that limited set for promotion purposes.
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Upsell
---

This article is mainly for UI developers and introduces the concept of upsell from a technical point of view. 
In short: End-user has a set of so-called capabilities. 
UI, however, offers functionality beyond that limited set for promotion purposes. 
Actions, e.g. inline links, that require missing capabilities trigger an **in-app** upsell. This process leads to a trial period or a new subscription.
Technical challenge for the UI developer is to check what the end-user has, what can be shown beyond that, and how to handle upsell. 
It is also possible for hosting companies to easily integrate their own online shop into OX Upsell, since the internal mechanisms are loosely coupled via events.

# Enable upsell

In order to configure upsell server-side, just create a new file `upsell-appsuite.properties` or append to existing `appsuite.properties` (mind the **double-slash**; this in not a typo!).
If you configure upsell in the `upsell-appsuite.properties` the properties are loaded when you trigger the **live reload** function.

```javascript
io.ox/core//upsell/enabled/infostore=true
io.ox/core//upsell/enabled/portal=true
io.ox/core//upsell/enabled/tasks=true
```

Each line enables a specific [capability](TODO) for upsell. 
That means whenever a feature misses one these capabilities a special upsell-related event is triggered.

**Hint**

For simple demo purposes, you can enable an internal upsell configuration by appending **"&demo=upsell"** to the URL. Needs to reload page, of course.

# Custom upsell links

Since other upsell triggers than the usual links would require custom development of the UI, the appsuite provides several upsell triggers which can be configured via settings. 
Those triggers will appear, when the expression of required capabilities is not satisfied and the required set of upsell triggers is satisfied. 
If you configure the upsell settings, the custom upsell triggers will be enabled by default but you can disable them if you want to.

## Example

To clearify, when triggers are shown or not, we proceed with an example: A hoster can provide a custom upsell trigger in the secondary toolbar (next to the reload icon). 
This upsell trigger is inteded to sell a premium account to a user and has the default requirement of active_sync OR caldav OR carddav. 
That means, if one of those capabilities is not set for a user and the upsell is activated for active_sync AND caldav AND carddav the upsell trigger will be shown. 
You can enable upsell for those capabilities with

```javascript
io.ox/core//upsell/enabled/active_sync=true
io.ox/core//upsell/enabled/caldav=true
io.ox/core//upsell/enabled/carddav=true
```

inside an existing or new `.properties` file. Note that you have to restart the server so that the changes take place.

If a user clicks on the upsell trigger, a upsell event of type 'custom' and with id 'secondary-toolbar' is triggered so that the page or dialog which will be opened can react depending on the clicked link.

## Change appearance

Any custom upsell triggers which have icons will use a **fa-star** as default icon.
You can change the default icon to any font-awesome icon (or a set of space separated icons) via

```
io.ox/core//upsell/defaultIcon="fa-star"
```

You can also change the icon of individual custom triggers with

```
io.ox/core//features/upsell/$id/icon="fa-star"
```

where $id is the id of the upsell trigger.

The color of custom upsell links can be changed with

```
io.ox/core//features/upsell/$id/color="#f00"
```

where $id is the id of the upsell trigger and the color string can be any css color string.

If you want to disable a custom upsell trigger, then you can add

```javascript
io.ox/core//features/upsell/$id/enabled=false
```

to a **.properties** file.

## Customize strings

Some of the custom upsell triggers use have a title (or other strings) which a hoster could customize. 
It is important, that several translations are provided. 
You can provide your own texts via

```
io.ox/core//features/upsell/$id/i18n/$lang/title="A custom title"
```

where $lang is the current language identifier (e.g. "en_US"). You can see the current language identifier when you open the webconsole and type

```
ox.language
```

## Customize required capabilities

If you want certain upsell triggers to appear on different capabilities, you can configure this inside a .properties file. 
Therefore, you have to configure the requires field of the appropriate trigger. 
This field expects a logical expression of capabilities. 
The following example requires eas and caldav or not carddav. 
If the actual capabilities does not satisfy the expression and the upsell capabilites satisfy this expression, the upsell trigger will be drawn.

```
io.ox/core//features/upsell/$id/requires="active_sync && (caldav || !carddav)"
```

# List of custom triggers

This sections lists the custom triggers and how they can be configured.

| ID                          | Config                              | Texts | Default capabilities              | Description                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ----------------------------------- | ----- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| secondary-launcher          | icon, color                         | title | active_sync or caldav or carddav  | This trigger is located in the secondary toolbar left of the notifications icon. It can contain an icon and text and can be colored. It is intended as **upgrade to premium** trigger. This trigger is not shown on mobile devices due to space limitations.                                                                                                                                         |
| folderview/mail             | icon, color                         | title | active_sync                       | This trigger is located below the folderview of mails.                                                                                                                                                                                                                                                                                                                                               |
| folderview/mail/bottom      | color                               | title | active_sync                       | This trigger is located at the bottom of the folderview of the mail app in the premium area. This trigger is styled as a button with the default text 'Try now' and has no icon by default.                                                                                                                                                                                                          |
| folderview/contacts         | icon, color                         | title | carddav                           | This trigger is located below the folderview of the address book.                                                                                                                                                                                                                                                                                                                                    |
| folderview/contacts/bottom  | color                               | title | carddav                           | This trigger is located at the bottom of the folderview of the contacts app in the premium area. This trigger is styled as a button with the default text 'Try now' and has no icon by default.                                                                                                                                                                                                      |
| folderview/calendar         | icon, color                         | title | caldav                            | This trigger is located below the folderview of the calendar.                                                                                                                                                                                                                                                                                                                                        |
| folderview/calendar/bottom  | color                               | title | caldav                            | This trigger is located at the bottom of the folderview of the calendar app in the premium area. This trigger is styled as a button with the default text 'Try now' and has no icon by default.                                                                                                                                                                                                      |
| folderview/infostore/bottom | color                               | title | boxcom or google or msliveconnect | This trigger is located at the bottom of the folderview of the drive app in the premium area. This trigger is styled as a button with the default text 'Try now' and has no icon by default.                                                                                                                                                                                                         |
| topbar-dropdown             | icon, color                         | title | active_sync or caldav or carddav  | This trigger is located on the first position of the dropdown in the secondary toolbar. It contains a text and an icon.                                                                                                                                                                                                                                                                              |
| portal-widget               | imageURL, removable (boolean), icon | title | active_sync or caldav or carddav  | This trigger adds a draggable portal widget to the appsuite portal. This widget is not removable by default and displays a default text. A customer can add a backgroundimage with **imageURL** and can make this widget **removable** by setting removableto true. If no image is used, the widget displays the title in the center with a customizable space separated list of font-awesome icons. |
| mail-folderview-quota       | upsellLimit, icon, color            | title | active_sync or caldav or carddav  | This trigger is appended below the mail quota in the folderview. You can set the **upsellLimit** (in Bytes). If the maximum mail quota is larger than **upsellLimit**, the upsell button will not be shown. This upsell trigger has no icon by default.                                                                                                                                              |

# Upsell Wizard

Customers usually want to offer context-sensitive content in an IFRAME if the upsell is triggered. 
Therefore, App Suite comes with an integrated but optional plugin that takes care of this. 
Just enable `plugins/upsell/simple-wizard` by setting the capability simple-wizard server-side (or by adding it to the URL ...**&cap=simple-wizard** for testing/development purposes).

This plugin registers for the event "_upsell:requires-upsell_", opens a modal popup, and loads a custom URL in an embedded IFRAME.

## Wizard settings

In order to configure this server-side, just create a new file `upsell.properties` or append to existing `appsuite.properties` (mind the **double-slash**; this in not a typo! plus: changing such settings requires a backend restart):

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

## Custom URL variables

The plugin offers a set of variables that help providing context-sensitive content. 
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
| $imap_login | The current user's imap login                                                                                      |
| $language   | The current user's language, e.g. de_DE or en_US                                                                   |
| $mail       | The current user's primary email address                                                                           |
| $missing    | The set of missing capabilities, comma separated, e.g. "files"                                                     |
| $session    | The current user's session id                                                                                      |
| $type       | Either app, inline-action, or portal-widget. Describes what triggered the upsell. See $id                          |
| $user       | The current user's login name (can include context name, i.e somebody@foo)                                         |
| $user_id    | The current user's numeric id                                                                                      |
| $user_login | The current user's login (usually without context name)                                                            |

## Develop and debug

While experimenting or developing, you can use the following helpful functions:

```javascript
// get plugin (this must be properly loaded, otherwise you get a runtime error)
var wizard = require('plugins/upsell/simple-wizard/register');

// if you have no chance to enabled this plugin server-side, use the following approach 
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

Some examples for customizations in UI plugins or in console:

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

## Close wizard

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

# Custom development

This section documents some of the inner workings of the upsell layer. 
It should provide some useful insights and hopefully helps at implementing custom upsell solutions.

# Events

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

If the end-user does not have "webmail" (e.g. in a files-only setup) but calls this action, a proper event is fired:

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

## Capabilities and Upsell triggers

There are lots of different capabilities. 
They are defined on the server-side and basically they are just strings. 
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

**An example**

Free-mail users might just have **webmail** and **contacts**.
If **infostore** is enabled for upsell, end-users will see the link to store mail attachments.
But since this capability is missing, the event "upsell:requires-upgrade" is triggered which starts the upsell process. 
Upon successful completion this process should unlock the capability **infostore** for the end-user.

The advantage of using rather atomic capabilities as the foundation for upsell is that developers don't have to consider and implement sales programs or marketing matrices in UI code.

## Example dialog

Whenever the event "_upsell:requires-upgrade_" is triggered there should be some response for the end-user. 
Usually an upsell dialog should open. This can be implemented as follows:

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

The second event "**upsell:upgrade**" can be understood as the final imperative to request the upsell server-side.

## Example portal widget

Besides waiting for the user to click on such links, it's always a good idea to offer explicit controls to trigger an upsell. 
One option is creating a portal widget that advertises a premium subscription:

```javascript
/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

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

## Accessing upsell settings

The upsell configuration is located in the namespace "io.ox/core", the path is "upsell/enabled". Example:

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

If upsell is **not** enabled and the end-user lacks specific capabilities, the app or the inline-action is not shown.
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
 * true if any item matches requires capabilities 
 * true if any item does not match its requirements but is enabled for upsell 
 * this function is used for any inline link, for example, to decide whether or not showing it 
 */
upsell.visible(['portal webmail', 'contacts', 'calendar']);

// likewise if neither capability set nor enabled for upsell, we get a false 
upsell.visible(['foo']);

// in case something weird happens (usually bad configuration) debug() helps
upsell.debug();

// and this one
_(ox.serverConfig.capabilities).pluck('id').sort();
```
