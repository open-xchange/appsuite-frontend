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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 *
 */

define(['io.ox/core/extensions',
       'io.ox/core/cache/indexeddb',
       'io.ox/core/cache/localstorage',
       'io.ox/core/cache/simple'], function (ext, indexeddb, localstorage, simple) {

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
    _([simple, localstorage, indexeddb]).each(function (testStorage) {

    describe("Caching Storagelayer: " + testStorage.getStorageLayerName(), function () {

        it('check storagelayer', function () {
            expect(testStorage.isUsable()).toBeTruthy();
        });

        var testStorageInst = testStorage.getInstance('TEST');

        it('clear the cache', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get keys', TIMEOUT);

            testStorageInst.clear().done(function (check) {
                loaded.yep();
                expect(check).not.toBeDefined();
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('check for empty cache', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get keys', TIMEOUT);

            testStorageInst.keys().done(function (keys) {
                loaded.yep();
                expect(keys).toEqual([]);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('get a no existent cache key ', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorageInst.get('notexistingkey').done(function (data) {
                loaded.yep();
                expect(data).toBeNull();
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('set a cache key ', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not set key', TIMEOUT);

            testStorageInst.set(testKey, testValue).done(function (key) {
                // set is deferred internally, so we defer too
                _.defer(function () {
                    loaded.yep();
                    expect(key).toEqual(testKey);
                });
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('get a cache key ', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not set key', TIMEOUT);

            testStorageInst.get(testKey).done(function (data) {
                loaded.yep();
                expect(data).toEqual(testValue);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('get all keys ', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get keys', TIMEOUT);

            testStorageInst.keys().done(function (keys) {
                loaded.yep();
                expect(keys).toEqual([testKey]);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('check key existence ', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not check key', TIMEOUT);

            testStorageInst.get(testKey).done(function (check) {
                loaded.yep();
                expect(check).not.toBeNull();
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('check key removal ', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not check key', TIMEOUT);

            testStorageInst.remove(testKey).done(function () {
                loaded.yep();
                expect(true).toBeTruthy();
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('check for key really removed ', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not check key', TIMEOUT);

            testStorageInst.get(testKey).done(function (check) {
                loaded.yep();
                expect(check).toBeNull();
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('check for cache clearing ', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not check key', TIMEOUT);

            testStorageInst.clear().done(function () {
                loaded.yep();
                expect(true).toBeTruthy();
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('check for cleared cache ', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not check key', TIMEOUT);

            testStorageInst.keys().done(function (allKeys) {
                loaded.yep();
                expect(allKeys).toEqual([]);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

    });
    });
});
