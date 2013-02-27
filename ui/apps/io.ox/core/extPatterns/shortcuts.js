/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("io.ox/core/extPatterns/shortcuts", ["io.ox/core/tk/keys", "io.ox/core/collection", "io.ox/core/extPatterns/actions"], function (KeyListener, Collection, actions) {
    "use strict";

    function Shortcuts(options) {
        var keyListener = null,
            active = false,
            self = _.extend(this, options);

        this.activateForContext = function (context) {
            if (active) {
                this.deactivate();
            }
            var args = $.makeArray(arguments);
            active = true;
            keyListener =  new KeyListener(options.node);

            actions.applyCollection(self.ref, new Collection(context), context, args).done(function (extDeferreds) {
                _(extDeferreds).each(function (shortcut) {
                    keyListener.on(shortcut.shortcut, function (evt) {
                        actions.invoke(shortcut.ref, shortcut, context);
                        if (shortcut.preventDefault) {
                            evt.preventDefault();
                        }
                    });
                });
            });

            keyListener.include();
        };

        this.deactivate = function () {
            if (!active) {
                return;
            }
            active = false;
            keyListener.remove();
            keyListener.destroy();
        };

    }

    return {
        Action: actions.Action,
        Shortcuts: Shortcuts
    };
});
