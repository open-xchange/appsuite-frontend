/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
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
        describe('SimpleCache', function () {

            var testStorage = new cache.SimpleCache('TEST_SimpleCache');

            var currentTimeStamp = (new Date()).getTime();
            var olderTimeStamp = currentTimeStamp - 1000;
            var newerTimeStamp = currentTimeStamp + 1000;

            var testKey = 'MySimpleCacheTestkey';
            var testKeyRegex = 'Simple';
            var testData1 = 'ABC';
            var testData2 = 'DEF';
            var testData3 = 'GHI';

            it('clearing cache', function (done) {
                testStorage.clear().done(function (check) {
                    expect(check).not.to.exist;
                    done();
                }).fail(function (e) {
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
                testStorage.add(testKey, testData1, currentTimeStamp).done(function (data) {
                    expect(data).to.deep.equal(testData1);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('adding old data but it will not be stored', function (done) {
                testStorage.add(testKey, testData2, olderTimeStamp).done(function (data) {
                    expect(data).to.deep.equal(testData1);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('adding new data', function (done) {
                testStorage.add(testKey, testData3, newerTimeStamp).done(function (data) {
                    expect(data).to.deep.equal(testData3);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking key', function (done) {
                testStorage.get(testKey).done(function (data) {
                    expect(data).not.to.be.null;
                    done();
                });
            });

            it('getting timestamp for key', function (done) {
                testStorage.time(testKey).done(function (time) {
                    expect(time).to.equal(newerTimeStamp);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('getting all keys', function (done) {
                testStorage.keys().done(function (keys) {
                    expect(keys).to.deep.equal([testKey]);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('grepping keys', function (done) {
                testStorage.grepKeys(testKeyRegex).done(function (keys) {
                    expect(keys).to.deep.equal([testKey]);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking cache size', function (done) {
                testStorage.size().done(function (size) {
                    expect(size).to.equal(1);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('getting all values', function (done) {
                testStorage.values().done(function (values) {
                    expect(values).to.deep.equal([testData3]);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('remove by key', function (done) {
                testStorage.remove(testKey).done(function () {
                    expect(true, 'item removed').to.be.true;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking cache size', function (done) {
                testStorage.size().done(function (size) {
                    expect(size).to.equal(0);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('adding data ', function (done) {
                testStorage.add(testKey, testData1, currentTimeStamp).done(function (data) {
                    expect(data).to.deep.equal(testData1);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('remove by key Array', function (done) {
                testStorage.remove([testKey]).done(function () {
                    expect(true, 'item removed').to.be.true;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking cache size', function (done) {
                testStorage.size().done(function (size) {
                    expect(size).to.equal(0);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('adding data', function (done) {
                testStorage.add(testKey, testData1, currentTimeStamp).done(function (data) {
                    expect(data).to.deep.equal(testData1);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('grepRemove by key', function (done) {
                testStorage.grepRemove(testKeyRegex).done(function () {
                    expect(true, 'item removed').to.be.true;
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });

            it('checking cache size', function (done) {
                testStorage.size().done(function (size) {
                    expect(size).to.equal(0);
                    done();
                }).fail(function (e) {
                    expect(e).not.to.exist;
                    done();
                });
            });
        });
    });
});
