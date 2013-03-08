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
     'io.ox/calendar/freebusy/templates',
     'io.ox/core/api/folder',
     'io.ox/calendar/edit/view-addparticipants',
     'io.ox/participants/model',
     'io.ox/participants/views',
     'io.ox/core/api/user',
     'io.ox/contacts/util',
     'io.ox/calendar/api',
     'io.ox/core/notifications',
     'io.ox/calendar/view-detail',
     'gettext!io.ox/calendar/freebusy',
     'settings!io.ox/core',
     'less!io.ox/calendar/freebusy/style.css'], function (dialogs, WeekView, templates, folderAPI, AddParticipantsView, participantsModel, participantsView, userAPI, contactsUtil, api, notifications, detailView, gt, settings) {

    'use strict';

    var that = {

        FreeBusy: function (options, controller) {

            var self = this;

            // create container node
            this.$el = templates.getMainContainer().on('dispose', function () {
                // clean up
                self.weekView.remove();
            });

            this.postprocess = function () {
                this.weekView
                    // hide show all checkbox
                    .showAll(false)
                    // scroll to proper time
                    .setScrollPos();
                // auto focus
                this.autoCompleteControls.find('.add-participant').focus();
            };

            this.getParticipants = function () {
                return this.participants.map(function (model) {
                    return { id: model.get('id'), type: model.get('type') };
                });
            };

            this.getInterval = function () {
                var start = this.weekView.startDate;
                return { start: start + 0, end: start + api.DAY * 5 };
            };

            function toModel(obj) {
                var model = new Backbone.Model(obj);
                model.id = _.cid(obj);
                return model;
            }

            this.loadAppointments = function () {
                controller.busy();
                var list = self.getParticipants(), options = self.getInterval();
                api.freebusy(list, options).done(function (data) {
                    data = _(data).chain()
                        .map(function (request, index) {
                            return _(request.data).chain()
                                .filter(function (obj) {
                                    // ignore shown_as "free"
                                    return obj.shown_as !== 4;
                                })
                                .map(function (obj) {
                                    obj.index = index;
                                    return obj;
                                })
                                .value();
                        })
                        .flatten()
                        .map(toModel)
                        .value();
                    self.appointments.reset(data);
                    controller.idle();
                });
            };

            function unmarkAppointments() {
                self.weekView.$el.find('.appointment').removeClass('opac current');
            }

            this.sidePopup = new dialogs.SidePopup().on('close', unmarkAppointments);

            this.showAppointment = function (e, obj) {
                api.get(obj).then(
                    function (data) {
                        self.sidePopup.show(e, function (popup) {
                            popup.append(detailView.draw(data));
                        });
                    },
                    function (error) {
                        notifications.yell(error);
                        unmarkAppointments();
                    }
                );
            };

            this.refresh = _.debounce(function () {
                self.appointments.reset([]);
                self.loadAppointments();
            }, 250);

            this.create = function () {
                controller.invoke('create');
            };

            // participants collection
            this.participants = new participantsModel.Participants([]);
            this.participantsView = templates.getParticipantsView();

            function customize() {
                var index = this.model.collection.indexOf(this.model) || 0;
                this.$el.addClass('with-participant-color').append(
                    templates.getParticipantColor(index)
                );
            }

            function updateParticipantColors() {
                self.participants.each(function (model, index) {
                    templates.updateParticipantColor(self.participantsView, model.cid, index);
                    model.set('index', index);
                });
            }

            function drawParticipant(model) {
                self.participantsView.append(
                    new participantsView.ParticipantEntryView({ model: model, halo: true, customize: customize })
                        .render(customize).$el
                );
            }

            function removeParticipant(model) {
                var cid = model.cid;
                self.participantsView.find('[data-cid="' + cid + '"]').remove();
                updateParticipantColors();
            }

            this.participants
                .on('add', drawParticipant)
                .on('remove', removeParticipant)
                .on('reset', function () {
                    self.participantsView.empty();
                    self.participants.each(drawParticipant);
                })
                .on('add remove reset', function () {
                    self.refresh();
                });

            // pre-fill participants list
            this.participants.reset(options.participants || []);

            // all appointments are stored in this collection
            this.appointments = new Backbone.Collection([]);

            // get new instance of weekview
            this.weekView = new WeekView({
                appExtPoint: 'io.ox/calendar/week/view/appointment',
                collection: this.appointments,
                keyboard: false,
                mode: 2, // 2 = week:workweek
                showFulltime: false,
                todayClass: ''
            });

            this.weekView
                // listen to refresh event
                .on('onRefresh', this.refresh, this)
                // listen to create event
                .on('openCreateAppointment', this.create, this)
                // listen to show appointment event
                .on('showAppointment', this.showAppointment, this);

            this.appointments.reset([]);

            var renderAppointment = this.weekView.renderAppointment;
            this.weekView.renderAppointment = function (model) {
                var $el = renderAppointment.call(self.weekView, model);
                $el.removeClass('modify reserved temporary absent free')
                    // set color by index
                    .addClass(templates.getColorClass(model.get('index')))
                    // whole-day / all-day / full-time
                    .addClass(model.get('full_time') ? 'fulltime' : '')
                    // temporary
                    .addClass(model.get('shown_as') === 2 ? 'striped' : '');
                return $el;
            };

            // construct auto-complete
            this.autoCompleteControls = templates.getAutoCompleteControls();

            // get instance of AddParticipantsView
            this.autocomplete = new AddParticipantsView({ el: this.autoCompleteControls })
                .render({
                    autoselect: true,
                    contacts: true,
                    distributionlists: true,
                    groups: true,
                    parentSelector: 'body',
                    placement: 'top',
                    resources: true
                });

            this.autocomplete.on('select', function (data) {

                if (_.isArray(data.distribution_list)) {
                    // resolve distribution lits
                    _(data.distribution_list).each(function (data) {
                        data.type = 5;
                        self.participants.add(data);
                    });
                } else if (data.type === 2) {
                    // fetch users en block first
                    controller.busy();
                    self.participantsView.css('visibility', 'hidden').parent().busy();
                    // resolve group
                    userAPI.getList(data.members, true, { allColumns: true })
                        .done(function (list) {
                            // add type and polish display_name
                            _(list).each(function (obj) {
                                obj.type = 1;
                                obj.sort_name = contactsUtil.getSortName(obj);
                            });
                            _(list).chain().sortBy('sort_name').each(function (obj) {
                                self.participants.add(obj);
                            });
                        })
                        .always(function () {
                            self.participantsView.css('visibility', '').parent().idle();
                            controller.idle();
                        });
                } else {
                    // single participant
                    self.participants.add(data);
                }
            });

            this.$el.append(
                templates.getHeadline(),
                templates.getParticipantsScrollpane().append(this.participantsView),
                this.weekView.render().$el.addClass('abs calendar-week-view')
            );
        },

        draw: function (options, win) {

            var freebusy = new that.FreeBusy(options, win);

            this.append(
                freebusy.$el,
                templates.getControls().append(
                    templates.getBackButton(),
                    freebusy.autoCompleteControls,
                    templates.getPopover()
                )
            );

            win.busy();
            var id = settings.get('folder/calendar');
            folderAPI.get({ folder: id }).always(function (data) {
                // pass folder data over to view (needs this for permission checks)
                // use fallback data on error
                data = data.error ? { folder_id: 1, id: id, own_rights: 403710016 } : data;
                freebusy.weekView.folder(data);
                // clean up
                win.idle();
                freebusy.postprocess();
                freebusy = win = null;
            });
        }
    };

    /* DEV

    var participants = [{ folder_id: 6, id: 225, type: 1 }, { folder_id: 6, id: 80, type: 1 }];
    require(['io.ox/calendar/freebusy/controller'], function (controller) {
        controller.open({ participants: participants });
    });

    */

    return that;
});
