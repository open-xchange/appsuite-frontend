// NOJSHINT
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
      ['io.ox/calendar/edit/collection-participants',
       'io.ox/calendar/edit/view-participants',
       'io.ox/calendar/edit/view-recurrence',
       'io.ox/calendar/edit/binding-util',
       'io.ox/calendar/util',
       'io.ox/core/extensions',
       'text!io.ox/calendar/edit/tpl/common.tpl',
       'gettext!io.ox/calendar/edit/main'], function (ParticipantsCollection, ParticipantsView, RecurrenceView, BinderUtils, util, ext, commontpl, gt) {

    'use strict';

    //strings
    var reminderListValues = [
        {value: 0, format: 'minutes'},
        {value: 15, format: 'minutes'},
        {value: 30, format: 'minutes'},
        {value: 45, format: 'minutes'},

        {value: 60, format: 'hours'},
        {value: 120, format: 'hours'},
        {value: 240, format: 'hours'},
        {value: 360, format: 'hours'},
        {value: 420, format: 'hours'},
        {value: 720, format: 'hours'},

        {value: 1440, format: 'days'},
        {value: 2880, format: 'days'},
        {value: 4320, format: 'days'},
        {value: 5760, format: 'days'},
        {value: 7200, format: 'days'},
        {value: 8640, format: 'days'},
        {value: 10080, format: 'weeks'},
        {value: 20160, format: 'weeks'},
        {value: 30240, format: 'weeks'},
        {value: 40320, format: 'weeks'}
    ];

    _.each(reminderListValues, function (item, index) {
        switch (item.format) {
        case 'minutes':
            item.label = gt.format(gt.ngettext('%1$d Minute', '%1$d Minutes', item.value), gt.noI18n(item.value));
            break;
        case 'hours':
            var i = Math.floor(item.value / 60);
            item.label = gt.format(gt.ngettext('%1$d Hour', '%1$d Hours', i), gt.noI18n(i));
            break;
        case 'days':
            var i  = Math.floor(item.value / 60 / 24);
            item.label = gt.format(gt.ngettext('%1$d Day', '%1$d Days', i), gt.noI18n(i));
            break;
        case 'weeks':
            var i = Math.floor(item.value / 60 / 24 / 7);
            item.label = gt.format(gt.ngettext('%1$d Week', '%1$d Weeks', i), gt.noI18n(i));
            break;
        }
    });

    var staticStrings = {
        SUBJECT:            gt('Subject'),
        LOCATION:           gt('Location'),
        STARTS_ON:          gt('Starts on'),
        ENDS_ON:            gt('Ends on'),
        ALL_DAY:            gt('All day'),
        REPEAT:             gt('Repeat'),
        EDIT:               gt('edit'),
        CHANGE_TIMEZONE:    gt('Change timezone'),
        DESCRIPTION:        gt('Description'),
        REMINDER:           gt('Reminder'),
        NO_REMINDER:        gt('no reminder'),

        DISPLAY_AS:         gt('Display as'),
        RESERVED:           gt('reserved'),
        TEMPORARY:          gt('Temporary'),
        ABSENT:             gt('absent'),
        FREE:               gt('free'),
        TYPE:               gt('Type'),
        PARTICIPANTS:       gt('Participants'),
        PRIVATE:            gt('Private'),
        NOTIFY_ALL:         gt('Notify all')
    };

    /// strings end




    var CommonView = Backbone.View.extend({
        RECURRENCE_NONE: 0,
        tagName: 'div',
        className: 'io-ox-calendar-edit',
        _modelBinder: undefined,
        bindings: undefined,
        events: {
            'click .editrecurrence': 'toggleRecurrence',
            'click .save': 'onSave',
            'click input.repeat': 'onToggleRepeat'
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
                    var txt = util.getRecurrenceString(model.attributes);
                    return (txt) ? ': ' + txt : '';
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

            //debug
            window.ext = ext;

            // pre render it
            self.$el.empty().append(self.template({
                strings: staticStrings,
                reminderList: reminderListValues,
                uid: _.uniqueId('io_ox_calendar_edit_')
            }));


            // HANDLE DYNAMIC EXTENSION POINTS
            // DO NOT TOUCH
            var deepests = self.deepest('*[data-extgroup]', self.el);
            while (deepests.length > 0) {
                //work with deepests
                var extpoints = {};
                _(deepests).each(function ($item, index) {
                    var $parent = $item.parent();
                    var extgroup = $item.attr('data-extgroup');
                    var pointname = 'io.ox/calendar/edit/' + extgroup;

                    // just tidy up to prevent endless loop by accident
                    $item.removeAttr('data-extgroup');
                    self.extendPoint(index, $item, pointname, $parent);
                    extpoints[pointname] = $parent;
                });

                //apply them to their parent with in el
                _(extpoints).each(function ($parent, pointname) {
                    // points are keeping a reference to their original occurence-parent
                    // so we just need to call the draw function
                    // but we leave the this assignment to global space
                    // so if there is any
                    ext.point(pointname).invoke('draw', $parent);
                });

                // redefine deepests after first run, so now every deepest element should be rendered in the el-Node
                deepests = self.deepest('*[data-extgroup]', self.el);
            }
            // DYNAMIC EXTENSION POINTS END

            // should be an ext point tooo
            self.$('#participantsView').empty().append(self.participantsView.render().el);

            var defaultBindings = Backbone.ModelBinder.createDefaultBindings(this.el, 'name');
            var bindings = _.extend(defaultBindings, self.bindings);
            self._modelBinder.bind(self.model, self.el, bindings);
            return self;
        },


        extendPoint: function (index, $ext_item, pointName, $fragment) {
            var self = this;
            var id = $ext_item.attr('data-extid');
            var myindex = (index + 1) * 100;
            var point = ext.point(pointName);
            var myfrag = $ext_item.detach(); //keep everything else but remove it from fragment

            // nasty unneeded hack :(
            // second time we need to replace it because we keep a reference to $fragment
            var operation = 'extend';
            if (_(point.keys()).indexOf(id) !== -1) {
                operation = 'replace';
            }

            // first extend
            point[operation]({
                id: id,
                index: myindex,
                draw: function (options) {
                    // just use fragment here - cause its the original parent of the group
                    // so we draw what we already have
                    this.append(myfrag);
                }
            });
        },

        // should be an jquery function :)
        deepest: function (sel, el) {
            var sel = '*[data-extgroup]';
            var levels = 0;
            var deepests = [];

            $(el).find('*[data-extgroup]').each(function (index, item) {
                if(!this.firstChild || this.firstChild.nodeType !== 1) {
                    var levelsFromHere = $(this).parentsUntil('body').length;
                    if(levelsFromHere > levels) {
                        deepests = [];
                        levels = levelsFromHere;
                        deepests.push($(item));
                    } else if (levelsFromHere === levels) {
                        deepests.push($(item));
                    }
                }
            });
            return deepests;
        },





        onSave: function () {
            var self = this;
            self.trigger('save');
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
                self.$('.recurrence').empty();
                self.$('.editrecurrence').text(gt('edit'));
                self.$('.recurrence').hide();
            }
            // set default recurrence settings and not
            // if not delete all recurrence settings, save them in temporary variable
            // so it can restored
        }
    });

    return CommonView;
});
