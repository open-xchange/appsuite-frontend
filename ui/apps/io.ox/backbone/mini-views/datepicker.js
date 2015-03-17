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
                ignoreToggle: false,
                label: ''
            }, options);

            this.attribute = this.options.attribute;
            this.nodes = {};
            this.mobileSettings = {};
            this.mobileMode = _.device('smartphone');

            this.listenTo(this.model, 'change:' + this.attribute, this.updateView);
            this.listenTo(this.model, 'invalid:' + this.attribute, this.onError);
            this.listenTo(this.model, 'valid', this.onValid);
        },

        render: function () {
            var self = this,
                def = $.Deferred();

            this.$el.append(
                $('<legend>').addClass('control-label').text(this.options.label),
                $('<div class="form-inline">').append(
                    function () {
                        // render date input
                        var guid = _.uniqueId('form-control-label-'),
                            ariaID = guid + '-aria',
                            dayFieldLabel = $('<label class="sr-only">').attr('for', guid).text(gt('Date') + ' (' + date.getInputFormat(date.DATE) + ')');

                        self.nodes.dayField = $('<input type="text" tabindex="1" class="form-control datepicker-day-field">').attr({
                            id: guid,
                            'aria-describedby': ariaID
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
                            'aria-describedby': guid + '-aria'
                        });

                        // render timezone badge
                        self.nodes.timezoneField = $('<span class="label label-default">');

                        // add a11y
                        self.nodes.a11yDate = $('<p>')
                            .attr({ id: ariaID })
                            .addClass('sr-only')
                            .text(gt('Use cursor keys to change the date. Press ctrl-key at the same time to change year or shift-key to change month. Close date-picker by pressing ESC key.'));
                        self.nodes.a11yTime = $('<p>')
                            .attr({ id: guid + '-aria' })
                            .addClass('sr-only')
                            .text(gt('Use up and down keys to change the time. Close selection by pressing ESC key.'));

                        return [
                            dayFieldLabel,
                            self.nodes.dayField,
                            self.nodes.a11yDate,
                            '&nbsp;',
                            $('<label class="sr-only">').attr('for', guid).text(gt('Time') + ' (' + date.getInputFormat(date.TIME) + ')'),
                            self.nodes.timeField,
                            self.nodes.a11yTime,
                            '&nbsp;',
                            self.nodes.timezoneField
                        ];
                    }
                )
            );

            if (this.mobileMode) {
                require(['io.ox/core/tk/mobiscroll'], function (mobileSettings) {

                    self.mobileSettings = mobileSettings;

                    if (self.options.clearButton) {
                        self.mobileSettings.buttons = ['set', 'clear', 'cancel'];
                    }
                    if (!self.isFullTime()) {
                        self.mobileSettings.preset = 'datetime';
                    }

                    // initialize mobiscroll plugin
                    self.nodes.dayField.mobiscroll(mobileSettings);
                    self.nodes.dayField.on('change', _.bind(self.updateModel, self));
                });
            } else {
                require(['io.ox/core/tk/datepicker'], function () {
                    // get the right date format and init datepicker
                    self.nodes.dayField.datepicker({
                        clearBtn: self.options.clearButton,
                        parentEl: self.$el
                    });

                    // build and init timepicker based on combobox plugin
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
                    self.toggleTimeInput(self.options.display === 'DATETIME');

                    def.resolve();
                });
            }

            def.then(function () {
                // insert initial values
                self.updateView();
                self.nodes.dayField.on('change', _.bind(self.updateModel, self));
            });

            return this;
        },

        updateView: function () {
            var timestamp = parseInt(this.model[this.model.getDate ? 'getDate' : 'get'](this.attribute), 10);
            if (_.isNaN(timestamp)) return;
            if (!this.mobileMode) {
                this.nodes.timeField.val(new date.Local(timestamp).format(date.TIME));
                this.nodes.dayField.datepicker('update', this.getDateStr(timestamp));
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

        isFullTime: function () {
            if (!this.options.ignoreToggle && this.model.has('full_time')) {
                return !!this.model.get('full_time');
            } else {
                return this.options.display === 'DATE';
            }
        },

        getDateStr: function (timestamp) {
            var val = new date.Local(timestamp);
            if (!this.isFullTime() && this.mobileMode) {
                return val.format(date.DATE) + ' ' + val.format(date.TIME);
            }
            return val.format(date.DATE);
        },

        getTimestamp: function () {
            var dateStr = this.nodes.dayField.val(),
                formatStr = date.getFormat(date.DATE);

            // empty?
            if (dateStr === '')  return null;

            // change format string for datetime if timefield is present
            if (!this.isFullTime()) {
                formatStr += ' ' + date.getFormat(date.TIME);
                if (!this.mobileMode) {
                    if (this.nodes.timeField && this.nodes.timeField.val() !== '') {
                        dateStr += ' ' + this.nodes.timeField.val();
                    } else {
                        formatStr = date.getFormat(date.DATE);
                    }
                }
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
            if (this.mobileMode) {
                this.nodes.dayField.mobiscroll('option', { preset: show ? 'datetime' : 'date' });
            } else {
                this.nodes.timeField.add(this.nodes.timezoneField).css('display', show ? '' : 'none');
            }
        }
    });

    return DatePickerView;
});
