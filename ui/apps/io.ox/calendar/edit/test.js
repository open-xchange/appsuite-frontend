/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/edit/test',
      ['io.ox/core/extensions'], function (ext) {
    'use strict';

    var TIMEOUT = 3000;

    function createAsync() {
        var f = function () {
            return f.done;
        };
        f.done = false;
        f.resolve = function () {
            f.done = true;
        };
        return f;
    }

    ext.point('test/suite').extend({
        id: 'calendar-edit',
        index: 100,
        test: function (test) {
            test.describe('Calendar edit', function () {
                test.beforeEach(function () {
                    test.runs(function () {
                        var me = this;
                        this.async = createAsync();
                        require(['io.ox/calendar/edit/main'], function (main) {
                            me.app = main;
                            me.async.resolve();
                        });
                    });
                    test.waitsFor(this.async, 'Could not setup the test suite', TIMEOUT);
                });
                test.afterEach(function () {

                });
                test.it('SHOULD open the calendar edit app', function () {
                    test.runs(function () {
                        var me = this;
                        me.async = createAsync();
                        me.app.getApp().launch().done(function () {
                            me.resolve();
                        });
                    });
                    test.waitsFor(this.async, 'Could not open the app', TIMEOUT);
                    test.runs(function () {
                        test.expect(this.app).toBeObject();
                    });
                });
            });
        }
    });


});
