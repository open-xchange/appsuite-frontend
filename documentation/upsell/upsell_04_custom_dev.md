---
title: Custom development
---

This section documents some of the inner workings of upsell.
It should provide some useful insights and hopefully help implementing custom upsell solutions.

# Upsell capabilities

There are lots of different [capabilities](../customize/manifests.html#capabilities). They are defined on the server-side and basically, they are just strings.

Let's keep it simple and understand them as either services (e.g. mobility), specific functionalities (e.g. multiple_mail_accounts) or applications (e.g. calendar).
Some obvious examples:

| Capability | Description                 | Upsell trigger (if capability is missing)                                                                                                                |
| ---------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| calendar   | User has "Calendar" app     | Mail/All recipients: Invite to appointment; Add portal widget; Top bar                                                                                   |
| contacts   | User has "Address Book" app | Mail/All recipients: Save as distribution list; Calendar: Save participants as distribution list; Top bar                                                |
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

## Check capability

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


# Access upsell settings

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
If upsell is enabled by the upper configuration, inline-actions are shown and trigger the upsell event 'upsell:requires-upgrade' if clicked (but do not execute the action itself).

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


# Example: Upsell wizard

Whenever the event 'upsell:requires-upgrade' is triggered there should be some response for the end user.
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

The second event 'upsell:upgrade' can be understood as the final imperative to request the upsell server-side.

# Example: Upsell widget

Besides waiting for the user to click on such links, it's always a good idea to offer explicit control to trigger upsell.
One option is creating a widget inside the portal that advertises a premium subscription:

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

# Making all of it work

The configuration for the upsell widget and the upsell wizard is done in YAML instead of JavaScript, assuming that most users of this feature are not developers but from marketing or sales departments.
They will probably need starting help from a sysadmin, though, as by default, the whole upsell process is disabled two-fold:

The configuration file is not deployed.
To do so, you need to create one in the settings subfolder of the server configuration.
This is usually *_/opt/openexchange/etc/settings_*.
Please find example in the UI folder as upsell-examples.yml
The capability is not enabled. It is called "upsell" and, well, needs to be enabled.
After that, a server restart (necessary for every config change, sorry!) and some hard refreshing to get rid of eventual caching artefacts, you are good to go!
