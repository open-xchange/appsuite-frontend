/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <christoph.kopp@open-xchange.com>
 */

define("io.ox/settings/test",
    ["io.ox/core/extensions", "io.ox/core/api/account"], function (ext, api) {

    "use strict";

    var TIMEOUT = 5000;

    ext.point('test/suite').extend({
        id: 'settings-get-test',
        index: 100,
        test: function (j) {
            j.describe("Tests the get function of the jslob", function () {

                j.it('tests the get functions', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        api.configtestGet()
                        .done(function (o) {
                            if (o[0].id === 'ui') {
                                console.log(o);
                                me.ready = true;
                            }
                        })
                        .fail(function () {
                            console.log('no settingsdata recived');
                        });

                        j.waitsFor(function () {
                            return this.ready;
                        }, 'response from settings arrived', TIMEOUT);

                    });

                });

            });
        }
    });

    ext.point('test/suite').extend({
        id: 'settings-list-test',
        index: 100,
        test: function (j) {
            j.describe("Tests the list function of the jslob", function () {

                j.it('tests the list functions', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        api.configtestList(['ui'])
                        .done(function (o) {
                            if (o) {
                                console.log(o);
                                me.ready = true;
                            }
                        })
                        .fail(function () {
                            console.log('no settingsdata recived');
                        });

                        j.waitsFor(function () {
                            return this.ready;
                        }, 'response from settings arrived', TIMEOUT);

                    });

                });

            });
        }
    });

//    ext.point('test/suite').extend({
//        id: 'settings-update-test',
//        index: 100,
//        test: function (j) {
//            j.describe("Tests the update function of the jslob", function () {
//
//                j.it('tests the update functions', function () {
//
//                    j.runs(function () {
//                        var me = this,
//                        data = {
////                                testConfig: {
////                                    value: true
////                                }
//
//                        };
//                        me.ready = false;
//
//                        api.configtestUpdate(data, 'ui')
//                        .done(function (o) {
//                            if (o) {
//                                me.ready = true;
//                            }
//                        })
//                        .fail(function () {
//                            console.log('no settingsdata recived');
//                        });
//
//                        j.waitsFor(function () {
//                            return this.ready;
//                        }, 'response from settings arrived', TIMEOUT);
//
//                    });
//                });
//            });
//        }
//    });
//
//    ext.point('test/suite').extend({
//        id: 'settings-set-test',
//        index: 100,
//        test: function (j) {
//            j.describe("Tests the set function of the jslob", function () {
//
//                j.it('tests the set functions', function () {
//
//                    j.runs(function () {
//                        var me = this,
//                        data = {
////                            testConfig: {
////                                value: false
////                            }
//
//                        };
//                        me.ready = false;
//
//                        api.configtestSet(data, 'ui')
//                        .done(function () {
//                            me.ready = true;
//                        });
//
//                        j.waitsFor(function () {
//                            return this.ready;
//                        }, 'response from settings arrived', TIMEOUT);
//
//                    });
//                });
//            });
//        }
//    });
});