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
      ['io.ox/calendar/edit/deps/Backbone',
       'io.ox/calendar/edit/deps/doT',
       'io.ox/core/date',
       'io.ox/calendar/util',
       'io.ox/calendar/edit/collection-participants',
       'io.ox/calendar/edit/view-participants',
       'text!io.ox/calendar/edit/tpl/common.tpl',
       'gettext!io.ox/calendar/edit/main'], function (Backbone, doT, dateAPI, util, ParticipantsCollection, ParticipantsView, commontpl, gt) {

    'use strict';

    var BinderUtils = {
        convertDate: function (direction, value, attribute, model) {
            if (direction === 'ModelToView') {
                console.log(arguments);
                var formated = new dateAPI.Local(value).format(dateAPI.locale.date);
                return formated;
            } else {
                var attr = model.get(attribute) || '';
                var mydate = new dateAPI.Local();
                var parsedDate = dateAPI.Local.parse(value, dateAPI.locale.date);

                // just reject the change, if it's not parsable
                if (parsedDate.getTime() === 0) {
                    return model.get(attribute);
                }

                mydate.setDate(parsedDate.getDate());
                mydate.setMonth(parsedDate.getMonth());
                mydate.setYear(parsedDate.getYear());

                return mydate.getTime();
            }
        },
        convertTime: function (direction, value, attribute, model) {
            if (direction === 'ModelToView') {
                return new dateAPI.Local(value).format(dateAPI.locale.time);
            } else {
                var mydate = new dateAPI.Local(model.get(attribute));
                var parsedDate = dateAPI.Local.parse(value, dateAPI.locale.time);

                if (parsedDate.getTime() === 0) {
                    return model.get(attribute);
                }

                mydate.setHours(parsedDate.getHours());
                mydate.setMinutes(parsedDate.getMinutes());
                mydate.setSeconds(parsedDate.getSeconds());

                return mydate.getTime();
            }
        }

    };

    var CommonView = Backbone.View.extend({
        tagName: 'div',
        className: 'io-ox-calendar-edit',
        _modelBinder: undefined,
        events: {
            'click .editrecurrence': 'toggleRecurrence',
            'click .save': 'onSave'
        },
        initialize: function () {
            var self = this;
            self.template = doT.template(commontpl);
            self._modelBinder = new Backbone.ModelBinder();
            self.participantsCollection = new ParticipantsCollection(self.model.get('participants'));
            self.participantsView = new ParticipantsView({collection: self.participantsCollection});

            self.model.on('change:recurrence_type', _.bind(self.toggleRecurrenceDetails, self));


        },
        render: function () {
            var self = this;

            window.model = self.model;

            self.$el.empty().append(self.template({gt: gt}));
            self.$('#participantsView').empty().append(self.participantsView.render().el);
            var bindings = Backbone.ModelBinder.createDefaultBindings(this.el, 'name');
            bindings.start_date = [
                    {
                        selector: '.startsat-date',
                        converter: BinderUtils.convertDate
                    },
                    {
                        selector: '.startsat-time',
                        converter: BinderUtils.convertTime
                    }
                ];
            bindings.end_date = [
                    {
                        selector: '.endsat-date',
                        converter: BinderUtils.convertDate
                    },
                    {
                        selector: '.endsat-time',
                        converter: BinderUtils.convertTime
                    }
                ];

            bindings.until = {
                selector: '[name=until]',
                converter: BinderUtils.convertDate
            };
            bindings.recurrence_type = {selector: '[name=recurrence_type]'};
            self.model.set('recurrence_type', 2);

            console.log(bindings);


            self._modelBinder.bind(self.model, self.el, bindings);
            return self;
        },
        toggleRecurrence: function () {
            var $rep = this.$('.recurrence');
            if ($rep.is(':visible')) {
                this.$('.editrecurrence').text(gt('edit'));

            } else {
                this.$('.editrecurrence').text(gt('hide'));

            }
            this.$('.recurrence').toggle();
        },
        toggleRecurrenceDetails: function () {
            console.log('change');
            var self = this;

            console.log('change:' + self.model.get('recurrence_type'));
            self.$('.recurrence_details').hide();

            switch (parseInt(self.model.get('recurrence_type'), 10)) {
            case 0:
                break;
            case 1:
                self.$('.recurrence_details.daily').show();
                console.log('show daily');
                break;
            case 2:
                self.$('.recurrence_details.weekly').show();
                break;
            case 3:
                self.$('.recurrence_details.monthly').show();
                break;
            case 4:
                self.$('.recurrence_details.yearly').show();
                break;
            }


        },
        onSave: function () {
            console.log('on save');
            var self = this;
            self.model.save();
        }
    });

    return CommonView;
});
