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

define(['io.ox/backbone/mini-views/common', 'io.ox/backbone/mini-views/date', 'io.ox/core/moment'], function (common, date, moment) {

    'use strict';

    describe('Core Backbone mini-views.', function () {

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

        describe('PasswordView', function () {

            beforeEach(function () {
                this.model = new Backbone.Model({ test: '' });
                this.view = new common.PasswordView({ name: 'test', model: this.model });
            });

            afterEach(function () {
                delete this.view;
                delete this.model;
            });

            it('is an input field', function () {
                expect(this.view.$el.prop('tagName')).to.equal('INPUT');
                expect(this.view.$el.attr('type')).to.equal('password');
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

            it('should have a autocomplete attribute set to off', function () {
                this.view.render();
                expect(this.view.$el.attr('autocomplete')).to.equal('off');
            });

            it('should have a autocorrect attribute set to off', function () {
                this.view.render();
                expect(this.view.$el.attr('autocorrect')).to.equal('off');
            });

            it('should be empty', function () {
                expect(this.view.$el.val()).to.be.empty;
                expect(this.model.get('test')).to.be.empty;
            });

            it('should show stars if no value is set', function () {
                this.model.set('test', null);
                expect(this.view.$el.val()).to.equal('********');
            });

            it('reflects model changes', function () {
                this.model.set('test', '1337');
                expect(this.view.$el.val()).to.equal('1337');
            });

            it('updates the model', function () {
                this.view.$el.val('new password').trigger('change');
                expect(this.model.get('test')).to.equal('new password');
            });
        });

        describe('DateView', function () {

            beforeEach(function () {
                this.date = moment.utc({ year: 2012, month: 1, date: 5 });
                this.model = new Backbone.Model({ test: this.date.valueOf() });
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
                expect(this.view.$el.find('.date').val()).to.equal(String(this.date.date()));
                expect(this.view.$el.find('.month').val()).to.equal(String(this.date.month()));
                expect(this.view.$el.find('.year').val()).to.equal(String(this.date.year()));
            });

            it('updates the model', function () {
                this.view.$el.find('.year').val('1978').trigger('change');
                this.view.$el.find('.month').val('0').trigger('change');
                this.view.$el.find('.date').val('29').trigger('change');
                expect(this.model.get('test')).to.equal(Date.UTC(1978, 0, 29));
            });

            it('handles non-existent days correctly', function () {
                // start end of January
                this.model.set('test', moment.utc({ year: 2013, month: 0, date: 31 }).valueOf());
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
                this.model.set('test', moment.utc({ year: 1, month: 0, date: 31 }).valueOf());
                expect(this.view.value()).to.equal('0001-01-31');
                // jump to February
                this.view.$el.find('.month').val('1').trigger('change');
                expect(this.view.value()).to.equal('0001-02-28');
                expect(this.model.get('test')).to.equal(-62130585600000); // 0001-02-28Error while detecting browser, using fallback
            });
        });

        describe('ErrorView', function () {

            beforeEach(function () {
                this.model = new Backbone.Model({ test: '' });
                this.container = $('<div class="row">');
                this.containerDefault = $('<div class="form-group">');
                this.inputView = new common.InputView({ name: 'test', model: this.model });
                this.view = new common.ErrorView({ selector: '.row' });
                this.viewSecond = new common.ErrorView();
            });

            afterEach(function () {

                delete this.model;
                delete this.container;
                delete this.containerTop;
                delete this.inputView;
                delete this.view;
                delete this.viewSecond;
            });

            it('is an span container', function () {
                expect(this.view.$el.prop('tagName')).to.equal('SPAN');
                expect(this.view.$el.attr('class')).to.equal('help-block');
            });

            it('has a invalid function', function () {
                expect(this.view.invalid).to.be.a('function');
            });

            it('has an valid function', function () {
                expect(this.view.valid).to.be.a('function');
            });

            it('should render a aria-live attribute', function () {
                this.view.render();
                expect(this.view.$el.attr('aria-live')).to.equal('assertive');
            });

            it('has a render function', function () {
                expect(this.view.render).to.be.a('function');
            });

            it('has a render function that returns "this"', function () {
                var result = this.view.render();
                expect(result).to.equal(this.view);
            });

            it('has a getContainer function ', function () {
                expect(this.view.getContainer).to.be.a('function');
            });

            it('should listen to the custom container', function () {
                this.container.append(
                    this.inputView.render().$el,
                    this.view.render().$el
                );
                expect(this.view.getContainer().empty()[0]).to.equal(this.container[0]);
            });

            it('should listen to the default container', function () {
                this.containerDefault.append(
                    this.inputView.render().$el,
                    this.viewSecond.render().$el
                );
                expect(this.viewSecond.getContainer().empty()[0]).to.equal(this.containerDefault[0]);
            });

        });
    });
});
