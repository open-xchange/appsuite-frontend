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

        beforeEach(function () {
            model = new Model({ data: data });
        });

        it('create instance', function () {
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
            model.set('city', '44135 Dortmund', {validate: true});
            expect(model.getChanges()).toEqual({ city: '44135 Dortmund' });
        });

        it('detects that model is dirty', function () {
            model.set('city', '44135 Dortmund', {validate: true});
            expect(model.isDirty()).toEqual(true);
        });

        it('triggers general change event', function () {
            var callback = sinon.spy(function (e, key, value) {
                expect(e.type).toEqual('change');
                expect(key).toEqual('firstName');
                expect(value).toEqual('Matthias B.');
            });
            model.off().on('change', callback);
            model.set('firstName', 'Matthias B.', {validate: true});
            expect(callback).toHaveBeenCalledOnce();
        });

        it('triggers specific change event', function () {
            var callback = sinon.spy(function (e, key, value) {
                expect(e.type).toEqual('change:firstName');
                expect(key).toEqual('firstName');
                expect(value).toEqual('Matthias B.');
            });
            model.off().on('change:firstName', callback);
            model.set('firstName', 'Matthias B.', {validate: true});
            expect(callback).toHaveBeenCalledOnce();
        });

        it('calling save resets model', function () {
            var callback = sinon.spy(function () {
                expect(model.getChanges()).toEqual({});
                expect(model.isDirty()).toEqual(false);
            });
            model.save().done(callback);
            expect(callback).toHaveBeenCalledOnce();
        });
    });

    describe('Model with schema', function () {

        beforeEach(function () {
            var ComplexModel = Model.extend({ schema: schema });
            schema.check = function (data, Error) {
                if (data.age < 0) {
                    return new Error('age', 'Age must be greater than 0');
                }
            };
            model = new ComplexModel({ data: data });
        });

        it('create instance', function () {
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

        it('triggers invalid format event', function () {
            var callback = sinon.spy(function (e, error) {
                expect(error.properties).toEqual(['familyName']);
                expect(model.get('familyName')).toEqual('');
            });
            // set value back
            model.set('familyName', 'B.', {validate: true});
            // catch error
            model.off().on('error:invalid', callback);
            model.set('familyName', '', {validate: true});
            expect(callback).toHaveBeenCalledOnce();
        });

        it('triggers inconsistency event', function () {
            var callback = sinon.spy(function (e, error) {
                expect(e.type).toEqual('error:invalid');
                expect(error.properties).toEqual(['age']);
                expect(model.get('age')).toEqual(-1);
            });
            model.off().on('error:invalid', callback);
            model.set('familyName', 'B.', {validate: true});
            model.set('age', -1, {validate: true});
            expect(callback).toHaveBeenCalledOnce();
        });

        it('detects that model is dirty', function () {
            model.set('familyName', 'B.', {validate: true});
            expect(model.isDirty()).toEqual(true);
        });

        it('returns all data via get()', function () {
            model.set('age', 34, {validate: true});
            model.set('email', 'matthias.biggeleben@open-xchange.com', {validate: true});
            expect(model.get()).toEqual({
                firstName: 'Matthias',
                familyName: '',
                city: 'Dortmund',
                country: 'Germany',
                age: 34,
                email: 'matthias.biggeleben@open-xchange.com'
            });
        });

        it('passes save without errors', function () {
            var errorCallback = sinon.spy(),
                doneCallback = sinon.spy(function () {
                expect(model.getChanges()).toEqual({});
                expect(model.isDirty()).toEqual(false);
            });
            model.off().on('error:invalid', errorCallback);
            model.set('familyName', 'B.', {validate: true});
            model.save().done(doneCallback);
            expect(doneCallback).toHaveBeenCalledOnce();
            expect(errorCallback).not.toHaveBeenCalled();
        });
    });

    describe('Model with computed properties', function () {

        beforeEach(function () {
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
        });

        it('create instance with a, b, c and computed props x, y, z, and mod', function () {
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

        it('check change event for x', function () {
            var callback = sinon.spy(function (e, key, value) {
                expect(e.type).toEqual('change:x');
                expect(key).toEqual('x');
                expect(value).toEqual('123400009');
            });
            model.off().on('change:x', callback);
            model.set('a', '0000', {validate: true});
            expect(callback).toHaveBeenCalledOnce();
        });

        it('check change event for x', function () {
            var callback = sinon.spy(function (e, key, value) {
                expect(e.type).toEqual('change:x');
                expect(key).toEqual('x');
                expect(value).toEqual('12345678#');
            });
            model.off().on('change:x', callback);
            model.set('b', '#', {validate: true});
            expect(callback).toHaveBeenCalledOnce();
        });

        it('check change event for y', function () {
            var callback = sinon.spy(function (e, key, value) {
                expect(e.type).toEqual('change:y');
                expect(key).toEqual('y');
                expect(value).toEqual(999);
            });
            model.off().on('change:y', callback);
            model.set('c', -1, {validate: true});
            expect(callback).toHaveBeenCalledOnce();
        });

        it('check change event for combined z', function () {
            var callback = sinon.spy(function (e, key, value) {
                expect(e.type).toEqual('change:z');
                expect(key).toEqual('z');
                expect(value).toEqual('1234----9_1111');
            });
            model.off().on('change:z', callback);
            model.set('a', '----', {validate: true});
            expect(callback).toHaveBeenCalledOnce();
        });

        it('check for the right set of change events', function () {
            var callback = sinon.spy();
            model.off().on('change:a change:b change:c change:x change:y change:z', callback);
            model.set('c', '1234', {validate: true});
            expect(callback).toHaveBeenCalledThrice();
        });

        it('check proper events for unchanged computed properties', function () {
            var callback = sinon.spy();
            model.off().on('change:mod', callback);
            model.set('d', 0, {validate: true}); // initial value -> no change, mod = 0
            model.set('d', 2, {validate: true}); // no change, mod = 0
            model.set('d', 4, {validate: true}); // no change, mod = 0
            model.set('d', 1, {validate: true}); // change!, mod = 1
            model.set('d', 2, {validate: true}); // change!, mod = 0
            model.set('d', 4, {validate: true}); // no change, mod = 0
            expect(callback).toHaveBeenCalledTwice();
        });
    });
});
