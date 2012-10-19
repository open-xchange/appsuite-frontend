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

        events: {
            'click .appointment': 'onClickAppointment'
        },

        initialize: function (options) {
            this.collection.on('reset', this.renderAppointments, this);
        },

        onClickAppointment: function (e) {
            var obj = _.cid($(e.currentTarget).attr('data-cid'));
            this.trigger('showAppoinment', e, obj);
        },

        render: function () {

            var list = util.getWeekScaffold(this.options.day);

            _(list).each(function (day) {
                this.$el.append(
                    $('<div>')
                        .addClass('day out' + (day.isFirst ? ' first' : '') + (day.isToday ? ' today' : '') + (day.isWeekend ? ' weekend' : ''))
                        .attr('date', day.year + '-' + day.month + '-' + day.date)
                        .append(
                            $('<div>').addClass('list abs'),
                            $('<div>').addClass('number').text(gt.noI18n(day.date))
                        )
                );

                if (day.isFirst) {
                    this.$el.prepend(
                        $('<div>').addClass('vertical').html(
                                gt.noI18n(date.locale.months[day.month]) + '<br>' + gt.noI18n(day.year)
                        )
                    );
                }
            }, this);

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
                .invoke('draw', el, ext.Baton.wrap(_.extend({}, this.options, {model: a, folder: this.folder})));
            return el;
        },

        renderAppointments: function () {
            // clear first
            this.$el.find('.appointment').remove();
            // loop over all appointments
            this.collection.each(function (model) {
                var start = formatDate(new date.Local(model.get('start_date'))),
                    end = formatDate(new date.Local(model.get('end_date') - 1)),
                    copy = _.copy(model.attributes, true),
                    selector, d;

                if (model.get('start_date') < 0) {
                    console.error('FIXME: start_date should not be negative');
                    throw 'FIXME: start_date should not be negative';
                }

                // FIXE ME: just to make it work and safe
                var maxCount = 100;
                // draw across multiple days
                while (true && maxCount) {
                    maxCount--;
                    //console.log('start/end', start, end);
                    selector = '[date="' + start + '"] .list';
                    this.$(selector).append(this.renderAppointment(model));
                    // inc date
                    if (start !== end) {
                        copy.start_date += date.DAY;
                        d = new date.Local(copy.start_date);
                        d.setHours(0, 0, 0, 0);
                        copy.start_date = d.getTime();
                        start = formatDate(d);
                    } else {
                        break;
                    }
                }
            }, this);
        }
    });

    View.drawScaffold = function () {

        var days = date.locale.days;
        days = days.slice(1).concat(days[0]);

        return $('<div>')
            .addClass('abs')
            .append(
                $('<div>').addClass('scrollpane'),
                $('<div>').addClass('footer').append(function () {
                    var tmp = [];
                    _(days).each(function (day) {
                        tmp.push($('<div>').addClass('weekday').text(gt.noI18n(day)));
                    });
                    return tmp;
                })
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
