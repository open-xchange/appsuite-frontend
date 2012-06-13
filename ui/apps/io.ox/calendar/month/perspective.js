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

    _.extend(perspective, {

        scaffold: $(),

        drawMonth: function (year, month) {

            var start = Date.UTC(year, month, 1),
                end = Date.UTC(year, month + 1, 0),
                collection = new Backbone.Collection([]),
                view = new View({ collection: collection, year: year, month: month });

            // add and render view
            this.scaffold.find('.scrollpane').append(view.render().el);

            api.getAll({ start: start, end: end }).done(function (list) {
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

            var weekend = true;
            this.scaffold = View.drawScaffold(weekend);
            this.drawMonth(2012, 4);
            this.drawMonth(2012, 5);
            this.drawMonth(2012, 6);
            this.main.empty().addClass('month-view').append(this.scaffold);
            this.scrollTop(this.main.find('.month-2012-6').position().top);
        }
    });

    return perspective;
});
