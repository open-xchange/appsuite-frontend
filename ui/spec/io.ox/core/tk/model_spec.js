/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012 Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define(["io.ox/core/tk/model"], function (Model) {

    'use strict';

    var data = {
        firstName: 'Matthias',
       familyName: '',
       city: 'Dortmund'
    },
    schema = new Model.Schema({
        familyName: { mandatory: true },
        country: { defaultValue: 'Germany' },
        age: { format: 'number' },
        email: { format: 'email' }
    }),
    model;

    describe('Simple model without schema', function () {

        it('create instance', function () {
            model = new Model({ data: data });
            expect(model).toBeDefined();
        });

        it('returns proper data via get()', function () {
            expect(model.get('firstName')).toEqual('Matthias');
            expect(model.get('city')).toEqual('Dortmund');
        });

        it('returns undefined via get() if property does not exist', function () {
            expect(model.get('country')).toBeUndefined();
        });

        it('returns no changes', function () {
            expect(model.getChanges()).toEqual({});
        });

        it('returns property as not mandatory', function () {
            expect(model.schema.isMandatory('firstName')).toEqual(false);
            expect(model.schema.isMandatory('country')).toEqual(false);
        });

        it('detects that model is not dirty', function () {
            expect(model.isDirty()).toEqual(false);
        });

        it('change property value', function () {
            model.set('city', '44135 Dortmund', {validate: true});
            expect(model.get('city')).toEqual('44135 Dortmund');
        });

        it('returns one change', function () {
            expect(model.getChanges()).toEqual({ city: '44135 Dortmund' });
        });

        it('detects that model is dirty', function () {
            expect(model.isDirty()).toEqual(true);
        });

        //TODO: port to waitsFor
        it('triggers general change event', function () {
            var called = false;
            model.off().on('change', function (e, key, value) {
                expect(e.type).toEqual('change');
                expect(key).toEqual('firstName');
                expect(value).toEqual('Matthias B.');
                called = true;
            });
            model.set('firstName', 'Matthias B.', {validate: true});
            expect(called).toEqual(true);
        });

        //TODO: port to waitsFor
        it('triggers specific change event', function () {
            var called = false;
            model.off().on('change:firstName', function (e, key, value) {
                expect(e.type).toEqual('change:firstName');
                expect(key).toEqual('firstName');
                expect(value).toEqual('Matthias');
                called = true;
            });
            model.set('firstName', 'Matthias', {validate: true});
            expect(called).toEqual(true);
        });

        it('calling save resets model', function () {
            var called = false;
            model.save().done(function () {
                expect(model.getChanges()).toEqual({});
                expect(model.isDirty()).toEqual(false);
                called = true;
            });
            expect(called).toEqual(true);
        });
    });

    describe('Model with schema', function () {

        it('create instance', function () {
            var ComplexModel = Model.extend({ schema: schema });
            schema.check = function (data, Error) {
                if (data.age < 0) {
                    return new Error('age', 'Age must be greater than 0');
                }
            };
            model = new ComplexModel({ data: data });
            expect(model).toBeDefined();
        });

        it('returns changes based on default values', function () {
            expect(model.getChanges()).toEqual({ country: 'Germany' });
        });

        it('returns property as mandatory', function () {
            expect(model.schema.isMandatory('familyName')).toEqual(true);
        });

        it('detects that model is not dirty', function () {
            expect(model.isDirty()).toEqual(false);
        });

        it('setting mandatory property', function () {
            model.set('familyName', 'B.', {validate: true});
            expect(model.get('familyName')).toEqual('B.');
        });

        it('clearing mandatory property', function () {
            model.set('familyName', '', {validate: true});
            expect(model.get('familyName')).toEqual(''); // invalid states are allowed!
        });

        //TODO: port to waitsFor
        it('triggers invalid format event', function () {
            var called = false;
            // set value back
            model.set('familyName', 'B.', {validate: true});
            // catch error
            model.off().on('error:invalid', function (e, error) {
                expect(error.properties).toEqual(['familyName']);
                expect(model.get('familyName')).toEqual('');
                called = true;
            });
            model.set('familyName', '', {validate: true});
            expect(called).toEqual(true);
        });

        //TODO: port to waitsFor
        it('triggers inconsistency event', function () {
            var called = false;
            model.off().on('error:invalid', function (e, error) {
                expect(e.type).toEqual('error:invalid');
                expect(error.properties).toEqual(['age']);
                expect(model.get('age')).toEqual(-1);
                called = true;
            });
            model.set('familyName', 'B.', {validate: true});
            model.set('age', -1, {validate: true});
            model.save();
            expect(called).toEqual(true);
        });

        it('detects that model is dirty', function () {
            expect(model.isDirty()).toEqual(true);
        });

        it('returns all data via get()', function () {
            model.set('age', 34, {validate: true});
            model.set('email', 'matthias.biggeleben@open-xchange.com', {validate: true});
            expect(model.get()).toEqual({
                firstName: 'Matthias',
                familyName: 'B.',
                city: 'Dortmund',
                country: 'Germany',
                age: 34,
                email: 'matthias.biggeleben@open-xchange.com'
            });
        });

        //TODO: port to waitsFor
        it('passes save without errors', function () {
            var errors = 'No errors', done = 'Not done';
            model.off().on('error:invalid', function (e, error) {
                console.debug('Error', arguments);
                errors = 'Errors';
            });
            model.save().done(function () {
                expect(model.getChanges()).toEqual({});
                expect(model.isDirty()).toEqual(false);
                done = 'Done';
            });
            expect(done).toEqual('Done');
            expect(errors).toEqual('No errors');
        });
    });

    describe('Model with computed properties', function () {

        it('create instance with a, b, c and computed props x, y, z, and mod', function () {

            var CModel = Model
                .extend({ schema: schema })
                .addComputed('x', ['a', 'b'], function (a, b) {
                    return '1234' + a + b;
                })
                .addComputed('y', ['c'], function (c) {
                    return 1000 + c;
                })
                .addComputed('z', ['x', 'y'], function (x, y) {
                    return x + '_' + y;
                })
                .addComputed('mod', ['d'], function (d) {
                    return d % 2;
                });

            model = new CModel({ data: { a: '5678', b: 9, c: 111, d: 0 } });
            expect(model).toBeDefined();
        });

        it('x has correct value', function () {
            expect(model.get('x')).toEqual('123456789');
        });

        it('y has correct value', function () {
            expect(model.get('y')).toEqual(1111);
        });

        it('z has correct value', function () {
            expect(model.get('z')).toEqual('123456789_1111');
        });

        //TODO: port to waitsFor
        it('check change event for x', function () {
            var called = false;
            model.off().on('change:x', function (e, key, value) {
                expect(e.type).toEqual('change:x');
                expect(key).toEqual('x');
                expect(value).toEqual('123400009');
                called = true;
            });
            model.set('a', '0000', {validate: true});
            expect(called).toEqual(true);
        });

        //TODO: port to waitsFor
        it('check change event for x', function () {
            var called = false;
            model.off().on('change:x', function (e, key, value) {
                expect(e.type).toEqual('change:x');
                expect(key).toEqual('x');
                expect(value).toEqual('12340000#');
                called = true;
            });
            model.set('b', '#', {validate: true});
            expect(called).toEqual(true);
        });

        //TODO: port to waitsFor
        it('check change event for y', function () {
            var called = false;
            model.off().on('change:y', function (e, key, value) {
                expect(e.type).toEqual('change:y');
                expect(key).toEqual('y');
                expect(value).toEqual(999);
                called = true;
            });
            model.set('c', -1, {validate: true});
            expect(called).toEqual(true);
        });

        //TODO: port to waitsFor
        it('check change event for combined z', function () {
            var called = 0;
            model.off().on('change:z', function (e, key, value) {
                expect(e.type).toEqual('change:z');
                expect(key).toEqual('z');
                expect(value).toEqual('1234----#_999');
                called++;
            });
            model.set('a', '----', {validate: true});
            expect(called).toEqual(1);
        });

        //TODO: port to waitsFor
        it('check for the right set of change events', function () {
            var called = 0;
            model.off().on('change:a change:b change:c change:x change:y change:z', function (e, key, value) {
                called++;
            });
            model.set('c', '1234', {validate: true});
            expect(called).toEqual(3);
        });

        //TODO: port to waitsFor
        it('check proper events for unchanged computed properties', function () {
            var called = 0;
            model.off().on('change:mod', function (e, key, value) {
                called++;
            });
            model.set('d', 0, {validate: true}); // initial value -> no change, mod = 0
            model.set('d', 2, {validate: true}); // no change, mod = 0
            model.set('d', 4, {validate: true}); // no change, mod = 0
            model.set('d', 1, {validate: true}); // change!, mod = 1
            model.set('d', 2, {validate: true}); // change!, mod = 0
            model.set('d', 4, {validate: true}); // no change, mod = 0
            expect(called).toEqual(2);
        });
    });
});
