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
     'less!io.ox/calendar/month/style.css'], function (util, date, ext, folder, gt) {

    'use strict';

    function formatDate(d) {
        return d.getYear() + '-' + d.getMonth() + '-' + d.getDate();
    }

    var myself = null;

    var View = Backbone.View.extend({

        className: 'week',
        weekStart: 0,
        weekEnd: 0,

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
        },

        onClickAppointment: function (e) {
            var cid = $(e.currentTarget).data('cid'),
                el = $('[data-cid="' + cid + '"]');
            $('.appointment').removeClass('opac').not(el).addClass('opac');
            el.add('.appointment.current').toggleClass('current');
            this.trigger('showAppoinment', e, _.cid(cid + ''));
        },

        onCreateAppointment: function (e) {
            this.trigger('createAppoinment', e, $(e.currentTarget).data('date'));
        },

        // handler for onmouseenter event for hover effect
        onEnterAppointment: function (e) {
            $('[data-cid="' + $(e.currentTarget).data('cid') + '"]').addClass('hover');
        },

        // handler for onmouseleave event for hover effect
        onLeaveAppointment: function (e) {
            $('[data-cid="' + $(e.currentTarget).data('cid') + '"]').removeClass('hover');
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

            var el = $('<div>')
                .addClass('appointment')
                .attr({
                    'data-cid': a.id,
                    'data-extension-point': 'io.ox/calendar/month/view/appointment',
                    'data-composite-id': a.id
                });

            ext.point('io.ox/calendar/month/view/appointment')
                .invoke('draw', el, ext.Baton(_.extend({}, this.options, {model: a, folder: this.folder})));
            return el;
        },

        renderAppointments: function () {
            // clear first
            this.$el.find('.appointment').remove();

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
        }
    });

    View.drawScaffold = function () {

        var days = date.locale.days,
            tmp = [];
        if (date.locale.weekStart === 1) {
            days = days.slice(1).concat(days[0]);
        }

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
            var a = baton.model;
                    // check confirmations
            var state = (_(a.get('participants')).find(function (o) {
                    return o.id === myself;
                }) || { type: 0 }).type;

            this
                .addClass(
                    util.getShownAsClass(a.attributes) +
                    (a.get('private_flag') ? ' private' : '') +
                    (state === 0 ? ' unconfirmed' : '')
                )
                .append(
                    $('<div>')
                        .addClass('appointment-content')
                        .css('lineHeight', (a.get('full_time') ? this.fulltimeHeight : this.cellHeight) + 'px')
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
        }
    });

    return View;
});
