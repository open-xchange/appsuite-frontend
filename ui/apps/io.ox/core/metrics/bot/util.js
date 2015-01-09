/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/metrics/bot/util', [], function () {

    'use strict';

    // remember ready event
    var ready = $.Deferred();
    ox.on('core:ready', ready.resolve);

    // tick - frequency of "waitFor"
    var TICK = 50;

    var that = {

        // general timeout
        TIMEOUT: 10000,

        waitFor: function (check, fail) {
            var def = $.Deferred(), t0 = _.now();
            var interval = setInterval(function () {
                if (check()) {
                    clearInterval(interval);
                    def.resolve();
                } else if ((_.now() - t0) > that.TIMEOUT) {
                    clearInterval(interval);
                    if (fail) fail();
                    def.reject();
                }
            }, TICK);
            return def.promise();
        },

        waitForEvent: function (hub, id, callback) {
            var def = $.Deferred();
            var timeout = setTimeout(function () {
                console.error('Event not triggered', id);
                def.reject();
            }, that.TIMEOUT);
            var handler = function () {
                clearTimeout(timeout);
                hub.off(id, handler);
                def.resolve();
            };
            if (_.isString(hub)) {
                callback = id;
                id = hub;
                hub = ox;
            }
            hub.on(id, handler);
            return def.promise().done(callback);
        },

        waitForSelector: function (selector, callback) {
            return that.waitFor(
                function check() {
                    return $(selector).length > 0;
                },
                function fail() {
                    console.error('Cannot resolve selector', selector);
                }
            )
            .done(callback);
        },

        // launch app, e.g. io.ox/mail
        waitForApp: function (id, callback) {
            var def = $.Deferred();
            var timeout = setTimeout(function () {
                console.error('Cannot launch app', id);
                def.reject();
            }, that.TIMEOUT);
            // look for related resume or ready event
            var handler = function (e, app) {
                var name = app.getName();
                if (name === id) {
                    clearTimeout(timeout);
                    ox.off('app:resume app:ready', handler);
                    this.app = app;
                    def.resolve(app);
                }
            };
            ox.on('app:resume app:ready', handler.bind(this));
            return def.promise().done(callback);
        },

        waitForFolder: function (id, callback) {
            // get current app and set folder
            var app = ox.ui.App.getCurrentApp();
            return app.folder.set(id).done(callback);
        },

        // wait for list view to change collection and display content
        waitForListView: function (listView, folder, callback) {
            return that.waitFor(function check() {
                if (!listView.collection) return false;
                if (listView.collection.cid.indexOf('folder=' + folder) === -1) return false;
                // must wait for more than one node (first one is busy-indicator)
                return listView.el.childNodes.length > 1;
            })
            .done(callback);
        },

        // call callback when core is ready (+ 3 seconds to be safe)
        ready: function (callback) {
            ready.then(function () { return _.wait(3000); }).done(callback);
        }
    };

    return that;

});
