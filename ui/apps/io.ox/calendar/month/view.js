/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/month/view',
    ['io.ox/calendar/util',
     'io.ox/core/date',
     'io.ox/core/extensions',
     'io.ox/core/api/folder',
     'gettext!io.ox/calendar',
     'less!io.ox/calendar/month/style.css',
     'apps/io.ox/core/tk/jquery-ui.min.js',
     'apps/io.ox/core/tk/jquery.mobile.touch.min.js'], function (util, date, ext, folder, gt) {

    'use strict';

    function formatDate(d) {
        return d.getYear() + '-' + d.getMonth() + '-' + d.getDate();
    }

    var myself = null;

    var View = Backbone.View.extend({

        className: 'week',
        weekStart: 0,
        weekEnd: 0,
        folder: null,

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
        },

        onClickAppointment: function (e) {
            var cid = $(e.currentTarget).data('cid'),
                el = $('[data-cid="' + cid + '"]:visible');
            $('.appointment').removeClass('opac').not(el).addClass('opac');
            el.add('.appointment.current').toggleClass('current');
            this.trigger('showAppoinment', e, _.cid(cid + ''));
        },

        onCreateAppointment: function (e) {
            this.trigger('createAppoinment', e, $(e.currentTarget).data('date'));
        },

        // handler for onmouseenter event for hover effect
        onEnterAppointment: function (e) {
            var cid = _.cid($(e.currentTarget).data('cid'));
            $('[data-cid^="' + cid.folder_id + '.' + cid.id + '"]:visible').addClass('hover');
        },

        // handler for onmouseleave event for hover effect
        onLeaveAppointment: function (e) {
            var cid = _.cid($(e.currentTarget).data('cid'));
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
                        .attr('date', day.year + '-' + day.month + '-' + day.date)
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
                    sel,
                    maxCount = 7;

                if (model.get('start_date') < 0) {
                    console.error('FIXME: start_date should not be negative');
                    throw 'FIXME: start_date should not be negative';
                }

                // draw across multiple days
                while (maxCount > 0) {
                    maxCount--;

                    sel = '[date="' + formatDate(startDate) + '"] .list';
                    this.$(sel).append(this.renderAppointment(model));

                    // inc date
                    if (start !== end) {
                        startDate.setDate(startDate.getDate() + 1);
                        startDate.setHours(0, 0, 0, 0);
                        start = new date.Local(startDate.getYear(), startDate.getMonth(), startDate.getDate()).getTime();
                    } else {
                        break;
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
                snap: '.day .list',
                snapMode: 'inner',
                snapTolerance: 20,
                distance: 20,
                containment: self.$el.parent(),
                start: function (e, ui) {
                    $(this).hide();
                },
                drag: function (e, ui) {
                },
                stop: function (e, ui) {
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
                        start = new date.Local($(this).data('date')).setHours(s.getHours(), s.getMinutes(), s.getSeconds(), s.getMilliseconds()).getTime();
                    app.end_date = start + app.end_date - app.start_date;
                    app.start_date = start;
                    self.trigger('updateAppointment', app);
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
                private_flag;
                    // check confirmations
            var state = (_(a.get('participants')).find(function (o) {
                    return o.id === myself;
                }) || { type: 0 }).type;

            this
                .addClass(
                    util.getShownAsClass(a.attributes) +
                    (state === 0 ? ' unconfirmed' : '') +
                    (folder.can('write', baton.folder, a.attributes) ? ' modify' : '')
                )
                .append(
                    $('<div>')
                        .addClass('appointment-content')
                        .css('lineHeight', (a.get('full_time') ? this.fulltimeHeight : this.cellHeight) + 'px')
                        .append(private_flag = $('<i class="icon-lock private-flag">').hide())
                        .append($('<div>').addClass('title').text(gt.noI18n(a.get('title'))))
                        .append(function () {
                            if (a.get('location')) {
                                return $('<div>').addClass('location').text(gt.noI18n(a.get('location') || ''));
                            }
                        })
                )
                .attr({
                    'data-extension': 'default'
                });
            if (a.get('private_flag')) {
                private_flag.show();
            } else {
                private_flag.hide();
            }
        }
    });

    return View;
});
