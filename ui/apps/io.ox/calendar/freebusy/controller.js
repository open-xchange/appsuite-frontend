/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/freebusy/controller',
    ['io.ox/core/tk/dialogs',
     'io.ox/calendar/week/view',
     'io.ox/core/api/folder',
     'gettext!io.ox/calendar',
     'settings!io.ox/core',
     'less!io.ox/calendar/freebusy/style.css'], function (dialogs, WeekView, folderAPI, gt, settings) {

    'use strict';

    var that = {

        FreeBusy: function (options, controller) {

            var self = this;

            // create container node
            this.$el = $('<div class="abs free-busy-view">').on('dispose', function () {
                // clean up
                self.weekview.remove();
            });

            this.postprocess = function () {
                this.weekview
                    // hide show all checkbox
                    .showAll(false)
                    // scroll to proper time
                    .setScrollPos();
            };

            this.refresh = function () {
                this.collection.reset();
            };

            this.create = function () {
                controller.invoke('create');
            };

            // all appointments are stored in this collection
            this.collection = new Backbone.Collection([]);

            // get new instance of weekview
            this.weekview = new WeekView({
                collection: this.collection,
                mode: 2, // 2 = week:workweek
                appExtPoint: 'io.ox/calendar/week/view/appointment'
            });

            this.weekview
                // listen to refresh event
                .on('onRefresh', this.refresh, this)
                // listen to create event
                .on('openCreateAppointment', this.create, this);

            this.$el.append(
                $('<div class="abs participants-view">'),
                this.weekview.render().$el.addClass('abs calendar-week-view')
            );
        },

        open: function (options) {

            var width = $(document).width() - 50,
                height = $(document).height() - 200,
                freebusy;

            new dialogs.ModalDialog({ width: width, easyOut: false })
                .build(function () {
                    this.getHeader()
                        .append(
                            $('<h4 id="dialog-title">').text(gt('Find free time'))
                        );
                    this.getContentNode()
                        .css({ height: height + 'px', maxHeight: height + 'px' })
                        .append(
                            (freebusy = new that.FreeBusy(options, this)).$el
                        );
                })
                .addPrimaryButton('close', gt('Close'))
                .busy()
                .show(function (popup) {
                    var id = settings.get('folder/calendar');
                    folderAPI.get({ folder: id }).always(function (data) {
                        // pass folder data over to view (needs this for permission checks)
                        // use fallback data on error
                        data = data.error ? { folder_id: 1, id: id, own_rights: 403710016 } : data;
                        freebusy.weekview.folder(data);
                        // clean up
                        popup.idle();
                        freebusy.postprocess();
                        freebusy = popup = null;
                    });
                });
        }
    };

    return that;
});
