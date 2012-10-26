/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define("io.ox/tasks/edit/view-template", ['gettext!io.ox/tasks/edit',
                                          'io.ox/backbone/views',
                                          'io.ox/core/date',
                                          'io.ox/core/notifications',
                                          'io.ox/backbone/forms'], function (gt, views, date, notifications, forms) {
    "use strict";
   
    var point = views.point('io.ox/tasks/edit/view');
    
    // title
    point.extend(new forms.InputField({
        id: 'title',
        index: 100,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="title-field span12" id="task-edit-title">',
        attribute: 'title',
        label: gt('Subject')
    }));
    
    // note
    point.extend(new forms.InputField({
        id: 'note',
        index: 200,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<textarea class="note-field span12" id="task-edit-note">',
        attribute: 'note',
        label: gt('Note')
    }));
    
    // status
    point.extend(new forms.SelectBoxField({
        id: 'status',
        index: 300,
        className: 'span3',
        labelClassName: 'task-edit-label',
        render: function () {
            var self = this;
            this.nodes = {};
            this.nodes.select = $('<select>').addClass("status-selector span12").attr("id", "task-edit-status-select");
            _(this.selectOptions).each(function (label, value) {
                self.nodes.select.append(
                    $("<option>", {value: value}).text(label)
                );
            });
            this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
            this.updateChoice();
            this.nodes.select.on('change', function () {
                if (self.nodes.select.prop('selectedIndex') === 0) {
                    self.model.set('percent_completed', 0);
                } else if (self.nodes.select.prop('selectedIndex') === 2) {
                    self.model.set('percent_completed', 100);
                } else if (self.nodes.select.prop('selectedIndex') === 1 && (self.model.get('percent_completed') === 0 || self.model.get('percent_completed') === 100)) {
                    self.model.set('percent_completed', 25);
                }
                self.model.set(self.attribute, self.nodes.select.val());
            });
        },
        attribute: 'status',
        selectOptions: {
            1: gt('Not started'),
            2: gt('In progress'),
            3: gt('Done'),
            4: gt('Waiting'),
            5: gt('Deferred')
        },
        label: gt('Status')
    }));
    
    // priority
    point.extend(new forms.SelectBoxField({
        id: 'priority',
        index: 400,
        className: 'span3',
        labelClassName: 'task-edit-label',
        render: function () {
            var self = this;
            this.nodes = {};
            this.nodes.select = $('<select>').addClass("priority-selector span12").attr("id", "task-edit-priority-select");
            _(this.selectOptions).each(function (label, value) {
                self.nodes.select.append(
                    $("<option>", {value: value}).text(label)
                );
            });
            this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
            this.updateChoice();
            this.nodes.select.on('change', function () {
                self.model.set(self.attribute, self.nodes.select.val());
            });
        },
        attribute: 'priority',
        selectOptions: {
            1: gt('Low'),
            2: gt('Medium'),
            3: gt('High')
        },
        label: gt('Priority')
    }));
    
    //privateflag
    point.extend(new forms.CheckBoxField({
        id: 'private_flag',
        index: 500,
        labelClassName: 'private-flag',
        className: 'span3 ',
        label: gt('Private'),
        attribute: 'private_flag'
    }));
    
    //estimated time
    point.extend(new forms.InputField({
        id: 'target_duration',
        index: 600,
        className: 'span6',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="target_duration span12" id="task-edit-target-duration">',
        attribute: 'target_duration',
        label: gt('Estimated time in minutes'),
        updateModel: function () {
            var value = this.nodes.inputField.val();
            if (!isNaN(parseFloat(value, 10)) || value === '') {
                if (value === '') {
                    value = null;
                }
                this.model.set(this.attribute, value);
            } else {
                setTimeout(function () {notifications.yell("error", gt("Please enter a correct number.")); }, 300);
                this.nodes.inputField.val(this.model.get(this.attribute));
            }
        }
    }));
    
    //actual time
    point.extend(new forms.InputField({
        id: 'actual_duration',
        index: 700,
        className: 'span6',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="actual_duration span12" id="task-edit-actual-duration">',
        attribute: 'actual_duration',
        label: gt('Actual time in minutes'),
        updateModel: function () {
            var value = this.nodes.inputField.val();
            if (!isNaN(parseFloat(value, 10)) || value === '') {
                if (value === '') {
                    value = null;
                }
                this.model.set(this.attribute, value);
            } else {
                setTimeout(function () {notifications.yell("error", gt("Please enter a correct number.")); }, 300);
                this.nodes.inputField.val(this.model.get(this.attribute));
            }
        }
    }));
    
    //estimated costs
    point.extend(new forms.InputField({
        id: 'target_costs',
        index: 800,
        className: 'span6',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="target_costs span12" id="task-edit-target-costs">',
        attribute: 'target_costs',
        label: gt('Estimated costs'),
        updateModel: function () {
            var value = this.nodes.inputField.val();
            if (!isNaN(parseFloat(value, 10)) || value === '') {
                if (value === '') {
                    value = null;
                }
                this.model.set(this.attribute, value);
            } else {
                setTimeout(function () {notifications.yell("error", gt("Please enter a correct number.")); }, 300);
                this.nodes.inputField.val(this.model.get(this.attribute));
            }
        }
    }));
    
    //actual costs
    point.extend(new forms.InputField({
        id: 'actual_costs',
        index: 900,
        className: 'span4',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="actual_costs span12" id="task-edit-actual-costs">',
        attribute: 'actual_costs',
        label: gt('Actual costs'),
        updateModel: function () {
            var value = this.nodes.inputField.val();
            if (!isNaN(parseFloat(value, 10)) || value === '') {
                if (value === '') {
                    value = null;
                }
                this.model.set(this.attribute, value);
            } else {
                setTimeout(function () {notifications.yell("error", gt("Please enter a correct number.")); }, 300);
                this.nodes.inputField.val(this.model.get(this.attribute));
            }
        }
    }));
    
    //currency
    point.extend(new forms.SelectBoxField({
        id: 'currency',
        index: 1000,
        className: 'span2',
        labelClassName: 'task-edit-label',
        render: function () {
            var self = this;
            this.nodes = {};
            this.nodes.select = $('<select>').addClass("currency span12").attr("id", "task-edit-currency");
            _(this.selectOptions).each(function (label, value) {
                self.nodes.select.append(
                    $("<option>", {value: value}).text(label)
                );
            });
            this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
            this.updateChoice();
            this.nodes.select.on('change', function () {
                self.model.set(self.attribute, self.nodes.select.val());
            });
        },
        attribute: 'currency',
        selectOptions: {
            CAD: _.noI18n('CAD'),
            CHF: _.noI18n('CHF'),
            DKK: _.noI18n('DKK'),
            EUR: _.noI18n('EUR'),
            GBP: _.noI18n('GBP'),
            PLN: _.noI18n('PLN'),
            RUB: _.noI18n('RUB'),
            SEK: _.noI18n('SEK'),
            USD: _.noI18n('USD'),
            JPY: _.noI18n('JPY'),
            RMB: _.noI18n('RMB')
        },
        label: gt('Currency')
    }));
    
    // distance
    point.extend(new forms.InputField({
        id: 'trip_meter',
        index: 1100,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="trip-meter span12" id="task-edit-trip-meter">',
        attribute: 'trip_meter',
        label: gt('Distance')
    }));
    
    // billing information
    point.extend(new forms.InputField({
        id: 'billing_information',
        index: 1200,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="billing-information span12" id="task-edit-billing-information">',
        attribute: 'billing_information',
        label: gt('Billing information')
    }));
    
    // companies
    point.extend(new forms.InputField({
        id: 'companies',
        index: 1300,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="companies span12" id="task-edit-companies">',
        attribute: 'companies',
        label: gt('Companies')
    }));
    
    return null; //just used to clean up the view class
});
