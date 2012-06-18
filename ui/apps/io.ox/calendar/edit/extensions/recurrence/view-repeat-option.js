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
define('io.ox/calendar/edit/extensions/recurrence/view-repeat-option',
      ['io.ox/calendar/util',
       'text!io.ox/calendar/edit/extensions/recurrence/tpl/repeat-option.html',
       'gettext!io.ox/calendar/edit/main'], function (util, template, gt) {

    'use strict';


    var staticStrings = {
        REPEAT:             gt('Repeat'),
        EDIT:               gt('edit')
    };


    var RepeatOptionView = Backbone.View.extend({

        RECURRENCE_NONE: 0,
        tagName: 'div',
        events: {
            'click .editrecurrence': 'toggleRecurrence',
            'change input.repeat': 'onToggleRepeat'
        },
        initialize: function (options) {
            var self = this;
            self.parentview = options.parentview; //for further scoping

            self.template = doT.template(template);
            self._modelBinder = new Backbone.ModelBinder();
            var recurTextConverter = function (direction, value, attribute, model) {
                console.log('update text:' + direction);

                if (direction === 'ModelToView') {
                    var txt = util.getRecurrenceString(model.attributes);
                    console.log('text' + txt);
                    console.log(model.attributes);
                    return (txt) ? ': ' + txt : '';
                } else {
                    return model.get(attribute);
                }
            };
            self.bindings = {
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
            self.$el.empty().append(self.template({
                strings: staticStrings,
                uid: _.uniqueId('io_ox_calendar_edit_')
            }));

            self._modelBinder.bind(self.model, self.el, self.bindings);
            return self;
        },
        toggleRecurrence: function () {
            var self = this,
                $rep = self.parentview.$('.recurrence');
            if ($rep.is(':visible')) {
                self.$('.editrecurrence').text(gt('edit'));
                $rep.hide();
            } else {
                self.$('.editrecurrence').text(gt('hide'));
                //var rendered = self.recurrenceView.render().el;
                $rep.show();
            }
            this.$('.recurrence').toggle();
        },
        onToggleRepeat: function (evt) {
            var self = this;
            var isRecurrence = ($(evt.target).attr('checked') === 'checked');

            if (isRecurrence) {
                self.$('.editrecurrence_wrapper').show();
                if (self.model.get('recurrence_type') === 0) {
                    self.model.set('recurrence_type', 1);
                }
            } else {
                self.$('.editrecurrence_wrapper').hide();
                self.model.set('recurrence_type', 0);
                self.parentview.$('.recurrence').hide();
            }
            // set default recurrence settings and not
            // if not delete all recurrence settings, save them in temporary variable
            // so it can restored
        }
    });

    return RepeatOptionView;
});
