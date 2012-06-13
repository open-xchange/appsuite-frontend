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

        className: 'month',

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

            var year = this.options.year,
                month = this.options.month,
                list = util.getMonthScaffold(Date.UTC(year, month, 1)),
                hideWeekend = false;

            if (list.length === 5) {
                this.$el.addClass('row5');
            }

            _(list).each(function (weeks) {
                var week = $('<div class="week">').appendTo(this.el);
                _(weeks).each(function (day) {
                    if (!hideWeekend || !day.isWeekend) {
                        week.append(tmpl.render('day', day));
                    }
                }, this);
            }, this);

            this.$el
                .addClass('month-' + year + '-' + (month + 1))
                .append(
                    $('<div class="vertical-name">').text(date.locale.months[month] + ' ' + year)
                );

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
            this.collection.each(function (model) {
                console.log('appointment', model, model.get('title'));
                var d = new Date(model.get('start_date')),
                    selector = '.date-' + d.getUTCMonth() + '-' + d.getUTCDate() + ' .list';
                this.$(selector).append(
                    this.renderAppointment(model.attributes)
                );
            }, this);
        }
    });

    View.drawScaffold = function (weekend) {

        var days = date.locale.days, node;
        days = days.slice(1).concat(days[0]);
        if (weekend === false) {
            days = days.slice(0, 5);
        }
        node = tmpl.render('scaffold', { days: days });
        if (weekend === false) {
            node.addClass('hide-weekend');
        }
        return node;
    };

    return View;
});