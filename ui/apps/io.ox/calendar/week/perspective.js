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
         'io.ox/core/http',
         'io.ox/core/tk/dialogs',
         'io.ox/calendar/view-detail'
         ], function (View, api, util, http, dialogs, detailView) {

    'use strict';

    var perspective = new ox.ui.Perspective('week');
    
    _.extend(perspective, {
        
        collection:     {},
        columns:        7,
        startTimeUTC:   null,
        dialog:         $(),
        app:            null,
        view:           null,
        folder:         null,
        
        showAppointment: function (e, obj) {
            // open appointment details
            var that = this;
            api.get(obj).done(function (data) {
                that.dialog
                    .show(e, function (popup) {
                        popup.append(detailView.draw(data));
                    });
            });
        },
        
        updateAppointment: function (obj) {
            api.update(obj).done(function (data) {
//                console.log('updateAppointment result', data);
            });
        },
        
        openCreateAppointment: function (e, obj) {
            require('io.ox/core/extensions')
                .point('io.ox/calendar/detail/actions/create')
                .invoke('action', this, this.app, obj);
        },
        
        openEditAppointment: function (e, obj) {
            require('io.ox/core/extensions')
                .point('io.ox/calendar/detail/actions/edit')
                .invoke('action', this, obj);
        },
        
        getAppointments: function (obj) {
            // fetch appointments
            var self = this,
                collection = self.collection;
            if (collection) {
                api.getAll(obj).done(function (list) {
                    collection
                        .reset(_(list).map(function (obj) {
                            var m = new Backbone.Model(obj);
                            m.id = _.cid(obj);
                            return m;
                        }));
                    collection = null;
                });
            }
        },
        
        refresh: function () {
            var obj = {
                    start: this.startTimeUTC,
                    end: this.startTimeUTC + util.DAY * this.columns
                },
                that = this;
            this.app.folder.getData().done(function (data) {
                that.view.setShowAllvisibility(data.type === 1);
                if (data.type > 1 || that.view.getShowAllStatus() === false) {
                    obj.folder = data.id;
                }
                that.getAppointments(obj);
            });
        },
        
        changeFolder: function (e, data) {
            console.log('changeFolder', data);
            this.folder = data;
            this.refresh();
        },
        
        render: function (app) {
            this.app = app;
            this.collection = new Backbone.Collection([]);
            this.main.addClass('week-view').empty();
            // FIXME: replace 'startTimeUTC' with calendar logic
            if (this.columns === 1) {
                this.startTimeUTC = util.getTodayStart();
            } else {
                this.startTimeUTC = util.getWeekStart();
            }
            this.view = new View({
                collection: this.collection,
                columns: this.columns,
                startTimeUTC: this.startTimeUTC
            });
            
            this.view
                .on('showAppointment', this.showAppointment, this)
                .on('openCreateAppointment', this.openCreateAppointment, this)
                .on('openEditAppointment', this.openEditAppointment, this)
                .on('updateAppointment', this.updateAppointment, this)
                .on('onRefreshView', function (curDate) {
                    this.startTimeUTC = curDate;
                    this.refresh();
                }, this);
            
            this.main
                .empty()
                .append(this.view.render().el);
            
            this.dialog = new dialogs.SidePopup()
                .on('close', function () {
                    $('.appointment', this.main).removeClass('opac current');
                });

            // watch for api refresh
            api.on('refresh.all', $.proxy(this.refresh, this));

            this.app
                .on('folder:change', $.proxy(this.refresh, this))
                .getWindow()
                .on('show', $.proxy(this.refresh, this));

            this.refresh();
        }
    });

    return perspective;
});
