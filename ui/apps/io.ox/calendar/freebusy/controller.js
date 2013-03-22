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
     'io.ox/core/date',
     'io.ox/calendar/view-detail',
     'gettext!io.ox/calendar/freebusy',
     'settings!io.ox/core',
     'less!io.ox/calendar/freebusy/style.css'], function (dialogs, WeekView, templates, folderAPI, AddParticipantsView, participantsModel, participantsView, userAPI, contactsUtil, api, notifications, date, detailView, gt, settings) {

    'use strict';

    var that = {

        FreeBusy: function (options) {

            var self = this,
                standalone = options.standalone,
                state = $.Deferred(),
                // short-term fluent appointment cache
                cache = {},
                // dummy collection
                emptyCollection = new Backbone.Collection([]),
                // calendar views (day, workweek, week)
                currentMode = '',
                calendarViews = {},
                // folder data
                folderData = {},
                // shared navigation date
                refDate = new date.Local();

            this.promise = state.promise();

            // create container node
            this.$el = templates.getMainContainer().on('dispose', function () {
                // clean up
                for (var id in calendarViews) {
                    calendarViews[id].remove();
                    delete calendarViews[id];
                }
                self.participants.off();
                self.participants.reset([]);
                self.appointments.reset([]);
                self.autocomplete.remove();
                self.autocomplete = calendarViews = null;
                cache = {};
            });

            this.updateAppointment = function (data) {
                state.resolve('update', data);
            };

            this.newAppointment = function (data) {
                require(['io.ox/calendar/edit/main'], function (m) {
                    m.getApp().launch().done(function () {
                        this.create(data);
                    });
                });
            };

            this.onCreate = function (e, data) {
                data = {
                    start_date: data.start_date,
                    end_date: data.end_date,
                    participants: this.getParticipants(),
                    folder_id: options.folder
                };
                if (standalone) {
                    this.newAppointment(data);
                } else {
                    this.updateAppointment(data);
                }
            };

            this.postprocess = function () {
                // hide show all checkbox
                this.getCalendarView().showAll(false);
                // pre-fill participants list
                self.participants.reset(options.participants || []);
                // auto focus
                this.autoCompleteControls.find('.add-participant').focus();
                // scroll to proper time (resets cell height, too; deferred not to block UI)
                _.defer(function () {
                    self.getCalendarView().setScrollPos();
                });
            };

            this.setFolderData = function (data) {
                folderData = data;
                for (var id in calendarViews) {
                    calendarViews[id].folder(data);
                }
            };

            this.getParticipants = function () {
                return this.participants.map(function (model) {
                    return { id: model.get('id'), type: model.get('type') };
                });
            };

            function toModel(obj) {
                var model = new Backbone.Model(obj);
                model.id = _.cid(obj);
                return model;
            }

            function getColorByIndex(index) {
                var model = self.participants.at(index);
                return model ? model.index : 0;
            }

            this.loadAppointments = function () {
                var list = self.getParticipants(),
                    options = self.getCalendarView().getRequestParam();
                api.freebusy(list, options).done(function (data) {
                    // check for weekView cause it might get null if user quits
                    if (self.getCalendarView()) {
                        cache = {};
                        data = _(data).chain()
                            .map(function (request, index) {
                                return _(request.data).chain()
                                    .filter(function (obj) {
                                        // ignore shown_as "free"
                                        return obj.shown_as !== 4;
                                    })
                                    .map(function (obj) {
                                        // store index
                                        obj.index = getColorByIndex(index);
                                        // add appointments without access to cache
                                        cache[_.cid(obj)] = obj;
                                        return obj;
                                    })
                                    .value();
                            })
                            .flatten()
                            .value();
                        // reset now
                        self.getCalendarView().reset(options.start, data);
                    }
                });
            };

            function unmarkAppointments() {
                self.getCalendarView().$el.find('.appointment').removeClass('opac current');
            }

            this.sidePopup = new dialogs.SidePopup().on('close', unmarkAppointments);

            function openSidePopup(e, data) {
                self.sidePopup.show(e, function (popup) {
                    popup.append(detailView.draw(data));
                });
            }

            this.showAppointment = function (e, obj) {
                var cid = _.cid(obj),
                    folder = parseInt(obj.folder_id, 10); // otherwise '0' is true
                if (!folder && cid in cache) {
                    openSidePopup(e, cache[cid]);
                } else {
                    api.get(obj).then(
                        function (data) {
                            openSidePopup(e, data);
                        },
                        function (error) {
                            if (cid in cache) {
                                openSidePopup(e, cache[cid]);
                            } else {
                                notifications.yell(error);
                                unmarkAppointments();
                            }
                        }
                    );
                }
            };

            this.refresh = function () {
                if (self.getCalendarView()) {
                    self.loadAppointments();
                }
            };

            this.refreshChangedParticipants = _.debounce(function () {
                self.refresh();
            }, 200);

            this.refreshChangedInterval = function () {
                self.refresh();
            };

            // all appointments are stored in this collection
            this.appointments = new Backbone.Collection([]);

            this.getCalendarView = function () {
                return calendarViews[currentMode];
            };

            this.getCalendarViewInstance = function (mode) {

                var view;

                // same view?
                if (mode === currentMode) return;

                // disconnect current view?
                if ((view = calendarViews[currentMode])) {
                    view.collection = emptyCollection;
                    view.$el.detach();
                }

                // reuse view?
                if ((view = calendarViews[mode])) {
                    view.collection = this.appointments;
                    currentMode = mode;
                    self.$el.append(view.$el);
                    return view;
                }

                // create new view
                view = calendarViews[mode] = new WeekView({
                    allowLasso: true,
                    appExtPoint: 'io.ox/calendar/week/view/appointment',
                    collection: this.appointments,
                    keyboard: false,
                    mode: mode,
                    refDate: refDate,
                    showFulltime: false,
                    startDate: options.start_date,
                    todayClass: ''
                });

                currentMode = mode;

                view
                    // listen to refresh event
                    .on('onRefresh', function () {
                        // self.appointments.reset([]);
                        self.refreshChangedInterval();
                    })
                    // listen to create event
                    .on('openCreateAppointment', this.onCreate, this)
                    // listen to show appointment event
                    .on('showAppointment', this.showAppointment, this);

                var renderAppointment = view.renderAppointment;
                view.renderAppointment = function (model) {
                    var $el = renderAppointment.call(view, model);
                    $el.removeClass('modify reserved temporary absent free')
                        // set color by index
                        .addClass(templates.getColorClass(model.get('index')))
                        // whole-day / all-day / full-time
                        .addClass(model.get('full_time') ? 'fulltime' : '')
                        // temporary
                        .addClass(model.get('shown_as') === 2 ? 'striped' : '');
                    return $el;
                };

                view.folder(folderData);

                view.showAll(false);
                view.render();
                this.$el.append(view.$el.addClass('abs calendar-week-view'));

                return view;
            };

            this.getCalendarViewInstance('workweek');

            // participants collection
            this.participants = new participantsModel.Participants([]);
            this.participantsView = templates.getParticipantsView();

            function customize() {
                this.$el.addClass('with-participant-color').append(
                    templates.getParticipantColor(this.model.index)
                );
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
            }

            this.participants
                .on('remove', removeParticipant)
                .on('add', function (model) {
                    model.index = templates.getFreeColor(self.participants);
                    drawParticipant(model);
                })
                .on('reset', function () {
                    self.participantsView.empty();
                    self.participants.each(function (model, index) {
                        model.index = index;
                        drawParticipant(model);
                    });
                })
                .on('add remove reset', function () {
                    self.refreshChangedParticipants();
                });

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
                    self.participantsView.css('visibility', 'hidden').parent().busy();
                    // resolve group
                    userAPI.getList(data.members, true, { allColumns: true })
                        .done(function (list) {
                            // add type and polish display_name
                            _(list).each(function (obj) {
                                obj.type = 1;
                                obj.sort_name = contactsUtil.getSortName(obj);
                            });
                            _(list).chain().sortBy('sort_name').each(function (data) {
                                self.participants.add(data);
                            });
                        })
                        .always(function () {
                            self.participantsView.css('visibility', '').parent().idle();
                        });
                } else {
                    // single participant
                    self.participants.add(data);
                }
            });

            this.changeMode = function (mode) {
                if (currentMode !== mode) {
                    this.getCalendarViewInstance(mode);
                    _.defer(function () {
                        self.getCalendarView().setScrollPos().applyRefDate();
                    });
                }
            };

            function changeView(e) {
                e.preventDefault();
                var action = $(this).attr('data-action');
                self.changeMode(action);
            }

            function clickButton(e) {
                var action = $(this).attr('data-action');
                state.resolve(action);
            }

            this.$el.append(
                templates.getHeadline(standalone),
                templates.getParticipantsScrollpane().append(this.participantsView),
                !standalone ? templates.getBackControl() : templates.getQuitControl(),
                templates.getControls().append(
                    templates.getIntervalDropdown().on('click', 'li a', changeView),
                    this.autoCompleteControls,
                    templates.getPopover(standalone)
                )
            )
            .on('click', '.close-control a', clickButton);
        },

        getInstance: function (options, callback) {

            var freebusy = new that.FreeBusy(options);
            options.$el.append(freebusy.$el);

            folderAPI.get({ folder: options.folder }).always(function (data) {
                // pass folder data over to view (needs this for permission checks)
                // use fallback data on error
                var fallback = { folder_id: 1, id: settings.get('folder/calendar'), own_rights: 403710016 };
                if (data.error) {
                    data = fallback;
                    options.folder = fallback.id;
                }
                // show warning in case of missing 'create' right
                else if (!folderAPI.can('create', data)) {
                    templates.informAboutfallback(data);
                    data = fallback;
                    options.folder = fallback.id;
                }
                freebusy.setFolderData(data);
                // clean up
                freebusy.postprocess();
                if (callback) { callback(); }
            });

            return freebusy;
        }
    };

    return that;
});
