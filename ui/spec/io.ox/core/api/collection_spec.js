/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define([
    'io.ox/core/api/collection-loader',
    'io.ox/core/api/collection-pool'
], function (CollectionLoader, Pool) {

    'use strict';

    function fetch(params) {
        var result = [{ id: 10 }, { id: 20 }, { id: 30 }, { id: 40 }, { id: 50 }, { id: 60 }];
        return $.Deferred().resolve(
            result.slice.apply(result, params.limit.split(','))
        );
    }

    function fetchAlternative() {
        return $.Deferred().resolve(
            [{ id: 70 }, { id: 20 }, { id: 40 }, { id: 50 }, { id: 80 }]
        );
    }
    describe('Core Collection', function () {
        describe('loader', function () {
            var loader;

            beforeEach(function () {
                loader = new CollectionLoader({
                    PRIMARY_PAGE_SIZE: 3,
                    SECONDARY_PAGE_SIZE: 3,
                    getQueryParams: function () {
                        return {
                            folder: 'default0/INBOX'
                        };
                    }
                });
                loader.fetch = fetch;
            });

            describe('cid()', function () {

                it('is a function', function () {
                    expect(loader.cid).to.be.a('function');
                });

                it('handles missing parameters correctly', function () {
                    expect(loader.cid()).to.equal('default');
                });

                it('handles empty object correctly', function () {
                    expect(loader.cid({})).to.equal('default');
                });

                it('returns correct composite ID', function () {
                    expect(loader.cid({ a: 1, b: 2 })).to.equal('a=1&b=2');
                });
            });

            describe('addIndex()', function () {

                it('is a function', function () {
                    expect(loader.addIndex).to.be.a('function');
                });

                it('injects index property', function () {
                    var data = [{ a: 10 }];
                    loader.addIndex(0, {}, data);
                    expect(data).to.deep.equal([{ a: 10, index: 0 }]);
                });

                it('calls each()', function () {
                    var data = [{ a: 10 }];
                    loader.each = function (obj) { obj.test = true; };
                    loader.addIndex(0, {}, data);
                    expect(data).to.deep.equal([{ a: 10, index: 0, test: true }]);
                });
            });

            describe('Instance', function () {

                it('returns a collection', function () {
                    expect(loader.getDefaultCollection()).to.be.an.instanceof(Backbone.Collection);
                    expect(loader.getCollection()).to.be.an.instanceof(Backbone.Collection);
                });

                it('has a load method that returns a collection', function () {
                    var collection = loader.load();
                    expect(collection).to.be.an.instanceof(Backbone.Collection);
                });

                it('has a load method that loads initial data', function (done) {
                    var collection = loader.load();
                    collection.once('load', function () {
                        expect(this.pluck('id')).to.deep.equal([10, 20, 30]);
                        expect(this.pluck('index')).to.deep.equal([0, 1, 2]);
                        done();
                    });
                });

                it('has a paginate method that loads more data', function (done) {
                    loader.load().once('load', function () {
                        expect(this.pluck('id')).to.deep.equal([10, 20, 30]);
                        expect(this.pluck('index')).to.deep.equal([0, 1, 2]);
                        loader.paginate().once('paginate', function () {
                            expect(this.pluck('id')).to.deep.equal([10, 20, 30, 40, 50, 60]);
                            expect(this.pluck('index')).to.deep.equal([0, 1, 2, 3, 4, 5]);
                            done();
                        });
                    });
                });

                it('has a reload method that reloads data', function (done) {
                    loader.load().once('load', function () {
                        loader.fetch = fetchAlternative;
                        loader.reload().once('reload', function () {
                            expect(this.pluck('id')).to.deep.equal([70, 20, 40, 50, 80]);
                            expect(this.pluck('index')).to.deep.equal([0, 1, 2, 3, 4]);
                            done();
                        });
                    });
                });
            });
        });
        describe('Pool', function () {
            var pool;
            beforeEach(function () {
                pool = Pool.create('collection_spec');
            });
            afterEach(function () {
                pool.get('collection_spec').reset();
            });

            describe('add()', function () {
                it('should add a new element to the pool', function () {
                    var obj = {
                            id: '1337',
                            folder_id: '1338'
                        },
                        collection = pool.get('detail'),
                        c;
                    expect(collection.get(_.cid(obj))).not.to.exist;
                    c = pool.add('detail', obj);
                    expect(c).to.be.an('object');
                    expect(collection.get(_.cid(obj))).to.be.an('object');
                });
            });
        });
    });
});
