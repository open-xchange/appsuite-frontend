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

define('io.ox/backbone/mini-views/common', ['io.ox/backbone/mini-views/abstract'], function (AbstractView) {

    'use strict';

    //
    // <input type="text">
    //

    var InputView = AbstractView.extend({
        tagName: 'input type="text"',
        className: 'form-control',
        events: { 'change': 'onChange' },
        onChange: function () {
            this.model.set(this.name, this.$el.val(), { validate: true });
        },
        setup: function (options) {
            this.name = options.name;
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },
        update: function () {
            this.$el.val($.trim(this.model.get(this.name)));
        },
        render: function () {
            this.$el.attr({ name: this.name, tabindex: this.options.tabindex || 1 });
            if (this.id) this.$el.attr({ id: this.id });
            this.update();
            return this;
        }
    });

    //
    // <textarea>
    //

    var TextView = AbstractView.extend({
        tagName: 'textarea',
        className: 'form-control',
        events: { 'change': 'onChange' },
        onChange: function () {
            this.model.set(this.name, this.$el.val());
        },
        setup: function (options) {
            this.name = options.name;
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },
        update: function () {
            this.$el.val(this.model.get(this.name));
        },
        render: function () {
            this.$el.attr({ name: this.name, tabindex: this.options.tabindex || 1 });
            this.update();
            return this;
        }
    });

    //
    // <input type="checkbox">
    //

    var CheckboxView = AbstractView.extend({
        tagName: 'input type="checkbox"',
        className: '',
        events: { 'change': 'onChange' },
        onChange: function () {
            this.model.set(this.name, this.$el.prop('checked'));
        },
        initialize: function (options) {
            this.name = options.name;
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },
        update: function () {
            this.$el.prop('checked', !!this.model.get(this.name));
        },
        render: function () {
            this.$el.attr({ name: this.name, tabindex: this.options.tabindex || 1 });
            this.update();
            return this;
        }
    });

    //
    // <input type="radio">
    //

    var RadioView = AbstractView.extend({
        tagName: 'div',
        className: 'controls',
        events: { 'change': 'onChange' },
        onChange: function () {
            this.model.set(this.name, this.$el.find('[name="' + this.name + '"]:checked').val());
        },
        initialize: function (options) {
            this.name = options.name;
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },
        update: function () {
            var self = this;
            _.each(self.$el.find('[name="' + self.name + '"]'), function (option) {
                if (self.model.get(self.name) === option.value) $(option).prop('checked', true);
            });
        },
        render: function () {
            var self = this;
            this.$el.append(_.map(this.options.list, function (option) {
                return $('<div>').addClass('radio').append(
                    $('<label>').text(option.label).prepend(
                        $('<input type="radio" name="' + self.name + '">').val(option.value).attr({ tabindex: self.options.tabindex || 1 })
                    )
                );
            }));
            this.update();
            return this;
        }
    });

    //
    // <select>
    //

    var SelectView = AbstractView.extend({
            tagName: 'select',
            className: 'input-xlarge',
            events: { 'change': 'onChange' },
            onChange: function () {
                this.model.set(this.name, this.$el.val());
            },
            initialize: function (options) {
                this.name = options.name;
                this.listenTo(this.model, 'change:' + this.name, this.update);
            },
            update: function () {
                this.$el.val(this.model.get(this.name));
            },
            render: function () {
                this.$el.attr({ name: this.name, tabindex: this.options.tabindex || 1 });
                if (this.id) this.$el.attr({ id: this.id});
                this.$el.append(_.map(this.options.list, function (option) {
                    return $('<option>').attr({ value: option.value}).text(option.label);
                }));
                this.update();
                return this;
            }
        });

    return {
        AbstractView: AbstractView,
        InputView: InputView,
        TextView: TextView,
        CheckboxView: CheckboxView,
        RadioView: RadioView,
        SelectView: SelectView
    };
});
