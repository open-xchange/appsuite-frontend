/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/settings/test',
    ['io.ox/core/extensions',
     'io.ox/core/api/account',
     'settings!io.ox/mail'
    ], function (ext, api, settings) {

    'use strict';

    var TIMEOUT = ox.testTimeout;

    // ext.point('test/suite').extend({
    //     id: 'settings-get-test',
    //     index: 100,
    //     test: function (j) {
    //         j.describe('Tests the get function of the jslob', function () {
    //             j.it('tests the get functions', function () {
    //                 j.runs(function () {
    //                     var me = this;
    //                     me.ready = false;
    //                     api.configtestAll()
    //                     .done(function (o) {
    //                         if (_.isArray(o)) {
    //                             me.ready = true;
    //                         }
    //                     })
    //                     .fail(function () {
    //                         console.log('no settingsdata recived');
    //                     });

    //                     j.waitsFor(function () {
    //                         return this.ready;
    //                     }, 'response from settings arrived', TIMEOUT);
    //                 });
    //             });
    //         });
    //     }
    // });

    ext.point('test/suite').extend({
        id: 'settings-list-test',
        index: 100,
        test: function (j) {
            j.describe('Tests the list function of the jslob', function () {

                j.it('tests the list functions', function () {

                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        api.configtestList(['apps/io.ox/mail'])
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
//            j.describe('Tests the update function of the jslob', function () {
//                // sets a present property to an new value
//                j.it('tests the update functions', function () {
//
//                    j.runs(function () {
//                        var me = this,
//                        data = {
//                            mail: {
//                                testConfig: {
//                                    value: true
//                                }
//                            }
//
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

//    ext.point('test/suite').extend({
//        id: 'settings-set-test',
//        index: 100,
//        test: function (j) {
//            j.describe('Tests the set function of the jslob', function () {
//
//                j.it('tests the set functions', function () {
//
//                    j.runs(function () {
//                        var me = this,
//                        data = {
////                            mail: {
////                                testConfig: {
////                                    value: true
////                                }
////                            }
//
//                        };
//                        me.ready = false;
//
//                        api.configtestSet(data, 'apps/io.ox/mail')
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

    ext.point('test/suite').extend({
        id: 'settings-get-function-test',
        index: 100,
        test: function (j) {
            j.describe('Tests the get feature function of the settings.js', function () {

                j.it('tests the get functions of the settings.js', function () {
                    var response;
                    j.runs(function () {

                        response = settings.get('removeDeletedPermanently');
                        console.log(response);
                        j.expect(response).not.toBeNull();

                    });

                });
            });
        }
    });


    ext.point('test/suite').extend({
        id: 'settings-set-function-test',
        index: 100,
        test: function (j) {
            j.describe('Tests the set feature function of the settings.js', function () {

                j.it('tests the set functions of the settings.js', function () {
                    var response, currentSetting;

                    j.runs(function () {

                        currentSetting = settings.get('removeDeletedPermanently');
                        settings.set('removeDeletedPermanently', true);

                        response = settings.get('removeDeletedPermanently');
                        j.expect(response).toBe(true);
                    });

                    j.runs(function () {

                        settings.set('removeDeletedPermanently', false);
                        response = settings.get('removeDeletedPermanently');
                        j.expect(response).toBe(false);

                    });

                    j.runs(function () {

                        settings.set('removeDeletedPermanently', currentSetting);
                        response = settings.get('removeDeletedPermanently');
                        j.expect(response).toEqual(currentSetting);

                    });


                });
            });
        }
    });

//    ext.point('test/suite').extend({
//        id: 'settings-contains-function-test',
//        index: 100,
//        test: function (j) {
//            j.describe('Tests the contains feature function of the settings.js', function () {
//
//                j.it('tests the contains functions of the settings.js', function () {
//                    var response;
//                    j.runs(function () {
//                        response = settings.contains('removeDeletedPermanently');
//                        j.expect(response).toBe(true);
//
//                    });
//
//                });
//            });
//        }
//    });

});
