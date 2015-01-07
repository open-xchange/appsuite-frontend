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

define('io.ox/core/metrics/bot/main', ['io.ox/core/metrics/metrics', 'io.ox/core/metrics/bot/util'], function (metrics, util) {

    'use strict';

    //
    // Abstract super class used for both Suite and Test
    //

    function AbstractSuite(callback) {
        this.items = [];
        this.current = -1;
        this.deferred = $.Deferred();
        if (callback) callback.call(this);
    }

    _.extend(AbstractSuite.prototype, {

        run: function () {
            this.next();
            return this.deferred.promise();
        },

        next: function () {
            var item = this.items[++this.current];
            if (item) this.process(item); else this.done();
        },

        done: function () {
            this.deferred.resolve(this);
        }
    });

    //
    // Test Suite
    //

    function Suite(callback) {
        AbstractSuite.call(this, callback);
        // for debugging purposes
        window.suite = this;
    }

    _.extend(Suite.prototype, AbstractSuite.prototype, {

        // process item
        process: function (item) {
            console.log('Running test:', item.description);
            item.run().done(function () {
                console.log('Test finished. Took:', metrics.formatTimestamp(item.getDuration()));
                this.next();
            }.bind(this));
        },

        getDuration: function () {
            return _(this.items).reduce(function (sum, item) {
                return sum + item.getDuration();
            }, 0);
        },

        test: function (description, callback) {
            this.items.push(new Test(description, callback));
        },

        // typical convenience function; instead of commenting stuff out
        xtest: function () {
        }

    });

    //
    // Test
    //

    function Test(description, callback) {
        // inherit from Suite
        this.description = description;
        AbstractSuite.call(this, callback);
    }

    _.extend(Test.prototype, AbstractSuite.prototype, {

        step: function (description, callback) {
            this.items.push({ description: description, callback: callback, duration: -1 });
        },

        // typical convenience function; instead of commenting stuff out
        xstep: function () {
        },

        process: function (item) {
            // remember current time
            var t0 = _.now();
            // look for timeout
            var timeout = setTimeout(function () {
                console.error('Timeout', item.description);
                this.deferred.reject();
                item = done = timeout = null;
            }.bind(this), util.TIMEOUT);
            // define local "done" callback
            var done = function () {
                clearTimeout(timeout);
                item.duration = _.now() - t0;
                console.log('... Step "' + item.description + '" (' + metrics.formatTimestamp(item.duration) + ')');
                this.next();
                item = done = timeout = null;
            };
            // run step
            if (item.callback.length === 0) {
                // call without "done" callback
                item.callback.call(this);
                done.call(this);
            } else {
                // async
                item.callback.call(this, done.bind(this));
            }
        },

        getDuration: function () {
            return _(this.items).reduce(function (sum, item) {
                return sum + item.duration;
            }, 0);
        },

        waitFor: util.waitFor,
        waitForApp: util.waitForApp,
        waitForEvent: util.waitForEvent,
        waitForSelector: util.waitForSelector,
        waitForFolder: util.waitForFolder,
        waitForListView: util.waitForListView
    });

    var that = {

        ready: function (callback) {
            return util.ready(callback.bind(this));
        },

        suite: function (callback) {
            new Suite(callback).run().done(function (suite) {
                console.log('Suite finished.', 'Took: ' + metrics.formatTimestamp(suite.getDuration()), 'Browser: ' + metrics.getBrowser());
            });
        }
    };

    return that;

});
