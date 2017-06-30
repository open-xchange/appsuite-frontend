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
    'gettext!io.ox/core'
], function (AbstractView, Dropdown, gt) {

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
            // trigger extra update event on view
            this.trigger('update', this.$el);
        },
        render: function () {
            this.$el.attr({ name: this.name });
            if (this.id) this.$el.attr('id', this.id);
            if (this.options.maxlength) this.$el.attr('maxlength', this.options.maxlength);
            if (this.options.mandatory) this.$el.attr('aria-required', true);
            if (_.isBoolean(this.options.autocomplete) && !this.options.autocomplete) this.$el.attr('autocomplete', 'off');
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
        toggle: function (state) {
            state = _.isBoolean(state) ? state : this.$el.attr('type') === 'password';
            this.$el.attr('type', state ? 'text' : 'password');
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
            if (this.options.mandatory) this.$el.attr('aria-required', true);
            // see bug 49639, 51204
            if (_.isBoolean(this.options.autocomplete) && !this.options.autocomplete) this.$el.attr('autocomplete', 'new-password').removeAttr('name');
            this.update();
            return this;
        }
    });

    //
    // wraps PasswordView and adds toggle button
    // <span>
    //    <input type="password">
    //    <button class="toggle-asterisks">
    //

    var PasswordViewToggle = AbstractView.extend({
        el: '<div class="password-container has-feedback">',
        events: {
            'click .toggle-asterisks': 'toggle',
            'keydown': 'onKeyPress',
            'keyup': 'onKeyPress',
            'focusin': 'onFocusChange',
            'focusout': 'onFocusChange'
        },
        icons: { 'password': 'fa-eye', 'text': 'fa-eye-slash' },
        initialize: function (opt) {
            this.passwordView = new PasswordView(opt);
        },
        onFocusChange: _.debounce(function () {
            this.$el.toggleClass('has-focus', $(document.activeElement).closest('.password-container').length > 0);
        }, 20),
        onKeyPress: function (e) {
            // Windows Key / Left ⌘ / Chromebook Search key
            if (e.which !== 91) return;
            this.toggle(e, e.type === 'keydown');
        },
        toggle: function (state) {
            state = _.isBoolean(state) ? state : undefined;
            this.passwordView.toggle(state);
            this.$el.find('i.fa').removeClass('fa-eye fa-eye-slash').addClass(this.icons[this.passwordView.$el.attr('type')]);
        },
        render: function () {
            this.$el.empty().append(
                this.passwordView.render().$el,
                $('<button href="#" class="btn form-control-feedback toggle-asterisks center-childs">')
                    //#. title of toggle button within password field
                    .attr({ title: gt('toggle password visibility') })
                    .append(
                        $('<i class="fa" aria-hidden="true">').addClass(this.icons.password)
                    )
            );
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
            this.model.set(this.name, this.isChecked());
        },
        isChecked: function () {
            return !!this.$input.prop('checked');
        },
        setup: function () {
            this.$input = this.$el;
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },
        update: function () {
            this.$input.prop('checked', !!this.model.get(this.name, this.options.defaultVal));
        },
        render: function () {
            this.$input.attr({ name: this.name });
            if (this.options.id) this.$input.attr('id', this.options.id);
            this.update();
            return this;
        }
    });

    //
    // custom checkbox
    // options: id, name, size (small | large), label
    //
    var CustomCheckboxView = CheckboxView.extend({
        el: '<div class="checkbox custom">',
        render: function () {
            var id = this.options.id || _.uniqueId('custom-');
            this.$el.addClass(this.options.size || 'small').append(
                $('<label>').attr('for', id).append(
                    this.$input = $('<input type="checkbox" class="sr-only">').attr({ id: id, name: this.name }),
                    $('<i class="toggle" aria-hidden="true">'),
                    $.txt(this.options.label || '\u00a0')
                )
            );
            this.update();
            return this;
        }
    });

    //
    // switch control
    // options: id, name, size (small | large), label
    //
    var SwitchView = CustomCheckboxView.extend({
        el: '<div class="checkbox switch">',
        events: {
            'change': 'onChange',
            'swipeleft .toggle': 'onSwipeLeft',
            'swiperight .toggle': 'onSwipeRight'
        },
        onSwipeLeft: function () {
            if (this.isChecked()) this.$input.prop('checked', false);
        },
        onSwipeRight: function () {
            if (!this.isChecked()) this.$input.prop('checked', true);
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
            this.model.set(this.name, this.$('[name="' + this.name + '"]:checked').val());
        },
        setup: function () {
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },
        update: function () {
            var name = this.model.get(this.name);
            this.$('[name="' + this.name + '"]').each(function () {
                if (this.value === name) $(this).prop('checked', true);
            });
        },
        render: function () {
            this.$el.append(_(this.options.list).map(this.renderOption, this));
            this.update();
            return this;
        },
        renderOption: function (data) {
            return $('<div class="radio custom">')
                .addClass(this.options.size || 'small')
                .append(this.renderLabel(data));
        },
        renderLabel: function (data) {
            return $('<label>').append(this.renderInput(data), $.txt(data.label));
        },
        renderInput: function (data) {
            return $('<input type="radio">').attr('name', this.name).val(data.value);
        }
    });

    var CustomRadioView = RadioView.extend({
        renderLabel: function (data) {
            return $('<label>').append(
                this.renderInput(data),
                this.renderToggle(data),
                $.txt(data.label)
            );
        },
        renderToggle: function () {
            return $('<i class="toggle" aria-hidden="true">');
        },
        renderInput: function () {
            return RadioView.prototype.renderInput.apply(this, arguments).addClass('sr-only');
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
            var val = this.$el.val();
            this.model.set(this.name, this.options.integer ? parseInt(val, 10) : val);
        },
        setup: function () {
            this.listenTo(this.model, 'change:' + this.name, this.update);
        },
        update: function () {
            this.$el.val(this.model.get(this.name));
        },
        render: function () {
            this.$el.attr({ name: this.name });
            if (this.id) this.$el.attr({ id: this.id });
            this.$el.append(_.map(this.options.list, function (option) {
                return $('<option>').attr({ value: option.value }).text(option.label);
            }));
            this.update();
            return this;
        }
    });

    //
    // Date view: <input type="date"> or <input type="text"> plus Date Picker
    //
    var DateView = _.device('smartphone') ?
        InputView.extend({
            el: '<input type="date" class="form-control">'
        }) :
        InputView.extend({
            format: 'l',
            onChange: function () {
                var t = +moment(this.$el.val(), this.format).utc(true);
                this.model.set(this.name, t);
            },
            update: function () {
                this.$el.val(moment(this.model.get(this.name)).format(this.format));
            },
            render: function () {
                InputView.prototype.render.call(this);
                var view = this;
                require(['io.ox/backbone/views/datepicker'], function (DatePicker) {
                    new DatePicker({ parent: view.$el.closest('.modal, #io-ox-core') })
                        .attachTo(view.$el)
                        .on('select', function (date) {
                            view.model.set(view.name, date.valueOf());
                        })
                        .on('before:open', function () {
                            this.setDate(view.model.get('currentWeek'));
                        });
                });
                return this;
            }
        });

    //
    // Error view
    //
    var ErrorView =  AbstractView.extend({
        tagName: 'span',
        className: 'help-block',
        setup: function (opt) {
            this.focusSelector = opt.focusSelector || 'input';
        },
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
                            $(container).find(self.focusSelector).focus();
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

    //
    // Form view
    //
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

    //
    // Dropdown Link view
    //
    var DropdownLinkView = Dropdown.extend({
        tagName: 'div',
        className: 'dropdownlink',
        update: function () {
            this.updateLabel();
            Dropdown.prototype.update.apply(this, arguments);
        },
        updateLabel: function () {
            this.$el.find('.dropdown-label').text(this.options.values[this.model.get(this.name)]);
        },
        render: function () {
            var self = this;
            Dropdown.prototype.render.apply(this, arguments);
            _(this.options.values).each(function (name, value) {
                var tooltip = self.options.tooltips && self.options.tooltips[value] ? self.options.tooltips[value] : name;
                self.option(self.name, value, name, { radio: true, title: tooltip });
            });
            this.updateLabel();
            return this;
        }
    });

    return {
        AbstractView: AbstractView,
        InputView: InputView,
        PasswordView: PasswordView,
        PasswordViewToggle: PasswordViewToggle,
        TextView: TextView,
        CheckboxView: CheckboxView,
        CustomCheckboxView: CustomCheckboxView,
        SwitchView: SwitchView,
        RadioView: RadioView,
        CustomRadioView: CustomRadioView,
        SelectView: SelectView,
        DateView: DateView,
        ErrorView: ErrorView,
        FormView: FormView,
        DropdownLinkView: DropdownLinkView
    };
});
