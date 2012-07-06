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
       'dot!io.ox/calendar/edit/common.html',
       'gettext!io.ox/calendar/edit/main'], function (BinderUtils, util, ext, dateAPI, AddParticipantsView, participantsModule, recurrenceModule, tmpl, gt) {

    'use strict';



    // just a brand new combobox
    // notice extends typeahead

    var Combobox = function (element, options) {
        this.$element = $(element);
        this.options = $.extend({}, $.fn.combobox.defaults, options);
        this.matcher = this.options.matcher || this.matcher;
        this.sorter = this.options.sorter || this.sorter;
        this.highlighter = this.options.highlighter || this.highlighter;
        this.$menu = $(this.options.menu).appendTo('body');
        this.source = this.options.source;
        this.shown = false;
        this.listen();
    };

    Combobox.prototype = $.extend({}, $.fn.typeahead.Constructor.prototype, {
        constructor: Combobox,
        listen: function () {
            this.$element
                .on('blur',     $.proxy(this.blur, this))
                .on('focus',    $.proxy(this.focus, this))
                .on('keypress', $.proxy(this.keypress, this))
                .on('keyup',    $.proxy(this.keyup, this));

            if ($.browser.webkit || $.browser.msie) {
                this.$element.on('keydown', $.proxy(this.keypress, this));
            }

            this.$menu
                .on('click', $.proxy(this.click, this)) // better than click
                .on('mouseenter', 'li', $.proxy(this.mouseenter, this));
        },
        focus: function (e) {
            this.lookup();
        },
        blur: function (e) {
            var self = this;
            console.log('blur', e);
            e.stopPropagation();
            e.preventDefault();
            setTimeout(function () {
                self.select();
            }, 0);
        },
        keyup: function (e) {

            if (!this.shown) return;

            switch (e.keyCode) {
            case 40: // down arrow
            case 38: // up arrow
                if (!this.shown) {
                    this.lookup();
                }
                e.stopPropagation();
                break;

            case 9: // tab
                break;
            case 13: // enter
                e.stopPropagation();
                if (!this.shown) {
                    return;
                }
                this.select();
                break;

            case 27: // escape
                e.stopPropagation();
                this.hide();
                break;

            default:
                e.stopPropagation();
                this.lookup();
            }

        },
        select: function () {
            var val = this.$menu.find('.active').attr('data-value');
            if (val) {
                this.$element.val(val);
                this.$element.trigger('change');
            }
            return this.hide();
        },
        render: function (items) {
            var self = this;

            items = $(items).map(function (i, item) {
                i = $(self.options.item).attr('data-value', item);
                i.find('a').html(self.highlighter(item));
                return i[0];
            });

            var selected = _(items).find(function (item) {
                return ($(item).attr('data-value') === self.query);
            });

            if (selected) {
                $(selected).addClass('active');
            } else {
                //items.first().addClass('active');
            }

            this.$menu.html(items);
            return this;
        },
        show: function () {
            var pos = $.extend({}, this.$element.offset(), {
                height: this.$element[0].offsetHeight
            });

            this.$menu.css({
                top: pos.top + pos.height,
                left: pos.left
            });

            this.$menu.show();
            var selected = this.$menu.find('.active');
            if (selected.length > 0) {
                this.$menu.scrollTop(selected.offset().top - selected.offsetParent().offset().top);
            }
            this.shown = true;
            return this;
        }

    });

    $.fn.combobox = function (option) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('combobox'),
                options = typeof option === 'object' && option;
            if (!data) {
                $this.data('combobox', (data = new Combobox(this, options)));
            }

            if (typeof option === 'string') {
                data[option]();
            }
        });
    };


    $.fn.combobox.defaults = {
        source: [],
        items: 8,
        menu: '<ul class="typeahead dropdown-menu"></ul>',
        item: '<li><a href="#"></a></li>'
    };

    $.fn.combobox.Constructor = Combobox;

    $(function () {
        $('body').on('focus.combobox.data-api', '[data-provide="combobox"]', function (e) {
            var $this = $(this);
            if ($this.data('combobox')) {
                return;
            }
            e.preventDefault();
            $this.typeahead($this.data());
        });
    });









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
        var i;
        switch (item.format) {
        case 'minutes':
            item.label = gt.format(gt.ngettext('%1$d Minute', '%1$d Minutes', item.value), gt.noI18n(item.value));
            break;
        case 'hours':
            i = Math.floor(item.value / 60);
            item.label = gt.format(gt.ngettext('%1$d Hour', '%1$d Hours', i), gt.noI18n(i));
            break;
        case 'days':
            i  = Math.floor(item.value / 60 / 24);
            item.label = gt.format(gt.ngettext('%1$d Day', '%1$d Days', i), gt.noI18n(i));
            break;
        case 'weeks':
            i = Math.floor(item.value / 60 / 24 / 7);
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
        NO_REMINDER:        gt('No reminder'),

        DISPLAY_AS:         gt('Display as'),
        RESERVED:           gt('Reserved'),
        TEMPORARY:          gt('Temporary'),
        ABSENT:             gt('Absent'),
        FREE:               gt('Free'),
        TYPE:               gt('Type'),
        PARTICIPANTS:       gt('Participants'),
        PRIVATE:            gt('Private'),
        NOTIFY_ALL:         gt('Notify all participants about this change'),
        HELP_ADD_PARTICIPANTS_MANUALLY:     gt('To add participants manually, just provide a valid email address (e.g john.doe@example.com or "John Doe" <jd@example.com>)')

    };


    // generate source for time-typeahead
    var hours_typeahead = [];
    var filldate = new dateAPI.Local();
    filldate.setHours(0);
    filldate.setMinutes(0);
    for (var i = 0; i < 24; i++) {
        hours_typeahead.push(filldate.format(dateAPI.TIME));
        filldate.add(1000 * 60 * 30); //half hour
        hours_typeahead.push(filldate.format(dateAPI.TIME));
        filldate.add(1000 * 60 * 30); //half hour
    }

    var comboboxHours = {
        source: hours_typeahead,
        items: 48,
        menu: '<ul class="typeahead dropdown-menu calendaredit"></ul>',
        sorter: function (items) {
            items = _(items).sortBy(function (item) {
                var pd = dateAPI.Local.parse(item, dateAPI.TIME);
                return pd.getTime();
            });
            return items;
        },
        matcher: function () {
            return true;
        }
    };

    /// strings end

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
            Backbone.Validation.bind(this, {forceUpdate: true, selector: 'data-property'});
        },
        render: function () {
            var self = this;

            // pre render it
            staticStrings.SAVE_BUTTON_LABEL = (self.model.has('id') ? gt('Save') : gt('Create'));

            self.$el.empty().append(tmpl.render('io.ox/calendar/edit/section', {
                strings: staticStrings,
                reminderList: reminderListValues,
                uid: self.guid
            }));

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


            //self.subviews.recurrence_option = new recurrenceModule.OptionView({model: self.model});


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
                notIn = true, obj;

            notIn = !_(participants).any(function (item) {
                if (data.type === 5) {
                    return (item.mail === data.mail && item.type === data.type) || (item.mail === data.email1 && item.type === data.type);
                } else {
                    return (item.id === data.id && item.type === data.type);
                }
            });

            if (notIn) {
                if (data.type !== 5) {
                    obj = {id: data.id, type: data.type};
                    this.subviews.participants.collection.add(obj);
                    participants.push(obj);
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

    return CommonView;
});
