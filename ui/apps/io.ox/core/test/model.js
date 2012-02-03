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
                schema = {
                    familyName: { mandatory: true },
                    country: { defaultValue: 'Germany' },
                    age: { format: 'number' }
                },
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
                    j.expect(model.isMandatory('firstName')).toEqual(false);
                    j.expect(model.isMandatory('country')).toEqual(false);
                });

                j.it('detects that model is not dirty', function () {
                    j.expect(model.isDirty()).toEqual(false);
                });

                j.it('change property value', function () {
                    model.set('city', '44135 Dortmund');
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
                    model.on('change', function (e, key, value) {
                        j.expect(e.type).toEqual('change');
                        j.expect(key).toEqual('firstName');
                        j.expect(value).toEqual('Matthias B.');
                        model.off();
                        called = true;
                    });
                    model.set('firstName', 'Matthias B.');
                    called = true;
                });

                j.it('triggers specific change event', function () {
                    var called = false;
                    model.on('change:firstName', function (e, key, value) {
                        j.expect(e.type).toEqual('change:firstName');
                        j.expect(key).toEqual('firstName');
                        j.expect(value).toEqual('Matthias');
                        model.off();
                        called = true;
                    });
                    model.set('firstName', 'Matthias');
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
                    var ComplexModel = Model.extend({
                        schema: schema,
                        checkConsistency: function (data, Error) {
                            if (data.age < 0) {
                                return new Error('age', 'Age must be greater than 0');
                            }
                        }
                    });
                    model = new ComplexModel({ data: data });
                    j.expect(model).toBeDefined();
                });

                j.it('returns changes based on default values', function () {
                    j.expect(model.getChanges()).toEqual({ country: 'Germany' });
                });

                j.it('returns property as mandatory', function () {
                    j.expect(model.isMandatory('familyName')).toEqual(true);
                });

                j.it('detects that model is not dirty', function () {
                    j.expect(model.isDirty()).toEqual(false);
                });

                j.it('setting mandatory property', function () {
                    model.set('familyName', 'B.');
                    j.expect(model.get('familyName')).toEqual('B.');
                });

                j.it('clearing mandatory property', function () {
                    model.set('familyName', '');
                    j.expect(model.get('familyName')).toEqual('B.');
                });

                j.it('triggers invalid format event', function () {
                    var called = false;
                    model.on('error:invalid', function (e, error) {
                        j.expect(error.properties).toEqual(['familyName']);
                        j.expect(model.get('familyName')).toEqual('B.');
                        model.off();
                        called = true;
                    });
                    model.set('familyName', '');
                    j.expect(called).toEqual(true);
                });

                j.it('triggers inconsistency event', function () {
                    var called = false;
                    model.on('error:invalid error:inconsistent', function (e, error) {
                        j.expect(e.type).toEqual('error:inconsistent');
                        j.expect(error.properties).toEqual(['age']);
                        j.expect(model.get('age')).toEqual(-1);
                        model.off();
                        called = true;
                    });
                    model.set('age', -1);
                    model.save();
                    j.expect(called).toEqual(true);
                });

                j.it('detects that model is dirty', function () {
                    j.expect(model.isDirty()).toEqual(true);
                });

                j.it('returns all data via get()', function () {
                    model.set('age', 34);
                    j.expect(model.get()).toEqual({ firstName: 'Matthias', familyName: 'B.', city: 'Dortmund', country: 'Germany', age: 34 });
                });

                j.it('passes save without errors', function () {
                    var errors = 'No errors', done = 'Not done';
                    model.on('error:invalid error:inconsistent', function (e, error) {
                        console.log('Error', arguments);
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
        }
    });
});