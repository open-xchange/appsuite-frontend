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

define('io.ox/calendar/month/perspective',
    ['io.ox/calendar/month/view',
     'io.ox/calendar/api',
     'io.ox/calendar/util',
     'io.ox/core/http'], function (View, api, util, http) {

    'use strict';

    var perspective = new ox.ui.Perspective('month');

//    $.easing.frrrr = function (x, t, b, c, d) {
//        var ts = (t /= d) * t,
//            tc = ts * t;
//        return b + c * (-8.1525 * tc * ts + 28.5075 * ts * ts + -35.105 * tc + 16 * ts + -0.25 * t);
//    };

    var magneticScroll = _.debounce(function () {
        var self = $(this),
            weeks = self.find('.week'),
            height = weeks.outerHeight(),
            top = self.scrollTop(),
            y = Math.round(top / height),
            delta = (weeks.eq(y).position() || { top: 0 }).top;
        if (Math.abs(delta) < 30) {
            self.off('scroll', magneticScroll)
                .scrollTop(top + delta)
                .on('scroll', magneticScroll);
        }
        self = weeks = null;
    }, 500);

    _.extend(perspective, {

        scaffold: $(),
        pane: $(),

        collections: {},

        showAppointment: function (e, obj) {
            // open appointment details
            api.get(obj).done(function (data) {
                require(["io.ox/core/tk/dialogs", "io.ox/calendar/view-detail"])
                .done(function (dialogs, detailView) {
                    new dialogs.SidePopup().show(e, function (popup) {
                        popup.append(detailView.draw(data));
                    });
                });
            });
        },

        updateWeek: function (start, end) {
            // fetch appointments
            var self = this;
            api.getAll({ start: start, end: end }).done(function (list) {
                self.collections[start].reset(_(list).map(function (obj) {
                    var m = new Backbone.Model(obj);
                    m.id = _.cid(obj);
                    return m;
                }));
            });
        },

        drawWeek: function (day) {
            this.collections[day] = new Backbone.Collection([]);
            var view = new View({ collection: this.collections[day], day: day });
            // add and render view
            this.pane.append(view.render().el);
            // update collection
            this.updateWeek(day, day + util.DAY * 7);
            view.on('showAppoinment', this.showAppointment, this);
        },

        scrollTop: function (top) {
            return this.pane.scrollTop(top);
        },

        update: function () {
            var year = 2012,
                month = 5,
                first = Date.UTC(year, month, 1),
                start = util.getWeekStart(first) - 10 * util.WEEK,
                i;
            for (i = 0; i < 20; i += 1, start += util.WEEK) {
                this.updateWeek(start, start + util.DAY * 7);
            }
        },

        render: function (app) {

            var year = 2012,
                month = 5,
                first = Date.UTC(year, month, 1),
                start = util.getWeekStart(first) - 10 * util.WEEK,
                i,
                tops = {};

            this.scaffold = View.drawScaffold();
            this.pane = this.scaffold.find('.scrollpane');

            for (i = 0; i < 20; i += 1, start += util.WEEK) {
                this.drawWeek(start);
            }

            window.HANS = this;

            this.main.addClass('month-view').empty().append(this.scaffold);
            this.scrollTop(this.main.find('[date="' + year + '-' + month + '-1"]').position().top);
            this.pane.on('scroll', magneticScroll);

            this.pane.one('scroll', $.proxy(function (e) {
                var top = this.pane.scrollTop() - 200; /* cheap trick */
                this.pane.find('.first').each(function () {
                    tops[Math.max(0, $(this).position().top + top)] = $(this).attr('month');
                });
            }, this));

            var currentMonth;

            this.pane.on('scroll', $.proxy(function (e) {
                var top = this.pane.scrollTop(), y, first = true, month;
                for (y in tops) {
                    if (first || top >= y) {
                        month = tops[y];
                        first = false;
                    } else {
                        break;
                    }
                }
                if (month !== currentMonth) {
                    currentMonth = month;
                    this.pane.find('.day').addClass('out');
                    this.pane.find('[month="' + month + '"]').removeClass('out');
                }

            }, this));

            this.pane.find('[month="' + year + '-' + month + '"]').removeClass('out');

            var refresh = $.proxy(function () {
                this.update();
                this.scrollTop(this.main.find('[date="' + year + '-' + month + '-1"]').position().top);
            }, this);

            // watch for api refresh
            api.on('refresh.all', refresh);
            app.getWindow().on('show', refresh);
        }
    });

    return perspective;
});
