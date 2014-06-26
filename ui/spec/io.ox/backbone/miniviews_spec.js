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
                expect(this.view.initialize).to.be.a('function');
            });

            it('has a "dispose" function', function () {
                expect(this.view.dispose).to.be.a('function');
            });

            it('has a "valid" function', function () {
                expect(this.view.valid).to.be.a('function');
            });

            it('has an "invalid" function', function () {
                expect(this.view.invalid).to.be.a('function');
            });

            it('has a model', function () {
                expect(this.view.model).to.be.defined;
            });

            it('references itself via data("view")', function () {
                expect(this.view.$el.data('view')).to.equal(this.view);
            });

            it('cleans up after being removed from the DOM', function () {
                var spy = sinon.spy(this.view, 'dispose');
                $('body').append(this.view.$el);
                this.view.$el.remove();
                expect(spy).to.have.been.called;
                expect(this.view.model).to.be.null;
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
                expect(this.view.$el.prop('tagName')).to.equal('INPUT');
                expect(this.view.$el.attr('type')).to.equal('text');
            });

            it('has a setup function', function () {
                expect(this.view.setup).to.be.a('function');
            });

            it('has an update function', function () {
                expect(this.view.update).to.be.a('function');
            });

            it('has a render function', function () {
                expect(this.view.render).to.be.a('function');
            });

            it('has a render function that returns "this"', function () {
                var result = this.view.render();
                expect(result).to.equal(this.view);
            });

            it('has a render function that calls update', function () {
                var spy = sinon.spy(this.view, 'update');
                this.view.render();
                expect(spy).to.have.been.called;
            });

            it('should render a name attribute', function () {
                this.view.render();
                expect(this.view.$el.attr('name')).to.equal('test');
            });

            it('should have a default tabindex of 1', function () {
                this.view.render();
                expect(this.view.$el.attr('tabindex')).to.equal('1');
            });

            it('should be empty', function () {
                expect(this.view.$el.val()).to.be.empty;
                expect(this.model.get('test')).to.be.empty;
            });

            it('reflects model changes', function () {
                this.model.set('test', '1337');
                expect(this.view.$el.val()).to.equal('1337');
            });

            it('updates the model', function () {
                this.view.$el.val('Hello World').trigger('change');
                expect(this.model.get('test')).to.equal('Hello World');
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
                expect(this.view.$el.prop('tagName')).to.equal('TEXTAREA');
            });

            it('reflects model changes', function () {
                this.model.set('test', 'Lorem Ipsum');
                expect(this.view.$el.val()).to.equal('Lorem Ipsum');
            });

            it('updates the model', function () {
                this.view.$el.val('Lorem Ipsum').trigger('change');
                expect(this.model.get('test')).to.equal('Lorem Ipsum');
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
                expect(this.view.$el.prop('tagName')).to.equal('INPUT');
                expect(this.view.$el.attr('type')).to.equal('checkbox');
            });

            it('reflects model changes', function () {
                this.model.set('test', true);
                expect(this.view.$el.prop('checked')).to.be.true;
            });

            it('updates the model', function () {
                this.view.$el.prop('checked', true).trigger('change');
                expect(this.model.get('test')).to.be.true;
            });
        });

        describe('DateView', function () {

            beforeEach(function () {
                this.date = date.DateView.utc(2012, 1, 5);
                this.model = new Backbone.Model({ test: this.date.getTime() });
                this.view = new date.DateView({ name: 'test', model: this.model });
                this.view.render();
            });

            afterEach(function () {
                delete this.date;
                delete this.model;
                delete this.view;
            });

            it('is a <div> tag with three <select> contols', function () {
                expect(this.view.$el.prop('tagName')).to.equal('DIV');
                expect(this.view.$el.children().length).to.equal(3);
                expect(this.view.$el.find('div > select').length).to.equal(3);
            });

            it('contains 0001 as fallback year', function () {
                expect(this.view.$el.find('.year').children().first().attr('value')).to.equal('0001');
            });

            it('contains an empty option for month', function () {
                expect(this.view.$el.find('.month').children().eq(0).attr('value')).to.be.empty;
            });

            it('lists month as one-digit numbers starting with 0', function () {
                expect(this.view.$el.find('.month').children().eq(1).attr('value')).to.equal('0');
            });

            it('contains an empty option for dates', function () {
                expect(this.view.$el.find('.date').children().eq(0).attr('value')).to.be.empty;
            });

            it('lists dates as one-digit numbers starting with 1', function () {
                expect(this.view.$el.find('.date').children().eq(1).attr('value')).to.equal('1');
            });

            it('reflects model state', function () {
                expect(this.view.$el.find('.date').val()).to.equal(String(this.date.getUTCDate()));
                expect(this.view.$el.find('.month').val()).to.equal(String(this.date.getUTCMonth()));
                expect(this.view.$el.find('.year').val()).to.equal(String(this.date.getUTCFullYear()));
            });

            it('updates the model', function () {
                this.view.$el.find('.year').val('1978').trigger('change');
                this.view.$el.find('.month').val('0').trigger('change');
                this.view.$el.find('.date').val('29').trigger('change');
                expect(this.model.get('test')).to.equal(Date.UTC(1978, 0, 29));
            });

            it('handles non-existent days correctly', function () {
                // start end of January
                this.model.set('test', date.DateView.utc(2013, 0, 31).getTime());
                expect(this.view.value()).to.equal('2013-01-31');
                // jump to February
                this.view.$el.find('.month').val('1').trigger('change');
                expect(this.view.value()).to.equal('2013-02-28');
                expect(this.model.get('test')).to.equal(1362009600000);
            });

            it('updates the model (without a year)', function () {
                this.view.$el.find('.year').val('0001').trigger('change');
                this.view.$el.find('.month').val('0').trigger('change');
                this.view.$el.find('.date').val('29').trigger('change');
                expect(this.model.get('test')).to.equal(-62133177600000); // 0001-01-29
            });

            it('handles non-existent days correctly (without a year)', function () {
                // start end of January
                this.model.set('test', date.DateView.utc(1, 0, 31).getTime());
                expect(this.view.value()).to.equal('0001-01-31');
                // jump to February
                this.view.$el.find('.month').val('1').trigger('change');
                expect(this.view.value()).to.equal('0001-02-28');
                expect(this.model.get('test')).to.equal(-62130585600000); // 0001-02-28Error while detecting browser, using fallback
            });
        });
    });
});
