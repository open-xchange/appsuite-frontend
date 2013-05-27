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
     'io.ox/core/api/folder',
     'gettext!io.ox/calendar',
     'settings!io.ox/calendar',
     'less!io.ox/calendar/month/style.less',
     'apps/io.ox/core/tk/jquery-ui.min.js'], function (util, date, ext, folderAPI, gt, settings) {

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
        },

        onClickAppointment: function (e) {
            var cid = $(e.currentTarget).data('cid'),
                cT = $('[data-cid="' + cid + '"]', this.pane);
            if (cT.hasClass('appointment') && !cT.hasClass('disabled')) {
                var self = this,
                    obj = _.cid(cid + '');

                if (!cT.hasClass('current')) {
                    self.trigger('showAppointment', e, obj);
                    self.pane.find('.appointment')
                        .removeClass('current opac')
                        .not($('[data-cid^="' + obj.folder_id + '.' + obj.id + '"]', self.pane))
                        .addClass('opac');
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
            if (!folderAPI.can('create', this.folder)) {
                return;
            }
            if ($(e.target).hasClass('list')) {
                this.trigger('createAppoinment', e, $(e.currentTarget).data('date'));
            }
        },

        // handler for onmouseenter event for hover effect
        onEnterAppointment: function (e) {
            var cid = _.cid($(e.currentTarget).data('cid') + '');
            $('[data-cid^="' + cid.folder_id + '.' + cid.id + '"]:visible').addClass('hover');
        },

        // handler for onmouseleave event for hover effect
        onLeaveAppointment: function (e) {
            var cid = _.cid($(e.currentTarget).data('cid') + '');
            $('[data-cid^="' + cid.folder_id + '.' + cid.id + '"]:visible').removeClass('hover');
        },

        render: function () {
            // TODO: fix this workaround
            var list = util.getWeekScaffold(this.weekStart + date.DAY),
                firstFound = false,
                weekinfo = $('<div>')
                    .addClass('week-info')
                    .append(
                        $('<span>').addClass('cw').append(
                            gt('CW'),
                            gt.noI18n(' ' + new date.Local(this.weekStart + date.DAY).format('w'))
                        )
                    );
            _(list.days).each(function (day, i) {
                if (day.isFirst) {
                    firstFound = true;
                }
                this.$el.append(
                    $('<div>')
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
                    weekinfo.prepend(gt.noI18n(date.locale.months[day.month]) + '<br>' + gt.noI18n(day.year));
                }
            }, this);

            this.$el.prepend(weekinfo.addClass(firstFound ? ' bordertop' : ''));

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

        renderAppointments: function () {
            var self = this;
            // clear first
            $('.appointment', this.$el).remove();

            // loop over all appointments
            this.collection.each(function (model) {

                // is declined?
                if (util.getConfirmationStatus(model.attributes, myself) !== 2 || settings.get('showDeclinedAppointments', false)) {

                    var startTSUTC = Math.max(model.get('start_date'), this.weekStart),
                        endTSUTC = Math.min(model.get('end_date'), this.weekEnd) - 1;

                    // fix full-time UTC timestamps
                    if (model.get('full_time')) {
                        startTSUTC = date.Local.utc(startTSUTC);
                        endTSUTC = date.Local.utc(endTSUTC);
                    }

                    var startDate = new date.Local(startTSUTC),
                        endDate = new date.Local(endTSUTC),
                        start = new date.Local(startDate.getYear(), startDate.getMonth(), startDate.getDate()).getTime(),
                        end = new date.Local(endDate.getYear(), endDate.getMonth(), endDate.getDate()).getTime(),
                        maxCount = 7;

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
            }, this);

            $('.appointment.modify', this.$el).draggable({
                helper: function () {
                    return $(this)
                        .clone()
                        .width($(this).outerWidth())
                        .css({zIndex: 999});
                },
                appendTo: self.$el,
                scroll: true,
                snap: '.day>.list',
                snapMode: 'inner',
                snapTolerance: 20,
                distance: 20,
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
                start: function (e, ui) {
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
                $('<div>').addClass('daylabel').append(function () {
                    _(days).each(function (day) {
                        tmp.push($('<div>').addClass('weekday').text(gt.noI18n(day)));
                    });
                    return tmp;
                }),
                $('<div>').addClass('scrollpane')
            );
    };

    ext.point('io.ox/calendar/month/view/appointment').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {
            var a = baton.model,
                conf = 1,
                confString = _.noI18n('%1$s'),
                classes = '';

            if (a.get('private_flag') && myself !== a.get('created_by')) {
                classes = 'private disabled';
            } else {
                classes = (a.get('private_flag') ? 'private ' : '') + util.getShownAsClass(a.attributes) +
                    ' ' + util.getConfirmationClass(conf = util.getConfirmationStatus(a.attributes, myself)) +
                    (folderAPI.can('write', baton.folder, a.attributes) ? ' modify' : '');
                if (conf === 3) {
                    confString =
                        //#. add confirmation status behind appointment title
                        //#. %1$s = apppintment title
                        //#, c-format
                        gt('%1$s\u00A0(Tentative)');
                }
            }

            this.addClass(classes)
                .append(
                    $('<div>')
                    .addClass('appointment-content')
                    .css('lineHeight', (a.get('full_time') ? this.fulltimeHeight : this.cellHeight) + 'px')
                    .append(
                        $('<span class="private-flag"><i class="icon-lock"></i></span>')[a.get('private_flag') ? 'show' : 'hide'](),
                        $('<div>').addClass('title').text(gt.format(confString, gt.noI18n(a.get('title')))),
                        $('<div>').addClass('location').text(gt.noI18n(a.get('location') || ''))
                    )
                )
                .attr({
                    'data-extension': 'default'
                });
        }
    });

    return View;
});
