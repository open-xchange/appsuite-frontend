/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/calendar/week/perspective',
        ['io.ox/calendar/week/view',
         'io.ox/calendar/api',
         'io.ox/calendar/util',
         'io.ox/core/http'
         ], function (View, api, util, http) {

    'use strict';

    var perspective = new ox.ui.Perspective('week');
    
    _.extend(perspective, {
        
        collection: {},
        days: 7,
        startDate: null,
        
        showAppointment: function (e, obj) {
            // open appointment details
            api.get(obj).done(function (data) {
                require(["io.ox/core/tk/dialogs", "io.ox/calendar/view-detail"])
                .done(function (dialogs, detailView) {
                    new dialogs.SidePopup().show(e, function (popup) {
                        popup.append(detailView.draw(data));
                    }).on('close', function () {
                        console.log('close');
                    });
                });
            });
        },
        
        getAppointments: function (start, end) {
            // fetch appointments
            var self = this,
                collection = self.collection;
            if (collection) {
                api.getAll({ start: start, end: end }).done(function (list) {
                    collection.reset(_(list).map(function (obj) {
                        var m = new Backbone.Model(obj);
                        m.id = _.cid(obj);
                        return m;
                    }));
                    collection = null;
                });
            }
        },
        
        updateData: function () {
            // FIXME: replace 'startDate' with calendar logic
            this.startDate = util.getWeekStart();
            
            this.getAppointments(this.startDate, this.startDate + util.DAY * this.days);
        },
        
        refresh: function () {
            this.collection = new Backbone.Collection([]);
            var weekView = new View({
                collection: this.collection,
                columns: this.days,
                startDate: this.startDate
            });
            weekView.on('showAppoinment', this.showAppointment, this);
            this.main
                .empty()
                .append(weekView.render().el)
                .find('.scrollpane')
                .scrollTop(weekView.getScrollPos());
            this.updateData();
        },
        
        render: function (app) {
            this.main.addClass('week-view').empty();
            
            // watch for api refresh
            api.on('refresh.all', $.proxy(this.refresh, this));

            app.getWindow().on('show', $.proxy(this.refresh, this));
            
            this.refresh();
        }
    });

    return perspective;
});
