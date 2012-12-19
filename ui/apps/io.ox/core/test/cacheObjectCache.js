/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 */

define("io.ox/core/test/cacheObjectCache",
    ["io.ox/core/extensions",
     "io.ox/core/cache"], function (ext, cache) {

    "use strict";

    // test objects
    var TIMEOUT = ox.testTimeout,
        testKey = 'testkey',
        testValue = 'ABC';

    // helpers
    function Done() {
        var f = function () {
            return f.value;
        };
        f.value = false;
        f.yep = function () {
            f.value = true;
        };
        return f;
    }

    /*
     * Suite: Cache Test
     */
    ext.point('test/suite').extend({
        id: 'core-cache-objectcache',
        index: 100,
        test: function (j) {

            j.describe("Caching with ObjectCache", function () {

                var testStorage = new cache.ObjectCache('TEST_ObjectCache');



                var currentTimeStamp = (new Date()).getTime();
                var olderTimeStamp = currentTimeStamp - 1000;
                var newerTimeStamp = currentTimeStamp + 1000;

                var testKey = 'A.ABC';
                var testKeyRegex = 'Simple';
                var testData1 = {'folder_id': 'A', 'id': 'ABC', 'TEST': '1'};
                var testData2 = {'folder_id': 'A', 'id': 'ABC', 'TEST': '2'};
                var testData3 = {'folder_id': 'A', 'id': 'ABC', 'TEST': '3'};


                var testDataA = {'folder_id': 'A', 'id': 'ABD', 'TEST': '1'};
                var testDataB = {'folder_id': 'A', 'id': 'ABE', 'TEST': '1'};
                var testDataC = {'folder_id': 'A', 'id': 'ABF', 'TEST': '1'};


                j.it('clearing cache', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.clear().done(function (check) {
                        loaded.yep();
                        j.expect(check).not.toBeDefined();
                    })
                    .fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('getting not existing key', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.get('notexistent').done(function (data) {
                        loaded.yep();
                        j.expect(data).toBeNull();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('adding data ', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.add(testData1, currentTimeStamp).done(function (data) {
                        loaded.yep();
                        j.expect(data).toEqual(testKey);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('adding old data ', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.add(testData2, olderTimeStamp).done(function (data) {
                        loaded.yep();
                        j.expect(data).toEqual(testKey);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('getting data to test for old data replacement', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.get(testKey).done(function (data) {
                        loaded.yep();
                        j.expect(data).toEqual(testData1);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('adding new data ', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.add(testData3, newerTimeStamp).done(function (data) {
                        loaded.yep();
                        j.expect(data).toEqual(testKey);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('getting data to test for new data replacement', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.get(testKey).done(function (data) {
                        loaded.yep();
                        j.expect(data).toEqual(testData3);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('adding array of new data ', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.add([testData1, testDataA, testDataB, testDataC], currentTimeStamp).done(function (data) {
                        loaded.yep();
                        j.expect(data).toEqual([ 'A.ABC', 'A.ABD', 'A.ABE', 'A.ABF' ]);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking for key existence', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.get(testKey).done(function (check) {
                        loaded.yep();
                        j.expect(check).not.toBeNull();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking for key existence on nonexisting key', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.get('fdfsgagsdg').done(function (check) {
                        loaded.yep();
                        j.expect(check).toBeNull();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking for array of key existence', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.get(['A.ABC', 'A.ABD']).done(function (check) {
                        loaded.yep();
                        j.expect(check).not.toBeNull();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking for object existence', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.get(testData1).done(function (check) {
                        loaded.yep();
                        j.expect(check).not.toBeNull();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking for array of object existence', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.get([testData1, testDataA]).done(function (check) {
                        loaded.yep();
                        j.expect(check).not.toBeNull();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking for array of mixed object/key existence', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.get([testData1, 'A.ABE']).done(function (check) {
                        loaded.yep();
                        j.expect(check).not.toBeNull();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking for array of mixed object/key existence with nonexistent key', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.get([testData1, 'A.ABX']).done(function (check) {
                        loaded.yep();
                        j.expect(check).toBeNull();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking cachesize before removing', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.size().done(function (size) {
                        loaded.yep();
                        j.expect(size).toEqual(4);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('removing by single key', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.remove(testKey).done(function () {
                        loaded.yep();
                        j.expect(true).toBeTruthy();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking cachesize after removing', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.size().done(function (size) {
                        loaded.yep();
                        j.expect(size).toEqual(3);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('removing by object', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.remove(testDataA).done(function () {
                        loaded.yep();
                        j.expect(true).toBeTruthy();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking cachesize after removing', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.size().done(function (size) {
                        loaded.yep();
                        j.expect(size).toEqual(2);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('removing by array of keys', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.remove(['A.ABE', 'A.ABF']).done(function () {
                        loaded.yep();
                        j.expect(true).toBeTruthy();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking cachesize after removing', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.size().done(function (size) {
                        loaded.yep();
                        j.expect(size).toEqual(0);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('merging objects', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.add(testData1).pipe(function () {
                        return testStorage.merge(testData2).pipe(function (test) {
                            return testStorage.get(testData1);
                        });
                    }).done(function (value) {
                        loaded.yep();
                        j.expect(value).toEqual(testData2);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


            });

        }
    });




});
