/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/mini-views/common', [
    'io.ox/backbone/mini-views/abstract',
    'io.ox/backbone/mini-views/dropdown',
], function (AbstractView, Dropdown) {

    'use strict';

    //
    // <input type="text">
    //

    var InputView = AbstractView.extend({
        el: '<input type="text" class="form-control">',
        // firefox does not trigger a change event if you drop text.
        events: _.device('firefox') ? { 'change': 'onChange', 'drop': 'onDrop' } : { 'change': 'onChange' },
        onChange: function () {
            this.model.set(this.name, this.$el.val(), { validate: true });
        },
        // used by firefox only, because it doesn't trigger a change event automatically
        onDrop: function (e) {
            if (e.originalEvent.dataTransfer.getData('text')) {
                var self = this;
                // use a one time listener for the input Event, so we can trigger the changes after the input updated (onDrop is still to early)
                this.$el.one('input', function () {
                    self.$el.trigger('change');
                });
            }
        },
        setup: function () {
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },
        update: function () {
            // trim left spaces if possible
            var val = _.isString(this.model.get(this.name)) ? this.model.get(this.name).replace(/^\s+/, '') : this.model.get(this.name);
            this.$el.val(val);
            // update model too or the the left spaces are still in the model data. They would be saved when the model is saved, creating inconsistent data
            // infinite loops are not possible because the change event is only triggered if the new value is different
            this.model.set(this.name, val);
        },
        render: function () {
            this.$el.attr({ name: this.name });
            if (this.id) this.$el.attr('id', this.id);
            if (this.options.maxlength) this.$el.attr('maxlength', this.options.maxlength);
            this.update();
            return this;
        }
    });

    //
    // <input type="password">
    //

    var PasswordView = AbstractView.extend({
        el: '<input type="password" class="form-control">',
        events: { 'change': 'onChange' },
        onChange: function () {
            var value = this.$el.val();
            if (/^\*$/.test(value)) value = null;
            this.model.set(this.name, value, { validate: true });
        },
        setup: function () {
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },
        update: function () {
            var value = this.model.get(this.name);
            this.$el.val(value !== null ? $.trim(value) : '********');
        },
        render: function () {
            this.$el.attr({
                autocomplete: 'off',
                autocorrect: 'off',
                name: this.name,
                placeholder: this.options.placeholder
            });
            if (this.id) this.$el.attr('id', this.id);
            if (this.options.maxlength) this.$el.attr('maxlength', this.options.maxlength);
            this.update();
            return this;
        }
    });

    //
    // <textarea>
    //

    var TextView = AbstractView.extend({
        el: '<textarea class="form-control">',
        // firefox does not trigger a change event if you drop text.
        events: _.device('firefox') ? { 'change': 'onChange', 'drop': 'onDrop' } : { 'change': 'onChange' },
        onChange: function () {
            this.model.set(this.name, this.$el.val(), { validate: true });
        },
        // used by firefox only, because it doesn't trigger a change event automatically
        onDrop: function (e) {
            if (e.originalEvent.dataTransfer.getData('text')) {
                var self = this;
                // use a one time listener for the input Event, so we can trigger the changes after the input updated (onDrop is still to early)
                this.$el.one('input', function () {
                    self.$el.trigger('change');
                });
            }
        },
        setup: function (options) {
            this.rows = options.rows;
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },
        update: function () {
            this.$el.val(this.model.get(this.name));
        },
        render: function () {
            this.$el.attr({ name: this.name });
            if (this.rows) this.$el.attr('rows', this.rows);
            if (this.options.maxlength) this.$el.attr('maxlength', this.options.maxlength);
            this.update();
            return this;
        }
    });

    //
    // <input type="checkbox">
    //

    var CheckboxView = AbstractView.extend({
        el: '<input type="checkbox">',
        events: { 'change': 'onChange' },
        onChange: function () {
            this.model.set(this.name, this.$el.prop('checked'));
        },
        setup: function () {
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },
        update: function () {
            this.$el.prop('checked', !!this.model.get(this.name));
        },
        render: function () {
            this.$el.attr({ name: this.name });
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
        setup: function () {
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
                return $('<div class="radio">').append(
                    $('<label>').text(option.label).prepend(
                        $('<input type="radio">').attr('name', self.name).val(option.value)
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
        className: 'input-xlarge form-control',
        events: { 'change': 'onChange' },
        onChange: function () {
            this.model.set(this.name, this.$el.val());
        },
        setup: function () {
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },
        update: function () {
            this.$el.val(this.model.get(this.name));
        },
        render: function () {
            this.$el.attr({ name: this.name, tabindex: 0 });
            if (this.id) this.$el.attr({ id: this.id });
            this.$el.append(_.map(this.options.list, function (option) {
                return $('<option>').attr({ value: option.value }).text(option.label);
            }));
            this.update();
            return this;
        }
    });

    var ErrorView =  AbstractView.extend({
        tagName: 'span',
        className: 'help-block',
        getContainer: function () {
            if (this.options.selector) {
                if (_.isString(this.options.selector)) return this.$el.closest(this.options.selector);
                if (_.isObject(this.options.selector)) return this.options.selector;
            } else {
                return this.$el.closest('.form-group, [class*="col-"]');
            }
        },
        render: function () {
            var self = this;
            _.defer(function () {
                var container = self.getContainer(),
                    errorId = _.uniqueId('error-help_');
                container.on({
                    invalid: function (e, message) {
                        // check if already invalid to avoid endless focus calls
                        if ($(this).hasClass('has-error')) return;
                        $(this).addClass('has-error');
                        self.$el.attr({
                            'id': errorId
                        });
                        self.$el.text(message).show().end();
                        $(this).find('input').attr({
                            'aria-invalid': true,
                            'aria-describedby': errorId
                        });
                        _.defer(function () {
                            $(container).find('input').focus();
                        });
                    },
                    valid: function () {
                        $(this).removeClass('has-error');
                        self.$el.removeAttr('id role');
                        self.$el.text('').hide().end();
                        $(this).find('input').removeAttr('aria-invalid aria-describedby');
                    }
                });
            });
            this.$el.attr({ 'aria-live': 'assertive' }).hide();
            return this;
        }
    });

    var FormView = AbstractView.extend({
        tagName: 'form',
        setup: function () {
            this.listenTo(this.model, 'change');
        },
        render: function () {
            if (this.id) this.$el.attr({ id: this.id });
            return this;
        }
    });

    var DropdownLinkView = Dropdown.extend({
        tagName: 'div',
        className: 'dropdownlink',
        update: function () {
            this.$el.find('.dropdown-toggle').text(this.options.values[this.model.get(this.name)]);
            Dropdown.prototype.update.apply(this, arguments);
        },
        render: function () {
            var self = this;
            this.options.$toggle = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true">').text(this.options.values[this.model.get(this.name)]);
            Dropdown.prototype.render.apply(this, arguments);
            _(this.options.values).each(function (name, value) {
                self.$ul.append($('<li>').append(
                    $('<a href="#" data-action="change-value">').attr({
                        'data-name': self.name,
                        'data-value': value,
                    }).text(name)
                ));
            });

            return this;
        }
    });

    return {
        AbstractView: AbstractView,
        InputView: InputView,
        PasswordView: PasswordView,
        TextView: TextView,
        CheckboxView: CheckboxView,
        RadioView: RadioView,
        SelectView: SelectView,
        ErrorView: ErrorView,
        FormView: FormView,
        DropdownLinkView: DropdownLinkView
    };
});
