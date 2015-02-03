/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/backbone/mini-views/datepicker', [
    'io.ox/core/date',
    'settings!io.ox/calendar',
    'gettext!io.ox/core'
], function (date, settings, gt) {

    'use strict';

    // Bootstrap DatePicker
    var DatePickerView = Backbone.View.extend({

        tagName: 'fieldset',

        initialize: function (options) {
            this.options = _.extend({
                display: 'DATE',
                clearButton: false,
                label: ''
            }, options);

            this.attribute = this.options.attribute;
            this.nodes = {};
            this.mobileMode = _.device('smartphone');

            this.listenTo(this.model, 'change:' + this.attribute, this.updateView);
            this.listenTo(this.model, 'invalid:' + this.attribute, this.onError);
            this.listenTo(this.model, 'valid', this.onValid);
        },

        render: function () {
            var self = this;

            this.$el.append(
                $('<legend>').addClass('control-label').text(this.options.label),
                $('<div class="form-inline">').append(
                    function () {
                        // render date input
                        var guid = _.uniqueId('form-control-label-'),
                            dayFieldLabel = $('<label class="sr-only">').attr('for', guid).text(gt('Date'));
                        self.nodes.dayField = $('<input type="text" tabindex="1" class="form-control datepicker-day-field">').attr({
                            id: guid,
                            'aria-label': gt('Use cursor keys to change the date. Press ctrl-key at the same time to change year or shift-key to change month. Close date-picker by pressing ESC key.')
                        });

                        if (self.mobileMode) {
                            // render date input only on mobile devices
                            return [
                                dayFieldLabel,
                                self.nodes.dayField
                            ];
                        }

                        // render time input
                        guid = _.uniqueId('form-control-label-');
                        self.nodes.timeField = $('<input type="text" tabindex="1" class="form-control">').attr('id', guid).attr({
                            'aria-label': gt('Use up and down keys to change the time. Close selection by pressing ESC key.')
                        });

                        // render timezone badge
                        self.nodes.timezoneField = $('<span class="label label-default">');

                        return [
                            dayFieldLabel,
                            self.nodes.dayField,
                            '&nbsp;',
                            $('<label class="sr-only">').attr('for', guid).text(gt('Time')),
                            self.nodes.timeField,
                            '&nbsp;',
                            self.nodes.timezoneField
                        ];
                    }
                )
            );

            if (this.mobileMode) {
                require(['io.ox/core/tk/mobiscroll'], function () {
                    var moset = {};
                    if (self.options.clearButton) {
                        moset.buttons = ['set', 'clear', 'cancel'];
                    }
                    if (self.options.display === 'DATETIME') {
                        moset.preset = 'datetime';
                    }
                    // initialize mobiscroll plugin
                    self.nodes.dayField.mobiscroll(moset);
                });
            } else {
                require(['io.ox/core/tk/datepicker'], function () {
                    // get the right date format and init datepicker
                    self.nodes.dayField.datepicker({
                        clearBtn: self.options.clearButton,
                        parentEl: self.$el
                    });

                    // build and init timepicker based on combobox plugin
                    if (self.options.display === 'DATETIME') {
                        var hours_typeahead = [],
                            filldate = new date.Local().setHours(0, 0, 0, 0),
                            interval = parseInt(settings.get('interval'), 10) || 30;
                        for (var i = 0; i < 1440; i += interval) {
                            hours_typeahead.push(filldate.format(date.TIME));
                            filldate.add(interval * date.MINUTE);
                        }

                        var comboboxHours = {
                            source: hours_typeahead,
                            items: hours_typeahead.length,
                            menu: '<ul class="typeahead dropdown-menu calendaredit"></ul>',
                            sorter: function (items) {
                                items = _(items).sortBy(function (item) {
                                    var pd = date.Local.parse(item, date.TIME);
                                    return pd.getTime();
                                });
                                return items;
                            }
                        };

                        self.nodes.timeField.combobox(comboboxHours);
                        self.nodes.timeField.on('change', _.bind(self.updateModel, self));
                    }
                    self.toggleTimeInput(self.options.display === 'DATETIME');
                });
            }

            this.nodes.dayField.on('change', _.bind(this.updateModel, this));

            // insert initial values
            this.updateView();

            return this;
        },

        updateView: function () {
            var timestamp = parseInt(this.model[this.model.getDate ? 'getDate' : 'get'](this.attribute), 10);
            if (_.isNaN(timestamp)) return;
            if (!this.mobileMode) {
                this.nodes.dayField.datepicker('update', this.getDateStr(timestamp));
                this.nodes.timeField.val(new date.Local(timestamp).format(date.TIME));
                this.nodes.timezoneField.text(gt.noI18n(date.Local.getTTInfoLocal(timestamp || _.now()).abbr));
            } else {
                this.nodes.dayField.val(this.getDateStr(timestamp));
            }
        },

        updateModel: function () {
            var time = this.getTimestamp();
            if (_.isNull(time) || _.isNumber(time)) {
                this.model[this.model.setDate ? 'setDate' : 'set'](this.attribute, time, { validate: true });
                this.model.trigger('valid');
            } else {
                this.model.trigger('invalid:' + this.attribute, [gt('Please enter a valid date')]);
            }
        },

        getDateStr: function (timestamp) {
            var val = new date.Local(timestamp);
            if (this.options.display === 'DATETIME' && this.mobileMode) {
                return val.format(date.DATE) + ' ' + val.format(date.TIME);
            }
            return val.format(date.DATE);
        },

        getTimestamp: function () {
            var dateStr = this.nodes.dayField.val(),
                formatStr = date.getFormat(date.DATE) + ' ' + date.getFormat(date.TIME);
            //
            if (dateStr === '') {
                return null;
            }

            if (!this.mobileMode && this.options.display === 'DATETIME') {
                dateStr += ' ' + this.nodes.timeField.val();
            }

            // change format string for date only mode
            if (this.options.display === 'DATE') {
                formatStr = date.DATE;
            }

            // parse string to timestamp
            var parsedDate = date.Local.parse(dateStr.toUpperCase(), formatStr);
            // on parse error return null
            return !parsedDate ? undefined : parsedDate.getTime();
        },

        onError: function (messages) {
            var self = this;
            this.onValid();
            this.$el.addClass('error');
            this.nodes.helpBlock = $('<div class="help-block error">');
            _(messages).each(function (msg) {
                self.nodes.helpBlock.append($.txt(msg));
            });
            this.$el.append(this.nodes.helpBlock);
        },

        // remove error message
        onValid: function () {
            if (this.nodes.helpBlock) {
                this.nodes.helpBlock.remove();
                delete this.nodes.helpBlock;
                this.$el.removeClass('error');
            }
        },

        // toggle time input fields
        toggleTimeInput: function (show) {
            this.options.display = show ? 'DATETIME' : 'DATE';
            if (this.mobileMode) {
                this.nodes.dayField.mobiscroll('option', { preset: show ? 'datetime' : 'date' });
            } else {
                this.nodes.timeField.add(this.nodes.timezoneField).css('display', show ? '' : 'none');
            }
            this.updateView();
        }
    });

    return DatePickerView;
});
