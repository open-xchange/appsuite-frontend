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

define([
    'io.ox/core/extensions',
    'io.ox/core/cache/indexeddb',
    'io.ox/core/cache/localstorage',
    'io.ox/core/cache/simple'
], function (ext, indexeddb, localstorage, simple) {
    'use strict';

    // test objects
    var testKey = 'testkey',
        testValue = 'ABC';

    describe('Cache', function () {
        /*
         * Suite: Cache Test
         */
        _([simple, localstorage, indexeddb]).each(function (testStorage) {

            //FIXME: indexeddb does return undefined, if browser doesn’t support it
            if (!testStorage) return;

            describe('Storagelayer: ' + testStorage.getStorageLayerName(), function () {

                it('check storagelayer', function () {
                    expect(testStorage.isUsable()).to.be.ok;
                });

                var testStorageInst = testStorage.getInstance('TEST');

                it('clear the cache', function (done) {
                    testStorageInst.clear().done(function (check) {
                        expect(check).to.be.undefined;
                        done();
                    }).fail(function (e) {
                        expect(e).to.be.undefined;
                        done();
                    });
                });

                it('check for empty cache', function (done) {
                    testStorageInst.keys().done(function (keys) {
                        expect(keys).to.be.empty;
                        done();
                    }).fail(function (e) {
                        expect(e).to.be.undefined;
                        done();
                    });
                });

                it('get a no existent cache key ', function (done) {
                    testStorageInst.get('notexistingkey').done(function (data) {
                        expect(data).to.be.null;
                        done();
                    }).fail(function (e) {
                        expect(e).to.be.undefined;
                        done();
                    });
                });

                it('set a cache key ', function (done) {
                    testStorageInst.set(testKey, testValue).done(function (key) {
                        // set is deferred internally, so we defer too
                        _.defer(function () {
                            expect(key).to.equal(testKey);
                            done();
                        });
                    }).fail(function (e) {
                        expect(e).to.be.undefined;
                        done();
                    });
                });

                it('get a cache key ', function (done) {
                    testStorageInst.get(testKey).done(function (data) {
                        expect(data).to.equal(testValue);
                        done();
                    }).fail(function (e) {
                        expect(e).to.be.undefined;
                        done();
                    });
                });

                it('get all keys ', function (done) {
                    testStorageInst.keys().done(function (keys) {
                        expect(keys).to.deep.equal([testKey]);
                        done();
                    }).fail(function (e) {
                        expect(e).to.be.undefined;
                        done();
                    });
                });

                it('check key existence ', function (done) {
                    testStorageInst.get(testKey).done(function (check) {
                        expect(check).not.to.be.null;
                        done();
                    }).fail(function (e) {
                        expect(e).to.be.undefined;
                        done();
                    });
                });

                it('check key removal ', function (done) {
                    testStorageInst.remove(testKey).done(function () {
                        expect(true).to.be.ok;
                        done();
                    }).fail(function (e) {
                        expect(e).to.be.undefined;
                        done();
                    });
                });

                it('check for key really removed ', function (done) {
                    testStorageInst.get(testKey).done(function (check) {
                        expect(check).to.be.null;
                        done();
                    }).fail(function (e) {
                        expect(e).not.to.be.undefined;
                        done();
                    });
                });

                it('check for cache clearing ', function (done) {
                    testStorageInst.clear().done(function () {
                        expect(true).to.be.ok;
                        done();
                    }).fail(function (e) {
                        expect(e).to.be.undefined;
                        done();
                    });
                });

                it('check for cleared cache ', function (done) {
                    testStorageInst.keys().done(function (allKeys) {
                        expect(allKeys).to.be.empty;
                        done();
                    }).fail(function (e) {
                        expect(e).to.be.undefined;
                        done();
                    });
                });

                describe('with multiple caches', function () {
                    beforeEach(function () {
                        this.cache1 = testStorage.getInstance('TEST1');
                        this.cache2 = testStorage.getInstance('TEST2');
                        this.cache3 = testStorage.getInstance('TEST3');
                    });

                    it('should initialize an empty cache', function (done) {
                        $.when.apply([
                            this.cache1.keys(),
                            this.cache2.keys(),
                            this.cache3.keys()
                        ]).then(function (keys1, keys2, keys3) {
                            expect(keys1).to.be.empty;
                            expect(keys2).to.be.empty;
                            expect(keys3).to.be.empty;
                            done();
                        });
                    });

                    describe('and test data', function () {
                        beforeEach(function (done) {
                            var cache1 = this.cache1,
                                cache2 = this.cache2,
                                cache3 = this.cache3;

                            cache1.set('testKey1', 'testValue')
                            .then(function () {
                                return cache2.set('testKey2', 'testValue');
                            })
                            .then(function () {
                                return cache3.set('testKey3', 'testValue');
                            })
                            .then(function () {
                                done();
                            });
                        });

                        it('should correctly store values in each cache', function (done) {
                            var cache1 = this.cache1,
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
                                expect(result).to.deep.equal({
                                    cache1: ['testKey1'],
                                    cache2: ['testKey2'],
                                    cache3: ['testKey3']
                                });
                                done();
                            });
                        });

                        it('should clear cache1 correctly', function (done) {
                            var cache1 = this.cache1;

                            cache1.clear().then(function () {
                                return cache1.keys();
                            }).then(function (keys) {
                                expect(keys).to.be.empty;
                                done();
                            });
                        });

                        it('should not affect other caches when clearing cache', function (done) {
                            var cache1 = this.cache1,
                                cache2 = this.cache2,
                                cache3 = this.cache3;

                            cache1.clear().then(function () {
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
                            }).then(function (result) {
                                expect(result).to.deep.equal({
                                    cache1: [],
                                    cache2: ['testKey2'],
                                    cache3: ['testKey3']
                                });
                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});
