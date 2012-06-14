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
    ['io.ox/calendar/month/view', 'io.ox/calendar/api'], function (View, api) {

    'use strict';

    var perspective = new ox.ui.Perspective('month');

    var magneticScroll = _.debounce(function () {
        var self = $(this),
            month = self.find('.month'),
            weeks = month.find('.week'),
            height = weeks.outerHeight(),
            top = self.scrollTop(),
            y = Math.round(top / height);
        self.off('scroll', magneticScroll)
            .animate({ scrollTop: (weeks.eq(y).position() || { top: 0 }).top }, 100, function () {
                self.on('scroll', magneticScroll);
                self = month = weeks = null;
            });
    }, 500);

    _.extend(perspective, {

        scaffold: $(),

        drawMonth: function (year, month) {

            var collection = new Backbone.Collection([]),
                view = new View({ collection: collection, year: year, month: month });

            // add and render view
            this.scaffold.find('.scrollpane')
                .on('scroll', magneticScroll)
                .append(view.render().el);

            api.getAll({
                start: Date.UTC(year, month - 1, 1),
                end: Date.UTC(year, month + 2, 0)
            }).done(function (list) {
                collection.reset(_(list).map(function (obj) {
                    var m = new Backbone.Model(obj);
                    m.id = _.cid(obj);
                    return m;
                }));
            });

            view.on('showAppoinment', function (e, obj) {
                // open appointment details
                api.get(obj).done(function (data) {
                    require(["io.ox/core/tk/dialogs", "io.ox/calendar/view-detail"])
                    .done(function (dialogs, detailView) {
                        new dialogs.SidePopup().show(e, function (popup) {
                            popup.append(detailView.draw(data));
                        });
                    });
                });
            });
        },

        scrollTop: function (top) {
            return this.scaffold.find('.scrollpane').scrollTop(top);
        },

        render: function (app) {

            var weekend = true, year = 2012, month = 5;
            this.scaffold = View.drawScaffold(weekend);
            this.drawMonth(year, month);
            this.main.empty().addClass('month-view').append(this.scaffold);
            this.scrollTop(this.main.find('.date-' + month + '-1').position().top);
        }
    });

    return perspective;
});
