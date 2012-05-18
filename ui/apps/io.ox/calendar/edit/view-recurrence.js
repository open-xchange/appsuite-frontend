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

define('io.ox/calendar/edit/view-recurrence',
      ['io.ox/calendar/edit/deps/Backbone',
       'io.ox/calendar/edit/deps/doT',
       'io.ox/calendar/edit/binding-util',
       'text!io.ox/calendar/edit/tpl/recurrence.tpl',
       'gettext!io.ox/calendar/edit/main'], function (Backbone, doT, BinderUtils, template, gt) {

    'use strict';


    var RecurrenceView = Backbone.View.extend({
        tagName: 'div',
        _modelBinder: undefined,
        className: 'io-ox-calendar-edit-recurrence',
        initialize: function () {
            var self = this;
            self.template = doT.template(template);
            self._modelBinder = new Backbone.ModelBinder();
            self.model.on('change:recurrence_type', _.bind(self.updateRecurrenceDetail, self));
        },
        render: function () {
            var self = this;
            self.$el.empty().append(self.template({gt: gt}));

            console.log('view recurrence rendered');

            var bindings = Backbone.ModelBinder.createDefaultBindings(this.el, 'name');

            bindings.recurrence_type = [{
                selector: '[name=recurrence_type]',
                converter: BinderUtils.numToString
            }];

            bindings.until = {
                selector: '[name=until]',
                converter: BinderUtils.convertDate
            };


            self._modelBinder.bind(self.model, self.el, bindings);
            self.updateRecurrenceDetail();

            return self;
        },
        updateRecurrenceDetail: function () {
            console.log('change');
            var self = this;

            console.log('change:' + self.model.get('recurrence_type'));
            console.log(self.model.changedAttributes());

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
        }

    });

    return RecurrenceView;

});
