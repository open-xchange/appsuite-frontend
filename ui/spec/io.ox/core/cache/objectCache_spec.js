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
    'io.ox/core/cache'
], function (ext, cache) {
    'use strict';

    describe('Cache', function () {
        /*
         * Suite: Cache Test
         */
        describe('ObjectCache', function () {

            var testStorage = new cache.ObjectCache('TEST_ObjectCache');

            var currentTimeStamp = (new Date()).getTime();
            var olderTimeStamp = currentTimeStamp - 1000;
            var newerTimeStamp = currentTimeStamp + 1000;

            var testKey = 'A.ABC';
            var testData1 = { 'folder_id': 'A', 'id': 'ABC', 'TEST': '1' };
            var testData2 = { 'folder_id': 'A', 'id': 'ABC', 'TEST': '2' };
            var testData3 = { 'folder_id': 'A', 'id': 'ABC', 'TEST': '3' };

            var testDataA = { 'folder_id': 'A', 'id': 'ABD', 'TEST': '1' };
            var testDataB = { 'folder_id': 'A', 'id': 'ABE', 'TEST': '1' };
            var testDataC = { 'folder_id': 'A', 'id': 'ABF', 'TEST': '1' };

            it('clearing cache', function (done) {
                testStorage.clear().done(function (check) {
                    expect(check).not.to.exist;
                    done();
                })
                .fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('getting not existing key', function (done) {
                testStorage.get('notexistent').done(function (data) {
                    expect(data).to.be.null;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('adding data ', function (done) {
                testStorage.add(testData1, currentTimeStamp).done(function (data) {
                    expect(data).to.equal(testKey);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('adding old data ', function (done) {
                testStorage.add(testData2, olderTimeStamp).done(function (data) {
                    expect(data).to.equal(testKey);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('getting data to test for old data replacement', function (done) {
                testStorage.get(testKey).done(function (data) {
                    expect(data).to.deep.equal(testData1);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('adding new data ', function (done) {
                testStorage.add(testData3, newerTimeStamp).done(function (data) {
                    expect(data).to.equal(testKey);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('getting data to test for new data replacement', function (done) {
                testStorage.get(testKey).done(function (data) {
                    expect(data).to.deep.equal(testData3);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('adding array of new data ', function (done) {
                testStorage.add([testData1, testDataA, testDataB, testDataC], currentTimeStamp).done(function (data) {
                    expect(data).to.deep.equal([ 'A.ABC', 'A.ABD', 'A.ABE', 'A.ABF' ]);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking for key existence', function (done) {
                testStorage.get(testKey).done(function (check) {
                    expect(check).not.to.be.null;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking for key existence on nonexisting key', function (done) {
                testStorage.get('fdfsgagsdg').done(function (check) {
                    expect(check).to.be.null;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking for array of key existence', function (done) {
                testStorage.get(['A.ABC', 'A.ABD']).done(function (check) {
                    expect(check).not.to.be.null;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking for object existence', function (done) {
                testStorage.get(testData1).done(function (check) {
                    expect(check).not.to.be.null;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking for array of object existence', function (done) {
                testStorage.get([testData1, testDataA]).done(function (check) {
                    expect(check).not.to.be.null;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking for array of mixed object/key existence', function (done) {
                testStorage.get([testData1, 'A.ABE']).done(function (check) {
                    expect(check).not.to.be.null;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking for array of mixed object/key existence with nonexistent key', function (done) {
                testStorage.get([testData1, 'A.ABX']).done(function (check) {
                    expect(check).to.be.null;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking cachesize before removing', function (done) {
                testStorage.size().done(function (size) {
                    expect(size, 'size').to.equal(4);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('removing by single key', function (done) {
                testStorage.remove(testKey).done(function () {
                    expect(true, 'item removed').to.be.true;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking cachesize after removing', function (done) {
                testStorage.size().done(function (size) {
                    expect(size).to.equal(3);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('removing by object', function (done) {
                testStorage.remove(testDataA).done(function () {
                    expect(true, 'item removed').to.be.true;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking cachesize after removing', function (done) {
                testStorage.size().done(function (size) {
                    expect(size).to.equal(2);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('removing by array of keys', function (done) {
                testStorage.remove(['A.ABE', 'A.ABF']).done(function () {
                    expect(true, 'items removed').to.be.true;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking cachesize after removing', function (done) {
                testStorage.size().done(function (size) {
                    expect(size).to.equal(0);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('merging objects', function (done) {
                testStorage.add(testData1).pipe(function () {
                    return testStorage.merge(testData2).pipe(function () {
                        return testStorage.get(testData1);
                    });
                }).done(function (value) {
                    expect(value).to.deep.equal(testData2);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('should be indifferent about key types', function (done) {
                var c = new cache.ObjectCache('my_cooltest', true, function (o) { return String(o.id); });
                $.when(
                    // add objects (with id … values are strings)
                    c.add({ id: '100' }),
                    c.add({ id: '102' })
                ).then(function () {
                    return c.size();
                }).then(function (r) {
                    expect(r).to.equal(2);
                }).then(function () {
                    // remove ids … (common use-case, values are numbers)
                    return c.remove([100]);
                }).then(function () {
                    return c.size();
                }).done(function (r) {
                    expect(r).to.equal(1);
                    done();
                });
            });
        });
    });
});
