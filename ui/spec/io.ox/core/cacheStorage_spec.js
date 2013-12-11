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
       'io.ox/core/cache/indexeddb',
       'io.ox/core/cache/localstorage',
       'io.ox/core/cache/simple'], function (ext, indexeddb, localstorage, simple) {

    'use strict';

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

        //FIXME: indexeddb does return undefined, if browser doesn’t support it
        if (!testStorage) return;

        describe('Caching Storagelayer: ' + testStorage.getStorageLayerName(), function () {

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

            describe('with multiple caches', function () {
                beforeEach(function () {
                    this.cache1 = testStorage.getInstance('TEST1');
                    this.cache2 = testStorage.getInstance('TEST2');
                    this.cache3 = testStorage.getInstance('TEST3');
                });

                it('should initialize an empty cache', function () {
                    expect(this.cache1.keys()).toResolveWith([]);
                    expect(this.cache2.keys()).toResolveWith([]);
                    expect(this.cache3.keys()).toResolveWith([]);
                });

                describe('and test data', function () {
                    beforeEach(function () {
                        var done = $.Deferred(),
                            cache1 = this.cache1,
                            cache2 = this.cache2,
                            cache3 = this.cache3;

                        cache1.set('testKey1', 'testValue')
                        .then(function () {
                            return cache2.set('testKey2', 'testValue');
                        })
                        .then(function () {
                            return cache3.set('testKey3', 'testValue');
                        })
                        .then(function (result) {
                            done.resolve(result);
                        });

                        waitsFor(function () {
                            return done.state() === 'resolved';
                        }, 'Store and fetch cache values', TIMEOUT);
                    });

                    it('should correctly store values in each cache', function () {
                        var done = $.Deferred(),
                            cache1 = this.cache1,
                            cache2 = this.cache2,
                            cache3 = this.cache3;

                        cache1.keys().then(function (r1) {
                            return { cache1: r1 };
                        })
                        .then(function (result) {
                            return cache2.keys().then(function (r2) {
                                return _.extend({ cache2: r2 }, result);
                            });
                        })
                        .then(function (result) {
                            return cache3.keys().then(function (r3) {
                                return _.extend({ cache3: r3 }, result);
                            });
                        })
                        .then(function (result) {
                            done.resolve(result);
                        });

                        waitsFor(function () {
                            return done.state() === 'resolved';
                        }, 'Store and fetch cache values', TIMEOUT);

                        runs(function () {
                            expect(done).toResolveWith({
                                cache1: ['testKey1'],
                                cache2: ['testKey2'],
                                cache3: ['testKey3']
                            });
                        });
                    });

                    it('should clear cache1 correctly', function () {
                        var done,
                            cache1 = this.cache1;

                        done = cache1.clear().then(function () {
                            return cache1.keys();
                        });

                        waitsFor(function () {
                            return done.state() === 'resolved';
                        }, 'Clear cache and get keys', TIMEOUT);

                        runs(function () {
                            expect(done).toResolveWith([]);
                        });
                    });

                    it('should not affect other caches when clearing cache', function () {
                        var done,
                            cache1 = this.cache1,
                            cache2 = this.cache2,
                            cache3 = this.cache3;

                        done = cache1.clear().then(function () {
                            return cache1.keys().then(function (r1) {
                                return { cache1: r1 };
                            });
                        }).then(function (result) {
                            return cache2.keys().then(function (r2) {
                                return _.extend({ cache2: r2 }, result);
                            });
                        }).then(function (result) {
                            return cache3.keys().then(function (r3) {
                                return _.extend({ cache3: r3 }, result);
                            });
                        });

                        waitsFor(function () {
                            return done.state() === 'resolved';
                        }, 'Clear cache and get keys', TIMEOUT);

                        runs(function () {
                            expect(done).toResolveWith({
                                cache1: [],
                                cache2: ['testKey2'],
                                cache3: ['testKey3']
                            });
                        });
                    });
                });
            });
        });
    });
});
