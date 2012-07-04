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
     'dot!io.ox/calendar/month/template.html',
     'io.ox/core/date',
     'io.ox/core/config',
     'gettext!io.ox/calendar/view',
     'less!io.ox/calendar/month/style.css'], function (util, tmpl, date, config, gt) {

    'use strict';

    function formatDate(d) {
        return d.getUTCFullYear() + '-' + d.getUTCMonth() + '-' + d.getUTCDate();
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
                this.$el.append(tmpl.render('day', day));
                if (day.isFirst) {
                    this.$el.prepend(
                        $('<div>').addClass('vertical').html(
                            date.locale.months[day.month] + '<br>' + day.year
                        )
                    );
                }
            }, this);

            return this;
        },

        renderAppointment: function (a) {

            myself = myself || config.get('identifier');

            // check confirmations
            var state = (_(a.participants).find(function (o) {
                    return o.id === myself;
                }) || { type: 0 }).type;

            return tmpl.render('appointment', {
                cid: _.cid(a),
                full_time: a.full_time,
                location: a.location,
                private_flag: a.private_flag,
                shownAs: util.getShownAsClass(a),
                start: util.getTime(a.start_date),
                title: a.title,
                unconfirmed: state === 0
            });
        },

        renderAppointments: function () {
            // clear first
            this.$el.find('.appointment').remove();
            // loop over all appointments
            this.collection.each(function (model) {
                var start = formatDate(new Date(model.get('start_date'))),
                    end = formatDate(new Date(model.get('end_date') - 1)),
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
                    this.$(selector).append(this.renderAppointment(copy));
                    // inc date
                    if (start !== end) {
                        copy.start_date += date.DAY;
                        d = new Date(copy.start_date);
                        d.setUTCHours(0, 0, 0, 0);
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

        var days = date.locale.days, node;
        days = days.slice(1).concat(days[0]);
        node = tmpl.render('scaffold', { days: days });
        return node;
    };

    return View;
});
