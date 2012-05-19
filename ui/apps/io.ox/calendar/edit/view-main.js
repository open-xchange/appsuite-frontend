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
       'io.ox/calendar/edit/collection-participants',
       'io.ox/calendar/edit/view-participants',
       'io.ox/calendar/edit/view-recurrence',
       'io.ox/calendar/edit/binding-util',
       'io.ox/calendar/util',
       'text!io.ox/calendar/edit/tpl/common.tpl',
       'gettext!io.ox/calendar/edit/main'], function (Backbone, doT, ParticipantsCollection, ParticipantsView, RecurrenceView, BinderUtils, util, commontpl, gt) {

    'use strict';


    var CommonView = Backbone.View.extend({

        RECURRENCE_NONE: 0,
        tagName: 'div',
        className: 'io-ox-calendar-edit',
        _modelBinder: undefined,
        bindings: undefined,
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
            self.recurrenceView = new RecurrenceView({model: self.model});


            var recurTextConverter = function (direction, value, attribute, model) {
                if (direction === 'ModelToView') {
                    return util.getRecurrenceString(model.attributes);
                } else {
                    return model.get(attribute);
                }
            };

            self.bindings = {
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
                ],
                recurrence_type: [
                    {
                        selector: '[name=repeat]',
                        converter: function (direction, value, attribute, model) {
                            if (direction === 'ModelToView') {
                                if (value === self.RECURRENCE_NONE) {
                                    return false;
                                }
                                return true;
                            } else {
                                if (value === false) {
                                    return self.RECURRENCE_NONE;
                                }
                                return model.get(attribute);
                            }
                        }
                    }, {
                        selector: '[name=recurrenceText]',
                        converter: recurTextConverter
                    }
                ],
                day_in_month: {selector: '[name=recurrenceText]', converter: recurTextConverter},
                interval: {selector: '[name=recurrenceText]', converter: recurTextConverter},
                days: {selector: '[name=recurrenceText]', converter: recurTextConverter},
                month: {selector: '[name=recurrenceText]', converter: recurTextConverter}
            };

        },
        render: function () {
            var self = this;

            self.$el.empty().append(self.template({gt: gt}));
            self.$('#participantsView').empty().append(self.participantsView.render().el);
            var defaultBindings = Backbone.ModelBinder.createDefaultBindings(this.el, 'name');
            var bindings = _.extend(defaultBindings, self.bindings);

            self._modelBinder.bind(self.model, self.el, bindings);
            return self;
        },
        toggleRecurrence: function () {
            var self = this,
                $rep = self.$('.recurrence');
            if ($rep.is(':visible')) {
                this.$('.editrecurrence').text(gt('edit'));
                $rep.empty();
            } else {
                this.$('.editrecurrence').text(gt('hide'));
                var rendered = self.recurrenceView.render().el;
                $rep.empty().append(rendered);
            }
            this.$('.recurrence').toggle();
        },
        onSave: function () {
            var self = this;
            self.model.save();
        }
    });

    return CommonView;
});
