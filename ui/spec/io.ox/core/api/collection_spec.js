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

define(['io.ox/core/api/collection-facade'], function (CollectionFacade) {

    'use strict';

    // jasmin helper
    function Done() {
        var f = function () { return !!f.value; };
        f.yep = function () { f.value = true; };
        return f;
    }

    function httpGet(params) {
        return $.Deferred().resolve(
            params.limit === '0,3' ? [{ id: 10 },{ id: 20 },{ id: 30 }] : [{ id: 40 },{ id: 50 },{ id: 60 }]
        );
    }

    function httpGetAlternative(params) {
        return $.Deferred().resolve(
            [{ id: 70 },{ id: 20 },{ id: 40 },{ id: 50 },{ id: 80 }]
        );
    }

    describe('Collection facade', function () {

        beforeEach(function () {
            this.facade = new CollectionFacade({ LIMIT: 3 });
            this.facade.httpGet = httpGet;
        });

        describe('cid()', function () {

            it('is a function', function () {
                expect(this.facade.cid).toBeFunction();
            });

            it('handles missing parameters correctly', function () {
                expect(this.facade.cid()).toBe('default');
            });

            it('handles empty object correctly', function () {
                expect(this.facade.cid({})).toBe('default');
            });

            it('returns correct composite ID', function () {
                expect(this.facade.cid({ a: 1, b: 2 })).toBe('a=1&b=2');
            });
        });

        describe('addIndex()', function () {

            it('is a function', function () {
                expect(this.facade.addIndex).toBeFunction();
            });

            it('injects index property', function () {
                var data = [{ a: 10 }];
                this.facade.addIndex(0, data);
                expect(data).toEqual([{ a: 10, index: 0 }]);
            });

            it('calls each()', function () {
                var data = [{ a: 10 }];
                this.facade.each = function (obj) { obj.test = true; };
                this.facade.addIndex(0, data);
                expect(data).toEqual([{ a: 10, index: 0, test: true }]);
            });
        });

        describe('Instance', function () {

            it('returns a collection', function () {
                expect(this.facade.getDefaultCollection() instanceof Backbone.Collection).toBe(true);
                expect(this.facade.getCollection() instanceof Backbone.Collection).toBe(true);
            });

            it('has a load method that returns a deferred object', function () {
                var def = this.facade.load();
                expect(def.promise).toBeFunction();
                expect(def.done).toBeFunction();
            });

            it('has a load method that loads initial data', function () {
                var done = new Done();
                waitsFor(done);
                this.facade.load().done(function (collection) {
                    expect(collection instanceof Backbone.Collection).toBe(true);
                    expect(collection.pluck('id')).toEqual([10,20,30]);
                    expect(collection.pluck('index')).toEqual([0,1,2]);
                    done.yep();
                });
            });

            it('has a paginate method that loads more data', function () {
                var done = new Done(), facade = this.facade;
                waitsFor(done);
                this.facade.load().done(function () {
                    facade.paginate().done(function (collection) {
                        expect(collection.pluck('id')).toEqual([10,20,30,40,50,60]);
                        expect(collection.pluck('index')).toEqual([0,1,2,3,4,5]);
                        done.yep();
                    });
                });
            });

            it('has a reload method that reloads data', function () {
                var done = new Done(), facade = this.facade;
                waitsFor(done);
                this.facade.load().done(function () {
                    facade.httpGet = httpGetAlternative;
                    facade.reload().done(function (collection) {
                        expect(collection.pluck('id')).toEqual([70,20,40,50,80]);
                        expect(collection.pluck('index')).toEqual([0,1,2,3,4]);
                        done.yep();
                    });
                });
            });
        });
    });
});
