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
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 *
 */

define(['io.ox/core/extensions',
       'io.ox/core/cache'], function (ext, cache) {

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
    describe("Caching with SimpleCache", function () {

        var testStorage = new cache.SimpleCache('TEST_SimpleCache');

        var currentTimeStamp = (new Date()).getTime();
        var olderTimeStamp = currentTimeStamp - 1000;
        var newerTimeStamp = currentTimeStamp + 1000;

        var testKey = 'MySimpleCacheTestkey';
        var testKeyRegex = 'Simple';
        var testData1 = 'ABC';
        var testData2 = 'DEF';
        var testData3 = 'GHI';

        it('clearing cache', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.clear().done(function (check) {
                loaded.yep();
                expect(check).not.toBeDefined();
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('getting not existing key', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.get('notexistent').done(function (data) {
                loaded.yep();
                expect(data).toBeNull();
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('adding data ', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.add(testKey, testData1, currentTimeStamp).done(function (data) {
                loaded.yep();
                expect(data).toEqual(testData1);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('adding old data but it will not be stored', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.add(testKey, testData2, olderTimeStamp).done(function (data) {
                loaded.yep();
                expect(data).toEqual(testData1);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('adding new data', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.add(testKey, testData3, newerTimeStamp).done(function (data) {
                loaded.yep();
                expect(data).toEqual(testData3);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('checking key', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.get(testKey).done(function (data) {
                loaded.yep();
                expect(data).not.toBeNull();
            });
        });

        it('getting timestamp for key', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.time(testKey).done(function (time) {
                loaded.yep();
                expect(time).toEqual(newerTimeStamp);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('getting all keys', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.keys().done(function (keys) {
                loaded.yep();
                expect(keys).toEqual([testKey]);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('grepping keys', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.grepKeys(testKeyRegex).done(function (keys) {
                loaded.yep();
                expect(keys).toEqual([testKey]);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('checking cache size', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.size().done(function (size) {
                loaded.yep();
                expect(size).toEqual(1);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('getting all values', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.values().done(function (values) {
                loaded.yep();
                expect(values).toEqual([testData3]);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('remove by key', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.remove(testKey).done(function () {
                loaded.yep();
                expect(true).toBeTruthy();
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('checking cache size', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.size().done(function (size) {
                loaded.yep();
                expect(size).toEqual(0);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('adding data ', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.add(testKey, testData1, currentTimeStamp).done(function (data) {
                loaded.yep();
                expect(data).toEqual(testData1);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('remove by key Array', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.remove([testKey]).done(function () {
                loaded.yep();
                expect(true).toBeTruthy();
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('checking cache size', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.size().done(function (size) {
                loaded.yep();
                expect(size).toEqual(0);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('adding data', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.add(testKey, testData1, currentTimeStamp).done(function (data) {
                loaded.yep();
                expect(data).toEqual(testData1);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('grepRemove by key', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.grepRemove(testKeyRegex).done(function () {
                loaded.yep();
                expect(true).toBeTruthy();
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });

        it('checking cache size', function () {
            var loaded = new Done();
            waitsFor(loaded, 'Could not get key', TIMEOUT);

            testStorage.size().done(function (size) {
                loaded.yep();
                expect(size).toEqual(0);
            }).fail(function (e) {
                loaded.yep();
                expect(e).not.toBeDefined();
            });
        });
    });
});
