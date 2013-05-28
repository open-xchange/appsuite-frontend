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
 */

define("io.ox/core/test/model",
    ["io.ox/core/extensions", "io.ox/core/tk/model"], function (ext, Model) {

    'use strict';

    /*
     * Suite: Model Test
     */
    ext.point('test/suite').extend({
        id: 'core-model',
        index: 100,
        test: function (j) {

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

            j.describe('Simple model without schema', function () {

                j.it('create instance', function () {
                    model = new Model({ data: data });
                    j.expect(model).toBeDefined();
                });

                j.it('returns proper data via get()', function () {
                    j.expect(model.get('firstName')).toEqual('Matthias');
                    j.expect(model.get('city')).toEqual('Dortmund');
                });

                j.it('returns undefined via get() if property does not exist', function () {
                    j.expect(model.get('country')).toBeUndefined();
                });

                j.it('returns no changes', function () {
                    j.expect(model.getChanges()).toEqual({});
                });

                j.it('returns property as not mandatory', function () {
                    j.expect(model.schema.isMandatory('firstName')).toEqual(false);
                    j.expect(model.schema.isMandatory('country')).toEqual(false);
                });

                j.it('detects that model is not dirty', function () {
                    j.expect(model.isDirty()).toEqual(false);
                });

                j.it('change property value', function () {
                    model.set('city', '44135 Dortmund', {validate: true});
                    j.expect(model.get('city')).toEqual('44135 Dortmund');
                });

                j.it('returns one change', function () {
                    j.expect(model.getChanges()).toEqual({ city: '44135 Dortmund' });
                });

                j.it('detects that model is dirty', function () {
                    j.expect(model.isDirty()).toEqual(true);
                });

                j.it('triggers general change event', function () {
                    var called = false;
                    model.off().on('change', function (e, key, value) {
                        j.expect(e.type).toEqual('change');
                        j.expect(key).toEqual('firstName');
                        j.expect(value).toEqual('Matthias B.');
                        called = true;
                    });
                    model.set('firstName', 'Matthias B.', {validate: true});
                    j.expect(called).toEqual(true);
                });

                j.it('triggers specific change event', function () {
                    var called = false;
                    model.off().on('change:firstName', function (e, key, value) {
                        j.expect(e.type).toEqual('change:firstName');
                        j.expect(key).toEqual('firstName');
                        j.expect(value).toEqual('Matthias');
                        called = true;
                    });
                    model.set('firstName', 'Matthias', {validate: true});
                    j.expect(called).toEqual(true);
                });

                j.it('calling save resets model', function () {
                    var called = false;
                    model.save().done(function () {
                        j.expect(model.getChanges()).toEqual({});
                        j.expect(model.isDirty()).toEqual(false);
                        called = true;
                    });
                    j.expect(called).toEqual(true);
                });
            });

            j.describe('Model with schema', function () {

                j.it('create instance', function () {
                    var ComplexModel = Model.extend({ schema: schema });
                    schema.check = function (data, Error) {
                        if (data.age < 0) {
                            return new Error('age', 'Age must be greater than 0');
                        }
                    };
                    model = new ComplexModel({ data: data });
                    j.expect(model).toBeDefined();
                });

                j.it('returns changes based on default values', function () {
                    j.expect(model.getChanges()).toEqual({ country: 'Germany' });
                });

                j.it('returns property as mandatory', function () {
                    j.expect(model.schema.isMandatory('familyName')).toEqual(true);
                });

                j.it('detects that model is not dirty', function () {
                    j.expect(model.isDirty()).toEqual(false);
                });

                j.it('setting mandatory property', function () {
                    model.set('familyName', 'B.', {validate: true});
                    j.expect(model.get('familyName')).toEqual('B.');
                });

                j.it('clearing mandatory property', function () {
                    model.set('familyName', '', {validate: true});
                    j.expect(model.get('familyName')).toEqual(''); // invalid states are allowed!
                });

                j.it('triggers invalid format event', function () {
                    var called = false;
                    // set value back
                    model.set('familyName', 'B.', {validate: true});
                    // catch error
                    model.off().on('error:invalid', function (e, error) {
                        j.expect(error.properties).toEqual(['familyName']);
                        j.expect(model.get('familyName')).toEqual('');
                        called = true;
                    });
                    model.set('familyName', '', {validate: true});
                    j.expect(called).toEqual(true);
                });

                j.it('triggers inconsistency event', function () {
                    var called = false;
                    model.off().on('error:invalid', function (e, error) {
                        j.expect(e.type).toEqual('error:invalid');
                        j.expect(error.properties).toEqual(['age']);
                        j.expect(model.get('age')).toEqual(-1);
                        called = true;
                    });
                    model.set('familyName', 'B.', {validate: true});
                    model.set('age', -1, {validate: true});
                    model.save();
                    j.expect(called).toEqual(true);
                });

                j.it('detects that model is dirty', function () {
                    j.expect(model.isDirty()).toEqual(true);
                });

                j.it('returns all data via get()', function () {
                    model.set('age', 34, {validate: true});
                    model.set('email', 'matthias.biggeleben@open-xchange.com', {validate: true});
                    j.expect(model.get()).toEqual({
                        firstName: 'Matthias',
                        familyName: 'B.',
                        city: 'Dortmund',
                        country: 'Germany',
                        age: 34,
                        email: 'matthias.biggeleben@open-xchange.com'
                    });
                });

                j.it('passes save without errors', function () {
                    var errors = 'No errors', done = 'Not done';
                    model.off().on('error:invalid', function (e, error) {
                        console.debug('Error', arguments);
                        errors = 'Errors';
                    });
                    model.save().done(function () {
                        j.expect(model.getChanges()).toEqual({});
                        j.expect(model.isDirty()).toEqual(false);
                        done = 'Done';
                    });
                    j.expect(done).toEqual('Done');
                    j.expect(errors).toEqual('No errors');
                });
            });

            j.describe('Model with computed properties', function () {

                j.it('create instance with a, b, c and computed props x, y, z, and mod', function () {

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
                    j.expect(model).toBeDefined();
                });

                j.it('x has correct value', function () {
                    j.expect(model.get('x')).toEqual('123456789');
                });

                j.it('y has correct value', function () {
                    j.expect(model.get('y')).toEqual(1111);
                });

                j.it('z has correct value', function () {
                    j.expect(model.get('z')).toEqual('123456789_1111');
                });

                j.it('check change event for x', function () {
                    var called = false;
                    model.off().on('change:x', function (e, key, value) {
                        j.expect(e.type).toEqual('change:x');
                        j.expect(key).toEqual('x');
                        j.expect(value).toEqual('123400009');
                        called = true;
                    });
                    model.set('a', '0000', {validate: true});
                    j.expect(called).toEqual(true);
                });

                j.it('check change event for x', function () {
                    var called = false;
                    model.off().on('change:x', function (e, key, value) {
                        j.expect(e.type).toEqual('change:x');
                        j.expect(key).toEqual('x');
                        j.expect(value).toEqual('12340000#');
                        called = true;
                    });
                    model.set('b', '#', {validate: true});
                    j.expect(called).toEqual(true);
                });

                j.it('check change event for y', function () {
                    var called = false;
                    model.off().on('change:y', function (e, key, value) {
                        j.expect(e.type).toEqual('change:y');
                        j.expect(key).toEqual('y');
                        j.expect(value).toEqual(999);
                        called = true;
                    });
                    model.set('c', -1, {validate: true});
                    j.expect(called).toEqual(true);
                });

                j.it('check change event for combined z', function () {
                    var called = 0;
                    model.off().on('change:z', function (e, key, value) {
                        j.expect(e.type).toEqual('change:z');
                        j.expect(key).toEqual('z');
                        j.expect(value).toEqual('1234----#_999');
                        called++;
                    });
                    model.set('a', '----', {validate: true});
                    j.expect(called).toEqual(1);
                });

                j.it('check for the right set of change events', function () {
                    var called = 0;
                    model.off().on('change:a change:b change:c change:x change:y change:z', function (e, key, value) {
                        called++;
                    });
                    model.set('c', '1234', {validate: true});
                    j.expect(called).toEqual(3);
                });

                j.it('check proper events for unchanged computed properties', function () {
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
                    j.expect(called).toEqual(2);
                });
            });
        }
    });
});
