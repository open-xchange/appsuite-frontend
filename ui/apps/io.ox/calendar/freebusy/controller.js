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
     'io.ox/calendar/edit/view-addparticipants',
     'gettext!io.ox/calendar',
     'settings!io.ox/core',
     'less!io.ox/calendar/freebusy/style.css'], function (dialogs, WeekView, folderAPI, AddParticipantsView, gt, settings) {

    'use strict';

    var that = {

        FreeBusy: function (options, controller) {

            var self = this;

            // create container node
            this.$el = $('<div class="abs">').on('dispose', function () {
                // clean up
                self.weekView.remove();
            });

            this.postprocess = function () {
                this.weekView
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
            this.weekView = new WeekView({
                collection: this.collection,
                mode: 2, // 2 = week:workweek
                appExtPoint: 'io.ox/calendar/week/view/appointment',
                keyboard: false
            });

            this.weekView
                // listen to refresh event
                .on('onRefresh', this.refresh, this)
                // listen to create event
                .on('openCreateAppointment', this.create, this);

            // construct auto-complete
            this.autoCompleteControls = $('<div class="autocomplete-controls input-append pull-left">').append(
                $('<input type="text" class="add-participant">'),
                $('<button class="btn" type="button" data-action="add">').append($('<i class="icon-plus">'))
            );

            // get instance of AddParticipantsView
            this.autocomplete = new AddParticipantsView({ el: this.autoCompleteControls })
                .render({
                    parentSelector: '.free-busy-view > .modal-footer',
                    autoselect: true,
                    contacts: true,
                    resources: true,
                    distributionlists: true
                });

            this.$el.append(
                $('<div class="abs participants-view">'),
                this.weekView.render().$el.addClass('abs calendar-week-view')
            );

            this.refresh();
        },

        open: function (options) {

            var width = $(document).width() - 50,
                height = $(document).height() - 200,
                freebusy;

            new dialogs.ModalDialog({ width: width, easyOut: false })
                .addPrimaryButton('close', gt('Close'))
                .build(function () {

                    this.getPopup().addClass('free-busy-view');

                    // get free/busy instance
                    freebusy = new that.FreeBusy(options, this);

                    this.getHeader().append(
                            $('<h4 id="dialog-title">').text(gt('Find free time'))
                        );
                    this.getFooter().prepend(
                            freebusy.autoCompleteControls
                        );
                    this.getContentNode()
                        .css({ height: height + 'px', maxHeight: height + 'px' })
                        .append(freebusy.$el);
                })
                .busy()
                .show(function (popup) {
                    var id = settings.get('folder/calendar');
                    folderAPI.get({ folder: id }).always(function (data) {
                        // pass folder data over to view (needs this for permission checks)
                        // use fallback data on error
                        data = data.error ? { folder_id: 1, id: id, own_rights: 403710016 } : data;
                        freebusy.weekView.folder(data);
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
