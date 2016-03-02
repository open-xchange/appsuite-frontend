/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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

    function fetchAlternative(params) {
        return $.Deferred().resolve(
            [{ id: 70 }, { id: 20 }, { id: 40 }, { id: 50 }, { id: 80 }]
        );
    }
    describe('Core Collection', function () {
        describe('loader', function () {

            beforeEach(function () {
                this.loader = new CollectionLoader({ PRIMARY_PAGE_SIZE: 3, SECONDARY_PAGE_SIZE: 3 });
                this.loader.fetch = fetch;
            });

            describe('cid()', function () {

                it('is a function', function () {
                    expect(this.loader.cid).to.be.a('function');
                });

                it('handles missing parameters correctly', function () {
                    expect(this.loader.cid()).to.equal('default');
                });

                it('handles empty object correctly', function () {
                    expect(this.loader.cid({})).to.equal('default');
                });

                it('returns correct composite ID', function () {
                    expect(this.loader.cid({ a: 1, b: 2 })).to.equal('a=1&b=2');
                });
            });

            describe('addIndex()', function () {

                it('is a function', function () {
                    expect(this.loader.addIndex).to.be.a('function');
                });

                it('injects index property', function () {
                    var data = [{ a: 10 }];
                    this.loader.addIndex(0, {}, data);
                    expect(data).to.deep.equal([{ a: 10, index: 0 }]);
                });

                it('calls each()', function () {
                    var data = [{ a: 10 }];
                    this.loader.each = function (obj) { obj.test = true; };
                    this.loader.addIndex(0, {}, data);
                    expect(data).to.deep.equal([{ a: 10, index: 0, test: true }]);
                });
            });

            describe('Instance', function () {

                it('returns a collection', function () {
                    expect(this.loader.getDefaultCollection()).to.be.an.instanceof(Backbone.Collection);
                    expect(this.loader.getCollection()).to.be.an.instanceof(Backbone.Collection);
                });

                it('has a load method that returns a collection', function () {
                    var collection = this.loader.load();
                    expect(collection).to.be.an.instanceof(Backbone.Collection);
                });

                it('has a load method that loads initial data', function (done) {
                    var collection = this.loader.load();
                    collection.once('load', function () {
                        expect(this.pluck('id')).to.deep.equal([10, 20, 30]);
                        expect(this.pluck('index')).to.deep.equal([0, 1, 2]);
                        done();
                    });
                });

                it('has a paginate method that loads more data', function (done) {
                    var loader = this.loader;
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
                    var loader = this.loader;
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
