---
title: Sign In
---
# Customizing the login process

This articles covers how to write a plugin integrating a custom way to gain a session.

## Registering the extension

As all plugins, login plugins need to be defined in a namespace.
This modules for this namespace are loaded very early in the boot process.

manifest.json:

```JSON
    {
        "namespace": "login"
    }
```

register.js:

```JavaScript
    define('io.ox.examples/register', ['io.ox/core/extensions'], function (ext) {
        'use strict';
        # 'io.ox/core/boot' is the extension point
        ext.point('io.ox/core/boot/login').extend({
            id: 'myCustomLogin',
            after: 'autologin',  // After autologin is a good place to hook into
            login: function (baton) { // Extensions must implement the login method
                console.log(baton);
            }
        });

        return {};
    });
```

Registering an extension `after: 'autologin'` is a good choice, also the point from which a failing login will be recovered.
The extension can return a deferred or promise if it needs the other stages to wait until its work
has finished. You can skip all other phases of the login (like drawing the login form) by calling
`baton.stopPropagation();`

## ox.serverConfig

Typically login plugins turn themselves on or off based on configuration in ox.serverConfig. The
ox.serverConfig is loaded and available in the definition function of the module, so can be used to
decide whether an extension needs to be registered.

## Signaling success / failure

You can signal success of your login method by ox.trigger('login:success', data); with data containing
an equivalent of the usual login response. This includes:

    session - the sessionID
    locale - the users language
    rampup - rampup data
    context_id - the user's context id.
    user_id - the user's id
    user - the login name of the user

Usually, though, the custom login process will either perform a **token login** or generate a session via
a **session registration**, which are passed in as arguments in the #anchor of the page. More importantly
triggering a failure (like a failing autologin) resumes the execution of the other login methods. This
way you could also introduce other soft-failing alternatives to autologin for reviving a session.

## Disabling other login stages

Since all login stages are extensions, they can be disabled as usual on the extension point. To
disable autologin call:

```JavaScript
    ext.point('io.ox/core/boot/login').disable('autologin');
```

or for ignoring both the session and userToken/serverToken parameters, call

```JavaScript
    ext.point('io.ox/core/boot/login').disable('token');
```

## Preserving the hash data

All data passed into the ui via the url in the #anchor part is available in baton.hash. If possible try to
preserve this data during the login process to allow for deep-linking into the UI.
