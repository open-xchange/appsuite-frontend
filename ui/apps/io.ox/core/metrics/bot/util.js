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
                hub.off(id, handler);
                def.reject();
            }, that.TIMEOUT);
            var handler = function () {
                clearTimeout(timeout);
                def.resolve();
            };
            if (_.isString(hub)) {
                callback = id;
                id = hub;
                hub = ox;
            }
            hub.one(id, handler);
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
                ox.off('app:resume app:ready', handler);
                def.reject();
            }, that.TIMEOUT);
            // look for related resume or ready event
            var handler = function (e, app) {
                var name = app.getName();
                if (name === id) {
                    clearTimeout(timeout);
                    this.app = app;
                    def.resolve(app);
                }
            };
            ox.one('app:resume app:ready', handler.bind(this));
            return def.promise().done(callback);
        },

        waitForFolder: function (id, callback) {
            // get current app and set folder
            var app = ox.ui.App.getCurrentApp();
            return app.folder.set(id).done(callback);
        },

        // wait for list view to change collection and display content
        waitForListView: function (listView, needle, callback) {

            function hasProperCollection() {
                return listView.collection && listView.collection.cid.indexOf(needle) > -1;
            }

            this.waitFor(function () {
                if (!hasProperCollection()) return false;
                return listView.loader.loading === false;
            })
            .done(function () {
                setTimeout(callback, 0);
            });
        },

        waitForImage: function (url, callback) {
            // inspired by http://www.html5rocks.com/de/tutorials/file/xhr2/
            // and https://developer.mozilla.org/en-US/docs/Web/API/Blob
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
                if (this.status === 200) {
                    var blob = new window.Blob([this.response], { type: 'image/jpg' });
                    if (callback) callback (blob);
                } else {
                    console.error('Failed to load image', url);
                }
            };
            xhr.send();
        },

        // call callback when core is ready (+ 3 seconds to be safe)
        ready: function (callback) {
            ready.then(function () { return _.wait(3000); }).done(callback);
        }
    };

    return that;

});
