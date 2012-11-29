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

define("io.ox/core/test/cacheStorage",
    ["io.ox/core/extensions",
     "io.ox/core/cache/indexeddb",
     "io.ox/core/cache/localstorage",
     "io.ox/core/cache/simple"], function (ext, indexeddb, localstorage, simple) {

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
        id: 'core-cache-storagelayer',
        index: 100,
        test: function (j) {

            _([simple, localstorage/*, indexeddb*/]).each(function (testStorage) {

                j.describe("Caching Storagelayer: " + testStorage.getStorageLayerName(), function () {

                    testStorage.setId('TEST');

                    j.it('check storagelayer', function () {
                        j.expect(testStorage.isUsable()).toBeTruthy();
                    });

                    j.it('clear the cache', function () {
                        var loaded = new Done();
                        j.waitsFor(loaded, 'Could not get keys', TIMEOUT);

                        testStorage.clear().done(function (check) {
                            loaded.yep();
                            j.expect(check).not.toBeDefined();
                        }).fail(function (e) {
                            loaded.yep();
                            j.expect(e).not.toBeDefined();
                        });
                    });

                    j.it('check for empty cache', function () {
                        var loaded = new Done();
                        j.waitsFor(loaded, 'Could not get keys', TIMEOUT);

                        testStorage.keys().done(function (keys) {
                            loaded.yep();
                            j.expect(keys).toEqual([]);
                        }).fail(function (e) {
                            loaded.yep();
                            j.expect(e).not.toBeDefined();
                        });
                    });

                    j.it('get a no existent cache key ', function () {
                        var loaded = new Done();
                        j.waitsFor(loaded, 'Could not get key', TIMEOUT);

                        testStorage.get('notexistingkey').done(function (data) {
                            loaded.yep();
                            j.expect(data).toBeNull();
                        }).fail(function (e) {
                            loaded.yep();
                            j.expect(e).not.toBeDefined();
                        });
                    });

                    j.it('set a cache key ', function () {
                        var loaded = new Done();
                        j.waitsFor(loaded, 'Could not set key', TIMEOUT);

                        testStorage.set(testKey, testValue).done(function (key) {
                            loaded.yep();
                            j.expect(key).toEqual(testKey);
                        }).fail(function (e) {
                            loaded.yep();
                            j.expect(e).not.toBeDefined();
                        });
                    });

                    j.it('get a cache key ', function () {
                        var loaded = new Done();
                        j.waitsFor(loaded, 'Could not set key', TIMEOUT);

                        testStorage.get(testKey).done(function (data) {
                            loaded.yep();
                            j.expect(data).toEqual(testValue);
                        }).fail(function (e) {
                            loaded.yep();
                            j.expect(e).not.toBeDefined();
                        });
                    });

                    j.it('get all keys ', function () {
                        var loaded = new Done();
                        j.waitsFor(loaded, 'Could not get keys', TIMEOUT);

                        testStorage.keys().done(function (keys) {
                            loaded.yep();
                            j.expect(keys).toEqual([testKey]);
                        }).fail(function (e) {
                            loaded.yep();
                            j.expect(e).not.toBeDefined();
                        });
                    });

                    j.it('check key existence ', function () {
                        var loaded = new Done();
                        j.waitsFor(loaded, 'Could not check key', TIMEOUT);

                        testStorage.get(testKey).done(function (check) {
                            loaded.yep();
                            j.expect(check).not.toBeNull();
                        }).fail(function (e) {
                            loaded.yep();
                            j.expect(e).not.toBeDefined();
                        });
                    });

                    j.it('check key removal ', function () {
                        var loaded = new Done();
                        j.waitsFor(loaded, 'Could not check key', TIMEOUT);

                        testStorage.remove(testKey).done(function () {
                            loaded.yep();
                            j.expect(true).toBeTruthy();
                        }).fail(function (e) {
                            loaded.yep();
                            j.expect(e).not.toBeDefined();
                        });
                    });

                    j.it('check for key really removed ', function () {
                        var loaded = new Done();
                        j.waitsFor(loaded, 'Could not check key', TIMEOUT);

                        testStorage.get(testKey).done(function (check) {
                            loaded.yep();
                            j.expect(check).toBeNull();
                        }).fail(function (e) {
                            loaded.yep();
                            j.expect(e).not.toBeDefined();
                        });
                    });

                    j.it('check for cache clearing ', function () {
                        var loaded = new Done();
                        j.waitsFor(loaded, 'Could not check key', TIMEOUT);

                        testStorage.clear().done(function () {
                            loaded.yep();
                            j.expect(true).toBeTruthy();
                        }).fail(function (e) {
                            loaded.yep();
                            j.expect(e).not.toBeDefined();
                        });
                    });

                    j.it('check for cleared cache ', function () {
                        var loaded = new Done();
                        j.waitsFor(loaded, 'Could not check key', TIMEOUT);

                        testStorage.keys().done(function (allKeys) {
                            loaded.yep();
                            j.expect(allKeys).toEqual([]);
                        }).fail(function (e) {
                            loaded.yep();
                            j.expect(e).not.toBeDefined();
                        });
                    });

                });
            });

            j.describe("Storagelayer specific bugs", function () {

                j.it('check for localstorage exception with large datasets', function () {
                    var loaded = new Done();
                    j.waitsFor(loaded, 'Could not check key', TIMEOUT * 3);

                    var max = 1000;
                    var testData = (new Array(100).join('AFDGsdf gDFgDSF gdfgsdgd'));

                    for (var i = 0 ; i <= max ; i++) {
                        localstorage.set('testkey' + i, testData);

                        if (i === max) {
                            loaded.yep();
                        }
                    }

                    j.expect(0).toEqual(0);
                });
            });
        }
    });
});
