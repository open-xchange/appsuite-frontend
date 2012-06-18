/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/controller', ['io.ox/core/event'], function (Events) {

    'use strict';

    // class Controller =======================================================

    function Controller(items) {

        var // poll item state if specified
            pollItems = {};

        var timer = _.bind(function () {
            // query all item states, and trigger event
            pollItems.each(function (item, key) {
                var state = item.get();
                this.trigger('update:' + key, state);
            }, this);
            // restart timer
            window.setTimeout(timer, 200);
        }, this);

        Events.extend(this);

        _(items).each(function (item, key) {
            if (item.poll === true) {
                pollItems[key] = item;
            }
        });
        pollItems = _(pollItems);
        if (!pollItems.isEmpty()) {
            window.setTimeout(timer, 200);
        }

        this.get = function (key) {
            return (key in items) && items[key].get();
        };

        this.set = function (key, state) {
            if (key in items) {
                items[key].set(state);
            }
        };

        this.destroy = function () {
            this.events.destroy();
        };

    }

    // exports ================================================================

    return Controller;
});
