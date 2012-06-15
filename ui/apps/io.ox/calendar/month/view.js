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
     'gettext!io.ox/calendar/view',
     'less!io.ox/calendar/month/style.css'], function (util, tmpl, date, gt) {

    'use strict';

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
            return tmpl.render('appointment', {
                cid: _.cid(a),
                start: util.getTime(a.start_date),
                subject: a.title,
                shownAs: util.getShownAsClass(a)
            });
        },

        renderAppointments: function () {
            // clear first
            this.$el.find('.appointment').remove();
            // loop over all appointments
            this.collection.each(function (model) {
                var d = new Date(model.get('start_date')),
                    selector = '[date="' + d.getUTCFullYear() + '-' + d.getUTCMonth() + '-' + d.getUTCDate() + '"] .list';
                this.$(selector).append(
                    this.renderAppointment(model.attributes)
                );
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