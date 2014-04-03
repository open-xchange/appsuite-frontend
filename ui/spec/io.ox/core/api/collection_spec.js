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

define(['io.ox/core/api/collection-loader'], function (CollectionLoader) {

    'use strict';

    function fetch(params) {
        return $.Deferred().resolve(
            params.limit === '0,3' ? [{ id: 10 }, { id: 20 }, { id: 30 }] : [{ id: 40 }, { id: 50 }, { id: 60 }]
        );
    }

    function fetchAlternative(params) {
        return $.Deferred().resolve(
            [{ id: 70 }, { id: 20 }, { id: 40 }, { id: 50 }, { id: 80 }]
        );
    }

    describe('Collection loader', function () {

        beforeEach(function () {
            this.loader = new CollectionLoader({ LIMIT: 3 });
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

            it('has a load method that returns a deferred object', function () {
                var def = this.loader.load();
                expect(def.promise).to.be.a('function');
                expect(def.done).to.be.a('function');
            });

            it('has a load method that loads initial data', function (done) {
                this.loader.load().done(function (collection) {
                    expect(collection).to.be.an.instanceof(Backbone.Collection);
                    expect(collection.pluck('id')).to.deep.equal([10, 20, 30]);
                    expect(collection.pluck('index')).to.deep.equal([0, 1, 2]);
                    done();
                });
            });

            it('has a paginate method that loads more data', function (done) {
                var loader = this.loader;
                this.loader.load().done(function () {
                    loader.paginate().done(function (collection) {
                        expect(collection.pluck('id')).to.deep.equal([10, 20, 30, 40, 50, 60]);
                        expect(collection.pluck('index')).to.deep.equal([0, 1, 2, 3, 4, 5]);
                        done();
                    });
                });
            });

            it('has a reload method that reloads data', function (done) {
                var loader = this.loader;
                this.loader.load().done(function () {
                    loader.fetch = fetchAlternative;
                    loader.reload().done(function (collection) {
                        expect(collection.pluck('id')).to.deep.equal([70, 20, 40, 50, 80]);
                        expect(collection.pluck('index')).to.deep.equal([0, 1, 2, 3, 4]);
                        done();
                    });
                });
            });
        });
    });
});
