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

define("io.ox/core/test/cacheSimpleCache",
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
        id: 'core-cache-simplecache',
        index: 100,
        test: function (j) {

            j.describe("Caching with SimpleCache", function () {

                var testStorage = new cache.SimpleCache('TEST_SimpleCache');



                var currentTimeStamp = (new Date()).getTime();
                var olderTimeStamp = currentTimeStamp - 1000;
                var newerTimeStamp = currentTimeStamp + 1000;

                var testKey = 'MySimpleCacheTestkey';
                var testKeyRegex = 'Simple';
                var testData1 = 'ABC';
                var testData2 = 'DEF';
                var testData3 = 'GHI';



                j.it('clearing cache', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.clear().done(function (check) {
                        loaded.yep();
                        j.expect(check).not.toBeDefined();
                    }).fail(function (e) {
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

                    testStorage.add(testKey, testData1, currentTimeStamp).done(function (data) {
                        loaded.yep();
                        j.expect(data).toEqual(testData1);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });

                j.it('adding old data but it will not be stored', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.add(testKey, testData2, olderTimeStamp).done(function (data) {
                        loaded.yep();
                        j.expect(data).toEqual(testData1);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('adding new data', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.add(testKey, testData3, newerTimeStamp).done(function (data) {
                        loaded.yep();
                        j.expect(data).toEqual(testData3);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking key', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.get(testKey).done(function (data) {
                        loaded.yep();
                        j.expect(data).not.toBeNull();
                    });
                });


                j.it('getting timestamp for key', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.time(testKey).done(function (time) {
                        loaded.yep();
                        j.expect(time).toEqual(newerTimeStamp);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('getting all keys', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.keys().done(function (keys) {
                        loaded.yep();
                        j.expect(keys).toEqual([testKey]);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('grepping keys', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.grepKeys(testKeyRegex).done(function (keys) {
                        loaded.yep();
                        j.expect(keys).toEqual([testKey]);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking cache size', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.size().done(function (size) {
                        loaded.yep();
                        j.expect(size).toEqual(1);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('getting all values', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.values().done(function (values) {
                        loaded.yep();
                        j.expect(values).toEqual([testData3]);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('remove by key', function () {
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


                j.it('checking cache size', function () {
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


                j.it('adding data ', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.add(testKey, testData1, currentTimeStamp).done(function (data) {
                        loaded.yep();
                        j.expect(data).toEqual(testData1);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('remove by key Array', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.remove([testKey]).done(function () {
                        loaded.yep();
                        j.expect(true).toBeTruthy();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking cache size', function () {
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


                j.it('adding data', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.add(testKey, testData1, currentTimeStamp).done(function (data) {
                        loaded.yep();
                        j.expect(data).toEqual(testData1);
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('grepRemove by key', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                    testStorage.grepRemove(testKeyRegex).done(function () {
                        loaded.yep();
                        j.expect(true).toBeTruthy();
                    }).fail(function (e) {
                        loaded.yep();
                        j.expect(e).not.toBeDefined();
                    });
                });


                j.it('checking cache size', function () {
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





            });

        }
    });


});
