/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/calendar/edit/view-main',
       ['io.ox/calendar/edit/binding-util',
       'io.ox/calendar/util',
       'io.ox/core/extensions',
       'io.ox/core/date',
       'io.ox/calendar/edit/view-addparticipants',
       'io.ox/calendar/edit/module-participants',
       'io.ox/calendar/edit/module-recurrence',
       'io.ox/calendar/edit/template',
       'gettext!io.ox/calendar/edit/main',
       'io.ox/backbone/views',
       'io.ox/backbone/forms'], function (BinderUtils, util, ext, dateAPI, AddParticipantsView, participantsModule, recurrenceModule, tmpl, gt, views, forms) {

    'use strict';



    //customize datepicker
    //just localize the picker
    $.fn.datepicker.dates.en = {
        "days": dateAPI.locale.days,
        "daysShort": dateAPI.locale.daysShort,
        "daysMin": dateAPI.locale.daysStandalone,
        "months": dateAPI.locale.months,
        "monthsShort": dateAPI.locale.monthsShort
    };

    var dates = $.fn.datepicker.dates;
    /*
    $.fn.datepicker.DPGlobal.formatDate = function (date, format, language) {
        if (!date) {
            return null;
        }
        if (date.constructor.toString().indexOf('Date') === -1) {
            return date;
        }
        var d = new dateAPI.Local(date.getTime());
        return d.format(format);
    };

    $.fn.datepicker.DPGlobal.parseDate = function (date, format, language) {
        // return a non-wrapped date-object
        var parsed = dateAPI.Local.parse(date, format);
        if (parsed !== null) {
            var p =  new Date(parsed.local);
            return p;
        } else {
            return date;
        }
    };

    $.fn.datepicker.DPGlobal.parseFormat = function (format) {
        return format;
    };
*/

    var CommonView = views.point('io.ox/calendar/edit/section').createView({
        tagName: 'div',
        className: 'io-ox-calendar-edit container-fluid',
        render: function () {
            var self = this;

            var rows = [];
            function getRow(index) {
                if (rows.length > index + 1) {
                    return rows[index];
                }
                for (var i = 0; i < index + 1 - rows.length; i++) {
                    rows.push($('<div class="row-fluid">'));
                }
                return rows[index];
            }

            this.point.each(function (extension) {
                var node = getRow(extension.forceLine || rows.length);
                extension.invoke('draw', node, {model: self.model, parentView: self});
            });


            this.$el.append(rows);

            return this;
        }
    });

/*
    var CommonView = Backbone.View.extend({
        RECURRENCE_NONE: 0,
        tagName: 'div',
        className: 'io-ox-calendar-edit container',
        subviews: {},
        events: {
            'click .save': 'onSave'
        },
        initialize: function () {
            var self = this;
            self.subviews = {};
            self._modelBinder = new Backbone.ModelBinder();
            self.guid = _.uniqueId('io_ox_calendar_edit_');

            var recurTextConverter = function (direction, value, attribute, model) {
                if (direction === 'ModelToView') {
                    var txt = util.getRecurrenceString(model.attributes);
                    return (txt) ? ': ' + txt : '';
                } else {
                    return model.get(attribute);
                }
            };

            self.bindings = {
                full_time: {selector: '[name=full_time]'},
                start_date: [
                    {
                        selector: '.startsat-date',
                        converter: BinderUtils.convertDate
                    },
                    {
                        selector: '.startsat-time',
                        converter: BinderUtils.convertTime
                    }
                ],
                end_date: [
                    {
                        selector: '.endsat-date',
                        converter: BinderUtils.convertDate
                    },
                    {
                        selector: '.endsat-time',
                        converter: BinderUtils.convertTime
                    }
                ]
            };
            self.model.on('change:start_date', _.bind(self.onStartDateChange, self));
            self.model.on('change:end_date', _.bind(self.onEndDateChange, self));
            self.model.on('change:full_time', _.bind(self.onToggleAllDay, self));

//            Backbone.Validation.bind(this, {forceUpdate: true, selector: 'data-property'});
        },
        render: function () {
            var self = this;
            // create or edit, check for self.model.has('id')

            // clear node
            self.$el.empty();
            // invoke extensionpoints from template
            ext.point('io.ox/calendar/edit/section').invoke('draw', self.$el, {
                uid: self.guid,
                editmode: !!(self.model.has('id'))
            });

            // TODO remove this, pass model to template and don't use data-property
            var defaultBindings = Backbone.ModelBinder.createDefaultBindings(this.el, 'data-property');
            var bindings = _.extend(defaultBindings, self.bindings);

            // let others modify the bindings - if something is disabled,
            // that has explicit bindings like start_date in this case
            ext.point('io.ox/calendar/edit/bindings/common').invoke('modify', self, {bindings: bindings});

            // finally bind the model to the dom using the defined bindings
            self._modelBinder.bind(self.model, self.el, bindings);

            //init date picker

            self.$('.startsat-date').datepicker({format: dateAPI.DATE});
            self.$('.endsat-date').datepicker({format: dateAPI.DATE});
            self.$('.startsat-time').combobox(comboboxHours);
            self.$('.endsat-time').combobox(comboboxHours);

            self.subviews.recurrenceView = new recurrenceModule.View({
                model: self.model,
                parentView: self.el
            });
            // append recurrence options view
            self.subviews.recurrence_option = new recurrenceModule.OptionView({
                el: $(self.el).find('.edit-appointment-recurrence-container'),
                model: self.model,
                parentview: self.$el,
                recurrenceView: self.subviews.recurrenceView
            });

            self.subviews.recurrence_option.render();
            //self.subviews.recurrenceView.render();

            var participants = new participantsModule.Collection(self.model.get('participants'));
            self.subviews.participants = new participantsModule.CollectionView({collection: participants, el: $(self.el).find('.participants')});
            self.subviews.participants.render();
            participants.on('remove', _.bind(self.onRemoveParticipant, self));

            self.subviews.addparticipants = new AddParticipantsView({ el: $(self.el).find('.add-participants')});
            self.subviews.addparticipants.render();
            self.subviews.addparticipants.on('select', _.bind(self.onAddParticipant, self));

            //$(self.el).find('.participants').empty().append(self.subviews.participants.render().el);

            return self;
        },
        onStartDateChange: function () {
            var self = this,
                start = self.model.previous('start_date'),
                curstart = self.model.get('start_date'),
                end = self.model.get('end_date'),
                shift = end - start,
                newEnd = curstart + shift;

            if (!self.model.hasChanged('end_date') && _.isNumber(newEnd)) {
                self.model.set('end_date', newEnd);
            }

        },
        onEndDateChange: function () {
            var self = this,
                start = self.model.get('start_date'),
                end = self.model.previous('end_date'),
                curEnd = self.model.get('end_date'),
                shift, newStart;

            if (start > curEnd) {
                shift = end - start;
                newStart = curEnd - shift;
                if (_.isNumber(newStart)) {
                    self.model.set('start_date', newStart);
                }
            }
        },
        onToggleAllDay: function () {
            console.log("toggle all day");
            var isFullTime = this.model.get('full_time');
            if (isFullTime) {
                this.$('.startsat-time').hide();
                this.$('.endsat-time').hide();
                this.$('.startsat-timezone').hide();
                this.$('.endsat-timezone').hide();
            } else {
                this.$('.startsat-time').show();
                this.$('.endsat-time').show();
                this.$('.startsat-timezone').show();
                this.$('.endsat-timezone').show();
            }
        },
        onSave: function () {
            var self = this;
            self.trigger('save');
        },
        onAddParticipant: function (data) {
            var participants = this.model.get('participants'),
                notIn = true, obj,
                that = this,
                userId;

            notIn = !_(participants).any(function (item) {
                if (data.type === 5) {
                    return (item.mail === data.mail && item.type === data.type) || (item.mail === data.email1 && item.type === data.type);
                } else {
                    return (item.id === data.id && item.type === data.type);
                }
            });

            if (notIn) {
                if (data.type !== 5) {

                    if (data.mark_as_distributionlist) {
                        _.each(data.distribution_list, function (val) {
                            var def = $.Deferred();
                            if (val.folder_id === 6) {
                                util.getUserIdByInternalId(val.id, def);
                                def.done(function (id) {
                                    userId = id;
                                    obj = {id: userId, type: 1 };
                                    that.subviews.participants.collection.add(obj);
                                    participants.push(obj);
                                });
                            } else {
                                obj = {type: 5, mail: val.mail, display_name: val.display_name};
                                that.subviews.participants.collection.add(obj);
                                participants.push(obj);
                            }
                        });
                    } else {
                        obj = {id: data.id, type: data.type};
                        this.subviews.participants.collection.add(obj);
                        participants.push(obj);
                    }

                } else {
                    obj = {type: data.type, mail: data.mail || data.email1, display_name: data.display_name, image1_url: data.image1_url || ''};
                    participants.push(obj);
                    this.subviews.participants.collection.add(obj);
                }
            }
            // nasty hack, cause [Array] keeps [Array] and no change event will be fired
            // since we reset it silently and set this again
            this.model.set({'participants': undefined}, {silent: true});
            this.model.set('participants', participants);

        },
        onRemoveParticipant: function (model, collection) {
            var participants = this.model.get('participants');
            participants = _(participants).filter(function (item) {
                if (item.id === model.get('id') && item.type === model.get('type')) {
                    return false;
                }
                return true;
            });
            this.model.set('participants', participants);
        }
    });
*/
    return CommonView;
});
