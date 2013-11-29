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

define(['io.ox/backbone/mini-views/common', 'io.ox/backbone/mini-views/date'], function (common, date) {

    'use strict';

    describe('Backbone mini-views.', function () {

        describe('AbstractView view', function () {

            beforeEach(function () {
                this.view = new common.AbstractView({ name: 'test', model: new Backbone.Model() });
            });

            afterEach(function () {
                delete this.view;
            });

            it('has an "initialize" function', function () {
                expect(this.view.initialize).toBeFunction();
            });

            it('has a "dispose" function', function () {
                expect(this.view.dispose).toBeFunction();
            });

            it('has a "valid" function', function () {
                expect(this.view.valid).toBeFunction();
            });

            it('has an "invalid" function', function () {
                expect(this.view.invalid).toBeFunction();
            });

            it('has a model', function () {
                expect(this.view.model).toBeDefined();
            });

            it('references itself via data("view")', function () {
                expect(this.view.$el.data('view')).toBe(this.view);
            });

            it('cleans up after being removed from the DOM', function () {
                spyOn(this.view, 'dispose').andCallThrough();
                $('body').append(this.view.$el);
                this.view.$el.remove();
                expect(this.view.dispose).toHaveBeenCalled();
                expect(this.view.model).toBe(null);
            });
        });

        describe('InputView', function () {

            beforeEach(function () {
                this.model = new Backbone.Model({ test: '' });
                this.view = new common.InputView({ name: 'test', model: this.model });
            });

            afterEach(function () {
                delete this.view;
                delete this.model;
            });

            it('is an input field', function () {
                expect(this.view.$el.prop('tagName')).toBe('INPUT');
                expect(this.view.$el.attr('type')).toBe('text');
            });

            it('has a setup function', function () {
                expect(this.view.setup).toBeFunction();
            });

            it('has an update function', function () {
                expect(this.view.update).toBeFunction();
            });

            it('has a render function', function () {
                expect(this.view.render).toBeFunction();
            });

            it('has a render function that returns "this"', function () {
                var result = this.view.render();
                expect(result).toBe(this.view);
            });

            it('has a render function that calls update', function () {
                spyOn(this.view, 'update').andCallThrough();
                this.view.render();
                expect(this.view.update).toHaveBeenCalled();
            });

            it('should render a name attribute', function () {
                this.view.render();
                expect(this.view.$el.attr('name')).toBe('test');
            });

            it('should have a default tabindex of 1', function () {
                this.view.render();
                expect(this.view.$el.attr('tabindex')).toBe('1');
            });

            it('should be empty', function () {
                expect(this.view.$el.val()).toBe('');
                expect(this.model.get('test')).toBe('');
            });

            it('reflects model changes', function () {
                this.model.set('test', '1337');
                expect(this.view.$el.val()).toBe('1337');
            });

            it('updates the model', function () {
                this.view.$el.val('Hello World').trigger('change');
                expect(this.model.get('test')).toBe('Hello World');
            });
        });

        describe('TextView', function () {

            beforeEach(function () {
                this.model = new Backbone.Model({ test: '' });
                this.view = new common.TextView({ name: 'test', model: this.model });
            });

            afterEach(function () {
                delete this.view;
                delete this.model;
            });

            it('is an input field', function () {
                expect(this.view.$el.prop('tagName')).toBe('TEXTAREA');
            });

            it('reflects model changes', function () {
                this.model.set('test', 'Lorem Ipsum');
                expect(this.view.$el.val()).toBe('Lorem Ipsum');
            });

            it('updates the model', function () {
                this.view.$el.val('Lorem Ipsum').trigger('change');
                expect(this.model.get('test')).toBe('Lorem Ipsum');
            });
        });

        describe('CheckboxView', function () {

            beforeEach(function () {
                this.model = new Backbone.Model({ test: '' });
                this.view = new common.CheckboxView({ name: 'test', model: this.model });
            });

            afterEach(function () {
                delete this.view;
                delete this.model;
            });

            it('is an input field', function () {
                expect(this.view.$el.prop('tagName')).toBe('INPUT');
                expect(this.view.$el.attr('type')).toBe('checkbox');
            });

            it('reflects model changes', function () {
                this.model.set('test', true);
                expect(this.view.$el.prop('checked')).toBe(true);
            });

            it('updates the model', function () {
                this.view.$el.prop('checked', true).trigger('change');
                expect(this.model.get('test')).toBe(true);
            });
        });

        describe('DateView', function () {

            beforeEach(function () {
                this.date = new Date();
                this.model = new Backbone.Model({ test: this.date.getTime() });
                this.view = new date.DateView({ name: 'test', model: this.model });
            });

            afterEach(function () {
                delete this.date;
                delete this.model;
                delete this.view;
            });

            it('is a <div> tag with three <select> contols', function () {
                this.view.render();
                expect(this.view.$el.prop('tagName')).toBe('DIV');
                expect(this.view.$el.children().length).toBe(3);
                expect(this.view.$el.children('select').length).toBe(3);
            });

            it('reflects model state', function () {
                this.view.render();
                expect(this.view.$el.find('.date').val()).toBe(String(this.date.getUTCDate()));
                expect(this.view.$el.find('.month').val()).toBe(String(this.date.getUTCMonth()));
                expect(this.view.$el.find('.year').val()).toBe(String(this.date.getUTCFullYear()));
            });

            it('updates the model', function () {
                this.view.render();
                this.view.$el.find('.year').val('1978').trigger('change');
                this.view.$el.find('.month').val('0').trigger('change');
                this.view.$el.find('.date').val('29').trigger('change');
                expect(this.model.get('test')).toBe(Date.UTC(1978, 0, 29));
            });
        });
    });
});
