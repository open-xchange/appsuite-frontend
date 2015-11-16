/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/month/view', [
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar',
    'settings!io.ox/calendar',
    'less!io.ox/calendar/month/style',
    'static/3rd.party/jquery-ui.min.js'
], function (ext, folderAPI, util, gt, settings) {

    'use strict';

    var View = Backbone.View.extend({

        className:      'week',
        weekStart:      0,      // week start moment
        weekEnd:        0,      // week ends moment
        folder:         null,
        clickTimer:     null,   // timer to separate single and double click
        clicks:         0,      // click counter
        pane:           $(),
        type:           '',

        events: {
            'click .appointment':      'onClickAppointment',
            'dblclick .day':           'onCreateAppointment',
            'mouseenter .appointment': 'onEnterAppointment',
            'mouseleave .appointment': 'onLeaveAppointment'
        },

        initialize: function (options) {
            this.collection.on('reset', this.renderAppointments, this);
            this.weekStart = moment(options.day);
            this.weekEnds = moment(this.weekStart).add(1, 'week');
            this.folder = options.folder;
            this.pane = options.pane;
            this.app = options.app;
            this.weekType = options.weekType;
        },

        onClickAppointment: function (e) {
            var cid = $(e.currentTarget).data('cid'),
                cT = $('[data-cid="' + cid + '"]', this.pane);
            if (cT.hasClass('appointment') && !cT.hasClass('disabled')) {
                var self = this,
                    obj = _.cid(String(cid));

                if (!cT.hasClass('current') || _.device('smartphone')) {
                    self.trigger('showAppointment', e, obj);
                    self.pane.find('.appointment')
                        .removeClass('current opac')
                        .not($('[data-cid^="' + obj.folder_id + '.' + obj.id + '"]', self.pane))
                        .addClass(_.device('smartphone') ? '' : 'opac');
                    $('[data-cid^="' + obj.folder_id + '.' + obj.id + '"]', self.pane).addClass('current');
                } else {
                    $('.appointment', self.pane).removeClass('opac');
                }

                if (self.clickTimer === null && self.clicks === 0) {
                    self.clickTimer = setTimeout(function () {
                        clearTimeout(self.clickTimer);
                        self.clicks = 0;
                        self.clickTimer = null;
                    }, 300);
                }
                self.clicks++;

                if (self.clickTimer !== null && self.clicks === 2 && cT.hasClass('modify')) {
                    clearTimeout(self.clickTimer);
                    self.clicks = 0;
                    self.clickTimer = null;
                    self.trigger('openEditAppointment', e, obj);
                }
            }
        },

        onCreateAppointment: function (e) {

            // fix for strange safari-specific bug
            // apparently, the double click changes the selection and then Safari runs into
            // EXC_BAD_ACCESS (SIGSEGV). See bug 42111
            if (_.device('safari')) document.getSelection().collapse(true);

            this.app.folder.can('create').done(function (create) {

                if (!create) return;
                if (!$(e.target).hasClass('list')) return;

                this.trigger('createAppoinment', e, $(e.currentTarget).data('date'));

            }.bind(this));
        },

        // handler for onmouseenter event for hover effect
        onEnterAppointment: function (e) {
            var cid = _.cid(String($(e.currentTarget).data('cid')));
            $('[data-cid^="' + cid.folder_id + '.' + cid.id + '"]:visible').addClass('hover');
        },

        // handler for onmouseleave event for hover effect
        onLeaveAppointment: function (e) {
            var cid = _.cid(String($(e.currentTarget).data('cid')));
            $('[data-cid^="' + cid.folder_id + '.' + cid.id + '"]:visible').removeClass('hover');
        },

        // handler for mobile month view day-change
        changeToSelectedDay: function (timestamp) {
            var d = moment(timestamp);
            // set refDate for app to selected day and change
            // perspective afterwards
            this.app.refDate = d;
            ox.ui.Perspective.show(this.app, 'week:day', { animation: 'slideleft' });
        },

        render: function () {
            // TODO: fix this workaround
            var list = util.getWeekScaffold(this.weekStart),
                firstFound = false,
                self = this,
                weekinfo = $('<div>')
                    .addClass('week-info')
                    .append(
                        $('<span>').addClass('cw').text(
                            gt('CW %1$d', this.weekStart.format('w'))
                        )
                    );

            _(list.days).each(function (day, i) {
                if (day.isFirst) {
                    firstFound = true;
                }

                var dayCell = $('<div>')
                .addClass((day.isFirst ? ' first' : '') +
                    (day.isFirst && i === 0 ? ' forceleftborder' : '') +
                    (day.isToday ? ' today' : '') +
                    (day.isWeekend ? ' weekend' : '') +
                    (day.isFirst || i === 0 ? ' borderleft' : '') +
                    (day.isLast ? ' borderright' : '') +
                    (list.hasFirst ? (firstFound ? ' bordertop' : ' borderbottom') : '') +
                    (list.hasLast && !firstFound ? ' borderbottom' : '')
                );

                if ((this.weekType === 'first' && !firstFound) || (this.weekType === 'last' && firstFound)) {
                    this.$el.append(dayCell.addClass('day-filler'));
                } else {
                    var dayCell;
                    this.$el.append(
                        dayCell
                        .addClass('day')
                        .attr('id', moment(day.timestamp).format('YYYY-M-D'))
                        .data('date', day.timestamp)
                        .append(
                            $('<div>').addClass('list abs'),
                            $('<div>').addClass('number').text(gt.noI18n(day.date))
                        )
                    );
                }
            }, this);

            if (_.device('smartphone')) {
                // on mobile we switch to the day view after a tap
                // on a day-cell was performed
                this.$el.on('tap', '.day', function () {
                    self.changeToSelectedDay($(this).data('date'));
                });
            } else {
                this.$el.prepend(weekinfo);
            }
            return this;
        },

        renderAppointment: function (a) {
            var self = this,
                el = $('<div>')
                    .addClass('appointment')
                    .data('app', a)
                    .attr({
                        'data-cid': a.cid,
                        'data-extension-point': 'io.ox/calendar/month/view/appointment',
                        'data-composite-id': a.cid
                    });

            ext.point('io.ox/calendar/month/view/appointment')
                .invoke('draw', el, ext.Baton(_.extend({}, this.options, { model: a, folder: self.folder, app: self.app })));
            return el;
        },

        renderAppointmentIndicator: function (node) {
            ext.point('io.ox/calendar/month/view/appointment/mobile')
                .invoke('draw', node);
        },

        renderAppointments: function () {
            var self = this,
                tempDate;
            // clear first
            $('.appointment, .fa-circle', this.$el).remove();

            // loop over all appointments
            this.collection.each(function (model) {

                // is declined?
                if (util.getConfirmationStatus(model.attributes) === 2 && !settings.get('showDeclinedAppointments', false)) return;

                var startMoment = moment(model.get('start_date')),
                    endMoment = moment(model.get('end_date')),
                    maxCount = 7;

                // fix full-time values
                if (model.get('full_time')) {
                    startMoment.utc().local(true);
                    endMoment.utc().local(true).subtract(1, 'millisecond');
                }

                // reduce to dates inside the current week
                startMoment = moment.max(startMoment, this.weekStart).clone();
                endMoment = moment.min(endMoment, this.weekEnds).clone();

                if (_.device('smartphone')) {
                    var cell = $('#' + startMoment.format('YYYY-M-D') + ' .list', this.$el);
                    if (tempDate === undefined) {
                        // first run, draw
                        this.renderAppointmentIndicator(cell);
                    } else {
                        if (!startMoment.isSame(tempDate, 'day')) {
                            // one mark per day is enough
                            this.renderAppointmentIndicator(cell);
                        }
                    }
                    // remember for next run
                    tempDate = startMoment.clone();
                } else {
                    // draw across multiple days
                    while (maxCount >= 0) {
                        maxCount--;
                        $('#' + startMoment.format('YYYY-M-D') + ' .list', this.$el).append(this.renderAppointment(model));
                        // inc date
                        if (!startMoment.isSame(endMoment, 'day')) {
                            startMoment.add(1, 'day').startOf('day');
                        } else {
                            break;
                        }
                    }
                }
            }, this);

            // exit here if we are on a phone
            if (_.device('smartphone')) return;

            $('.appointment.modify', this.$el).draggable({
                helper: function () {
                    return $(this)
                        .clone()
                        .width($(this).outerWidth());
                },
                appendTo: self.$el,
                scroll: true,
                scrollSpeed: 100,
                scrollSensitivity: 100,
                snap: '.day>.list',
                snapMode: 'inner',
                snapTolerance: 20,
                distance: 20,
                zIndex: 999,
                containment: self.$el.parent(),
                revertDuration: 0,
                revert: function (drop) {
                    //if false then no socket object drop occurred.
                    if (drop === false) {
                        //revert the peg by returning true
                        $(this).show();
                        return true;
                    } else {
                        //return false so that the peg does not revert
                        return false;
                    }
                },
                start: function () {
                    $(this).hide();
                }
            });

            $('.day', this.$el).droppable({
                accept: '.appointment',
                drop: function (e, ui) {
                    $('.list', this).append(
                        ui.draggable.show()
                    );
                    var app = ui.draggable.data('app').attributes,
                        s = moment(app.start_date),
                        start = moment($(this).data('date')).set({ 'hour': s.hours(), 'minute': s.minutes(), 'second': s.seconds(), 'millisecond': s.milliseconds() }).valueOf(),
                        end = start + app.end_date - app.start_date;
                    if (app.start_date !== start || app.end_date !== end) {
                        app.start_date = start;
                        app.end_date = end;
                        ui.draggable.busy().draggable('disable');
                        self.trigger('updateAppointment', app);
                    }
                }
            });
        }
    });

    View.drawScaffold = function () {
        var days = moment.weekdaysShort(),
            dow = moment.localeData().firstDayOfWeek(),
            tmp = [];
        days = days.slice(dow, days.length).concat(days.slice(0, dow));
        return $('<div>')
            .addClass('abs')
            .append(
                $('<div>').addClass('footer-container').append(
                    $('<div>').addClass('footer').append(function () {
                        _(days).each(function (day) {
                            tmp.push($('<div>').addClass('weekday').text(gt.noI18n(day)));
                        });
                        return tmp;
                    })
                ),
                $('<div class="scrollpane f6-target" tabindex="1">')
            );
    };

    ext.point('io.ox/calendar/month/view/appointment').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {
            var self = this,
                a = baton.model,
                folder = baton.folder,
                conf = 1,
                confString = _.noI18n('%1$s'),
                classes = '';

            function addColorClasses(f) {
                self.addClass(util.getAppointmentColorClass(f, a.attributes));
                if (util.canAppointmentChangeColor(f, a.attributes)) {
                    self.attr('data-folder',  f.id);
                }
            }

            if (String(folder.id) === String(a.get('folder_id'))) {
                addColorClasses(folder);
            } else {
                folderAPI.get(a.get('folder_id')).done(function (f) {
                    addColorClasses(f);
                });
            }

            if (a.get('private_flag') && ox.user_id !== a.get('created_by') && !folderAPI.is('private', folder)) {
                classes = 'private';
            } else {
                conf = util.getConfirmationStatus(a.attributes, folderAPI.is('shared', folder) ? folder.created_by : ox.user_id);
                classes = (a.get('private_flag') ? 'private ' : '') + util.getShownAsClass(a.attributes) +
                    ' ' + util.getConfirmationClass(conf) +
                    (folderAPI.can('write', baton.folder, a.attributes) ? ' modify' : '');
                if (conf === 3) {
                    confString =
                        //#. add confirmation status behind appointment title
                        //#. %1$s = apppintment title
                        //#, c-format
                        gt('%1$s (Tentative)');
                }
            }

            this
                .attr({ tabindex: 1 })
                .addClass(classes)
                .append(
                    $('<div>')
                    .addClass('appointment-content')
                    .css('lineHeight', (a.get('full_time') ? this.fulltimeHeight : this.cellHeight) + 'px')
                    .append(
                        a.get('private_flag') ? $('<span class="private-flag"><i class="fa fa-lock"></i></span>') : '',
                        a.get('title') ? $('<div>').addClass('title').text(gt.format(confString, gt.noI18n(a.get('title') || '\u00A0'))) : '',
                        a.get('location') ? $('<div>').addClass('location').text(gt.noI18n(a.get('location') || '\u00A0')) : ''
                    )
                )
                .attr({
                    'data-extension': 'default'
                });

            util.isBossyAppointmentHandling({ app: a.attributes, folderData: folder }).then(function (isBossy) {
                if (!isBossy) {
                    self.removeClass('modify');
                }
            });
        }
    });

    ext.point('io.ox/calendar/month/view/appointment/mobile').extend({
        id: 'default',
        index: 100,
        draw: function () {
            this.append('<i class="fa fa-circle">');
        }
    });

    return View;
});
