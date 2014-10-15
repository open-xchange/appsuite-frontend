/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define(['io.ox/core/fluent'], function (FluentCache) {

    'use strict';

    describe('Fluent cache.', function () {

        beforeEach(function () {
            this.cache = new FluentCache();
        });

        describe('Instance.', function () {

            it('defines a proper interface', function () {
                expect(this.cache.hash).to.be.an('object');
                expect(this.cache.get).to.be.a('function');
                expect(this.cache.set).to.be.a('function');
                expect(this.cache.has).to.be.a('function');
                expect(this.cache.remove).to.be.a('function');
                expect(this.cache.purge).to.be.a('function');
                expect(this.cache.clear).to.be.a('function');
                expect(this.cache.keys).to.be.a('function');
            });

            it('starts with an empty object', function () {
                expect(this.cache.hash).to.deep.equal({});
            });

            it('returns no keys while empty', function () {
                var keys = this.cache.keys();
                expect(keys).to.be.empty;
            });
        });

        describe('Adding key/value.', function () {

            it('adds an item', function () {
                this.cache.set('foo', 1337);
                expect(this.cache.hash).to.deep.equal({ 'foo': 1337 });
            });

            it('adds two items', function () {
                this.cache.set('foo', 1337);
                this.cache.set('hello', 'world');
                expect(this.cache.hash).to.deep.equal({ 'foo': 1337, 'hello': 'world' });
            });

            it('does not accept undefined keys (explicit)', function () {
                this.cache.set(undefined);
                expect(this.cache.hash).to.deep.equal({});
            });

            it('does not accept undefined keys (missing)', function () {
                this.cache.set();
                expect(this.cache.hash).to.deep.equal({});
            });

            it('does not accept undefined data (explicit)', function () {
                this.cache.set('foo', undefined);
                expect(this.cache.hash).to.deep.equal({});
            });

            it('does not accept undefined data (missing)', function () {
                this.cache.set('foo');
                expect(this.cache.hash).to.deep.equal({});
            });

            it('contains an item', function () {
                this.cache.set('foo', 1337);
                expect(this.cache.has('foo')).to.be.true;
            });

            it('does not contain an item', function () {
                this.cache.set('hello', 'world');
                expect(this.cache.has('foo')).to.be.false;
            });

            it('contains an item', function () {
                this.cache.set('foo', 1337);
                expect(this.cache.has('foo')).to.be.true;
            });
        });

        describe('Adding objects.', function () {

            it('determines proper key (string)', function () {
                var key = this.cache.getKey('test');
                expect(key).to.deep.equal('test');
            });

            it('determines proper key (object)', function () {
                var key = this.cache.getKey({ folder_id: 'foo', id: 1337 });
                expect(key).to.deep.equal('foo.1337');
            });

            it('determines proper key (empty)', function () {
                var key = this.cache.getKey();
                expect(key).to.deep.equal('undefined');
            });

            it('determines proper key (zero)', function () {
                var key = this.cache.getKey(0);
                expect(key).to.deep.equal('0');
            });

            it('adds an object', function () {
                this.cache.set({ folder_id: 'yippi', id: 'yeah', test: 1337 });
                expect(this.cache.keys()).to.deep.equal(['yippi.yeah']);
            });

            it('adds an object with custom serialize function', function () {
                this.cache.serialize = function (obj) {
                    return obj.id;
                };
                this.cache.set({ folder_id: 'yippi', id: 'yeah', test: 1337 });
                expect(this.cache.keys()).to.deep.equal(['yeah']);
            });
        });

        describe('Handling items.', function () {

            beforeEach(function () {
                // add some keys
                _('hello/1 hello/2 hello/3 foo/1 foo/2 hello/4'.split(' ')).each(function (key) {
                    this.cache.set(key, 1337);
                }, this);
            });

            it('returns sorted keys', function () {
                expect(this.cache.keys()).to.deep.equal(['foo/1', 'foo/2', 'hello/1', 'hello/2', 'hello/3', 'hello/4']);
            });

            it('removes an item', function () {
                expect(this.cache.has('foo/1')).to.be.true;
                this.cache.remove('foo/1');
                expect(this.cache.has('foo/1')).to.be.false;
            });

            it('purges some items', function () {
                // check
                expect(this.cache.has('hello/1')).to.be.true;
                expect(this.cache.has('foo/1')).to.be.true;
                expect(this.cache.has('foo/2')).to.be.true;
                // purge foo
                this.cache.purge('foo');
                expect(this.cache.has('hello/1')).to.be.true;
                expect(this.cache.has('foo/1')).to.be.false;
                expect(this.cache.has('foo/2')).to.be.false;
                expect(this.cache.keys()).to.deep.equal(['hello/1', 'hello/2', 'hello/3', 'hello/4']);
            });

            it('clears the hash', function () {
                expect(this.cache.has('hello/1')).to.be.true;
                this.cache.clear();
                expect(this.cache.keys()).to.be.empty;
            });
        });
    });
});
