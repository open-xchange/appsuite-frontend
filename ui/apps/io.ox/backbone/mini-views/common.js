/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
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
        className: 'input-xlarge',
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
            this.update();
            return this;
        }
    });

    //
    // <textarea>
    //

    var TextView = AbstractView.extend({
        tagName: 'textarea',
        className: 'input-xlarge',
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

    return {
        InputView: InputView,
        TextView: TextView,
        CheckboxView: CheckboxView
    };
});
