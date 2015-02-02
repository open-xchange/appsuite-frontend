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

define('io.ox/calendar/month/view',
    ['io.ox/calendar/util',
     'io.ox/core/date',
     'io.ox/core/extensions',
     'io.ox/core/folder/api',
     'gettext!io.ox/calendar',
     'settings!io.ox/calendar',
     'less!io.ox/calendar/month/style',
     'static/3rd.party/jquery-ui.min.js'
    ], function (util, date, ext, folderAPI, gt, settings) {

    'use strict';

    function formatDate(d) {
        return d.getYear() + '-' + d.getMonth() + '-' + d.getDate();
    }

    var myself = null;

    var View = Backbone.View.extend({

        className:      'week',
        weekStart:      0,
        weekEnd:        0,
        folder:         null,
        clickTimer:     null,   // timer to separate single and double click
        clicks:         0,      // click counter
        pane:           $(),

        events: {
            'click .appointment': 'onClickAppointment',
            'dblclick .day' : 'onCreateAppointment',
            'mouseenter .appointment': 'onEnterAppointment',
            'mouseleave .appointment': 'onLeaveAppointment'
        },

        initialize: function (options) {
            this.collection.on('reset', this.renderAppointments, this);
            this.weekStart = options.day;
            this.weekEnd = options.day + date.WEEK;
            this.folder = options.folder;
            this.pane = options.pane;
            this.app = options.app;
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
            var d = new date.Local(timestamp);
            // set refDate for app to selected day and change
            // perspective afterwards
            this.app.refDate = d;
            ox.ui.Perspective.show(this.app, 'week:day', {animation: 'slideleft'});
        },

        render: function () {
            // TODO: fix this workaround
            var list = util.getWeekScaffold(this.weekStart + date.DAY),
                firstFound = false,
                self = this,
                weekinfo = $('<div>')
                    .addClass('week-info')
                    .append(
                        $('<span>').addClass('cw').text(
                            gt('CW %1$d', new date.Local(this.weekStart + date.DAY).format('w'))
                        )
                    );
            _(list.days).each(function (day, i) {
                if (day.isFirst) {
                    firstFound = true;
                }
                var dayCell;
                this.$el.append(
                    dayCell = $('<div>')
                        .css('z-index', list.days.length - i)
                        .addClass('day out' +
                            (day.isFirst ? ' first' : '') +
                            (day.isToday ? ' today' : '') +
                            (day.isWeekend ? ' weekend' : '') +
                            (day.isFirst && i > 0 ? ' borderleft' : '') +
                            (list.hasFirst ? (firstFound ? ' bordertop' : ' borderbottom') : '')
                        )
                        .attr('id', day.year + '-' + day.month + '-' + day.date)
                        .data('date', day.timestamp)
                        .append(
                            $('<div>').addClass('list abs'),
                            $('<div>').addClass('number').text(gt.noI18n(day.date))
                        )
                );

                if (day.isFirst) {
                    // prepend month name, like January 2013
                    weekinfo.prepend(
                        $('<span class="month-name">').text(
                            gt.noI18n(date.locale.monthsShort[day.month]) + ' ' + gt.noI18n(day.year)
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
                this.$el.prepend(weekinfo.addClass(firstFound ? ' bordertop' : ''));
            }
            return this;
        },

        renderAppointment: function (a) {
            myself = myself || ox.user_id;

            var self = this,
                el = $('<div>')
                    .addClass('appointment')
                    .data('app', a)
                    .attr({
                        'data-cid': a.id,
                        'data-extension-point': 'io.ox/calendar/month/view/appointment',
                        'data-composite-id': a.id
                    });

            ext.point('io.ox/calendar/month/view/appointment')
                .invoke('draw', el, ext.Baton(_.extend({}, this.options, {model: a, folder: self.folder})));
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
                if (util.getConfirmationStatus(model.attributes, myself) !== 2 || settings.get('showDeclinedAppointments', false)) {

                    var startTSUTC = Math.max(model.get('start_date'), this.weekStart),
                        endTSUTC = Math.min(model.get('end_date'), this.weekEnd),
                        maxCount = 7;

                    // need -1 for rendering, but destroys zero time appointments
                    if (endTSUTC > startTSUTC) {
                        endTSUTC--;
                    }

                    // fix full-time UTC timestamps
                    if (model.get('full_time')) {
                        startTSUTC = date.Local.utc(startTSUTC);
                        endTSUTC = date.Local.utc(endTSUTC);
                    }

                    var startDate = new date.Local(startTSUTC),
                        endDate = new date.Local(endTSUTC),
                        start = new date.Local(startDate.getYear(), startDate.getMonth(), startDate.getDate()).getTime(),
                        end = new date.Local(endDate.getYear(), endDate.getMonth(), endDate.getDate()).getTime();

                    if (_.device('smartphone')) {
                        var cell = this.$('#' + formatDate(startDate) + ' .list');
                        if (tempDate === undefined) {
                            // first run, draw
                            this.renderAppointmentIndicator(cell);
                        } else {
                            if (!util.onSameDay(startTSUTC, tempDate)) {
                                // one mark per day is enough
                                this.renderAppointmentIndicator(cell);
                            }
                        }
                        // remember for next run
                        tempDate = startTSUTC;
                    } else {
                        // draw across multiple days
                        while (maxCount >= 0) {
                            maxCount--;
                            this.$('#' + formatDate(startDate) + ' .list').append(this.renderAppointment(model));

                            // inc date
                            if (start !== end) {
                                startDate.setDate(startDate.getDate() + 1);
                                startDate.setHours(0, 0, 0, 0);
                                start = new date.Local(startDate.getYear(), startDate.getMonth(), startDate.getDate()).getTime();
                            } else {
                                break;
                            }
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
                        s = new date.Local(app.start_date),
                        start = new date.Local($(this).data('date')).setHours(s.getHours(), s.getMinutes(), s.getSeconds(), s.getMilliseconds()).getTime(),
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

        var days = date.locale.days,
            tmp = [];
        days = days.slice(date.locale.weekStart, days.length).concat(days.slice(0, date.locale.weekStart));
        return $('<div>')
            .addClass('abs')
            .append(
                $('<div>').addClass('footer-container').append(
                    $('<div>').addClass('footer').append(function () {
                        _(days).each(function (day) {
                            tmp.push($('<div>').addClass('weekday').text(gt.noI18n(day.substr(0, 2))));
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
            if (a.get('private_flag') && ox.user_id !== a.get('created_by') && !folderAPI.is('private', folder)) {
                classes = 'private disabled';
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
                        a.get('private_flag') ? $('<span class="private-flag"><i class="fa fa-lock"></i></span>'): '',
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
