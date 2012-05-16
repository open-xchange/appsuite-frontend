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
define('io.ox/calendar/edit/view-common',
      ['io.ox/calendar/edit/deps/Backbone',
       'io.ox/core/date',
       'text!io.ox/calendar/edit/tpl/common.tpl',
       'gettext!io.ox/calendar/edit/main'], function (Backbone, dateAPI, commontpl, gt) {

    'use strict';

    var GRID_WIDTH = 330;


    var BinderUtils = {
        convertDate: function (direction, value, attribute, model) {
            if (direction === 'ModelToView') {
                var formated = new dateAPI.Local(value).format(dateAPI.locale.date);
                return formated;
            } else {
                var mydate = new dateAPI.Local(model.get(attribute));
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
        className: 'rightside',
        _modelBinder: undefined,
        initialize: function () {
            var self = this;
            self.template = _.template(commontpl);
            self._modelBinder = new Backbone.ModelBinder();
        },
        render: function () {
            var self = this;
            var css_prefix = 'io-ox-calendar-edit-';
            self.$el.css({left: GRID_WIDTH + 'px'});

            var labels = {
                LABEL_SUBJECT: gt('Subject'),
                LABEL_LOCATION: gt('Location'),
                LABEL_STARTS_AT: gt('Starts at'),
                LABEL_ENDS_AT: gt('Ends at'),
                LABEL_REMINDER: gt('Reminder'),
                LABEL_NOTE: gt('Note')
            };


            // first render the labels and append before bind
            self.$el.empty().append(self.template(labels));

            var bindings = {
                title: '.' + css_prefix + 'title',
                location: '.' + css_prefix + 'location',
                start_date: [
                    {
                        selector: '.' + css_prefix + 'startsat-date',
                        converter: BinderUtils.convertDate
                    },
                    {
                        selector: '.' + css_prefix + 'startsat-time',
                        converter: BinderUtils.convertTime
                    }
                ],
                end_date: [
                    {
                        selector: '.' + css_prefix + 'endsat-date',
                        converter: BinderUtils.convertDate
                    },
                    {
                        selector: '.' + css_prefix + 'endsat-time',
                        converter: BinderUtils.convertTime
                    }
                ],
                note: '.' + css_prefix + 'note'
            };

            self._modelBinder.bind(self.model, self.el, bindings);
            return self;
        }
    });

    return CommonView;
});
