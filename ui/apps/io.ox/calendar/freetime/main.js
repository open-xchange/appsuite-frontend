/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/calendar/freetime/main', [
    'io.ox/backbone/views/disposable',
    'io.ox/calendar/freetime/model',
    'io.ox/calendar/freetime/participantsView',
    'io.ox/calendar/freetime/timeView',
    'io.ox/calendar/api',
    'gettext!io.ox/calendar',
    'settings!io.ox/calendar',
    'io.ox/calendar/util',
    'io.ox/core/folder/api',
    'less!io.ox/calendar/freetime/style',
    'less!io.ox/calendar/style'
], function (DisposableView, FreetimeModel, ParticipantsView, TimeView, api, gt, settings, util, folderAPI) {

    'use strict';

    // helper variables
    var SETTINGS_KEYS = ['zoom', 'onlyWorkingHours', 'showFree', 'showReserved', 'compact', 'dateRange', 'showFineGrid'],
        ZOOM_LEVELS = _([10, 25, 50, 100, 200, 400, 1000]).map(function (level) { return 'zoomlevel-' + level; }).join(' ');

    //
    // Freetimeview. Simple view used to coordinate appointments with multiple participants
    //

    var FreetimeView = DisposableView.extend({

        className: 'freetime-view',

        initialize: function (options) {

            var self = this,
                refresh = self.refresh.bind(this);

            this.options = options || {};
            this.parentModel = options.parentModel;
            this.app = options.app;
            var attendeesToAdd = [],
                date;
            if (options.parentModel) {
                attendeesToAdd = options.parentModel.get('attendees');
                date = util.isAllday(options.parentModel) ? moment(options.parentModel.get('startDate').value) : util.getMoment(options.parentModel.get('startDate'));

                this.model.set('startDate', date.startOf(this.model.get('dateRange')));
            } else {
                if (options.startDate) {
                    date = options.startDate;
                    this.model.set('startDate', moment(options.startDate).startOf(this.model.get('dateRange')));
                }
                if (options.attendees) {
                    attendeesToAdd = options.attendees;
                }
            }

            // reference to the date we started the view in (is used to prevent jumping when switching from month to week)
            this.model.set('viewStartedWith', moment(date));

            this.participantsSubview = new ParticipantsView({ model: this.model, parentView: this });
            this.timeSubview = new TimeView({ model: this.model, parentModel: options.parentModel, parentView: this });

            this.model.on('change:zoom', self.updateZoom.bind(this));
            this.model.on('change:compact', self.updateClasses.bind(this, 'compact'));
            this.model.on('change:onlyWorkingHours', self.updateClasses.bind(this, 'onlyWorkingHours'));
            this.model.on('change:showFineGrid', self.updateClasses.bind(this, 'showFineGrid'));
            this.model.on(_(SETTINGS_KEYS).map(function (setting) { return 'change:' + setting; }).join(' '), self.updateSettings.bind(this));

            api.on('refresh.all update', refresh);
            this.on('dispose', function () {
                self.timeSubview.dispose();
                self.participantsSubview.dispose();
                api.off('refresh.all update', refresh);
            });
            this.timeSubview.bodyNode.on('scroll', function () {
                if (self.participantsSubview.bodyNode[0].scrollTop === 0 && this.scrollTop === 0) {
                    return;
                }
                self.participantsSubview.bodyNode[0].scrollTop = this.scrollTop;
            });
            // allow scrolling in the participants area without a scrollbar
            this.participantsSubview.bodyNode.on('wheel', function (e) {
                // firefox needs a multiplicator here or it's too slow
                self.timeSubview.bodyNode[0].scrollTop = self.timeSubview.bodyNode[0].scrollTop + e.originalEvent.deltaY * (_.device('firefox') ? 4 : 1);
            });

            this.header = $('<div class="freetime-view freetime-view-header">').addClass('zoomlevel-' + this.model.get('zoom'));
            this.body = $('<div class="freetime-view freetime-view-body">').addClass('zoomlevel-' + this.model.get('zoom'));

            this.updateClasses('onlyWorkingHours');
            this.updateClasses('showFineGrid');
            this.updateClasses('compact');

            return this.model.get('attendees').add(attendeesToAdd);
        },

        updateClasses: function (className) {
            this.header.toggleClass(className, this.model.get(className));
            this.body.toggleClass(className, this.model.get(className));
        },

        updateSettings: function () {
            var self = this;
            _(SETTINGS_KEYS).each(function (key) {
                settings.set('scheduling/' + key, self.model.get(key));
            });
            settings.save();
        },

        updateZoom: function () {
            this.header.removeClass(ZOOM_LEVELS).addClass('zoomlevel-' + this.model.get('zoom'));
            this.body.removeClass(ZOOM_LEVELS).addClass('zoomlevel-' + this.model.get('zoom'));
        },

        renderHeader: function () {
            this.header.empty();
            this.header.append($('<div class="header-row2">').append(this.participantsSubview.headerNodeRow, this.timeSubview.headerNodeRow2));
            this.participantsSubview.renderHeader();
            this.timeSubview.renderHeader();
            return this.header;
        },

        renderBody: function () {
            this.body.empty();
            this.body.append(this.participantsSubview.bodyNode, this.timeSubview.bodyNode);
            this.participantsSubview.renderBody();
            this.timeSubview.renderBody();
            return this.body;
        },

        // use debouce since we don't want to refresh to often
        refresh: _.debounce(function () {
            if (this.disposed) return;
            this.timeSubview.getAppointmentsInstant();
        }, 200),

        render: function () {
            this.renderHeader();
            this.renderBody();
            return this;
        },

        createDistributionlistButton: function () {
            var self = this,
                distributionListButton = $('<button type="button" class="btn btn-link scheduling-distributionlist-button">').text(gt('Save as distribution list'));

            distributionListButton.on('click', function () {
                util.resolveAttendees({ attendees: self.model.get('attendees').toJSON() }).done(function (distlist) {
                    require(['settings!io.ox/core'], function (coreSettings) {
                        ox.launch('io.ox/contacts/distrib/main')
                            .done(function () {
                                this.create(coreSettings.get('folder/contacts'), {
                                    distribution_list: distlist
                                });
                            });
                    });
                });
            });
            return distributionListButton;
        },

        save: function () {
            if (this.options.isApp && this.app) {
                var appointment = this.createAppointment();

                if (appointment) {
                    appointment.folder = folderAPI.getDefaultFolder('calendar');
                    ox.load(['io.ox/calendar/edit/main']).done(function (edit) {
                        edit.getApp().launch().done(function () {
                            this.create(appointment);
                        });
                    });
                    this.app.quit();
                } else {
                    require(['io.ox/core/yell'], function (yell) {
                        yell('info', gt('Please select a time for the appointment'));
                    });
                }
            } else {
                this.options.popup.invokeAction('save');
            }
        },

        createFooter: function () {
            var saveButton = $('<button type="button" class="btn btn-primary pull-right scheduling-save-button">').text(gt('Create appointment')),
                distributionListButton = this.createDistributionlistButton(),
                node = $('<div class="scheduling-app-footer clearfix">').append(distributionListButton, saveButton);

            saveButton.on('click', this.save.bind(this));

            return node;
        },

        // for convenienece
        createAppointment: function () {
            return this.timeSubview.createAppointment();
        }
    });

    function showDialog(options) {

        options = options || {};
        options.model = new FreetimeModel();

        return require(['io.ox/backbone/views/modal']).then(function (ModalDialog) {

            var dialog, view;

            dialog = new ModalDialog({
                async: true,
                focus: 'a.control.prev',
                maximize: true,
                title: options.title || gt.pgettext('app', 'Scheduling'),
                width: '100%'
            })
            .build(function () {
                options.popup = this;
                view = new FreetimeView(options);
                this.$el.addClass('freetime-popup');
                // append after header so it does not scroll with the rest of the view
                this.$el.find('.modal-header').append(view.timeSubview.headerNodeRow1).after(view.header);
                this.$body.append(view.body);
                this.$el.find('.modal-footer').prepend(view.createDistributionlistButton().addClass('pull-left'));
                view.render();
            })
            .addCancelButton()
            .addButton({ action: 'save', label: options.label || gt('Create appointment') })
            .on('close', function () {
                view.dispose();
            })
            .open();

            return { dialog: dialog, view: view };
        });
    }

    function createApp() {

        var app = ox.ui.createApp({
                name: 'io.ox/calendar/scheduling',
                title: gt.pgettext('app', 'Scheduling'),
                userContent: true,
                closable: true
            }), win;

        app.setLauncher(function (options) {

            options = options || {};
            options.model = new FreetimeModel();
            options.isApp = true;
            options.app = app;

            var closeButton = $('<button type="button" class="btn btn-link scheduling-app-close">').attr('title', gt('Close')).append($('<i class="fa fa-close" aria-hidden="true">')).on('click', function () {
                app.quit();
            });

            win = ox.ui.createWindow({
                name: 'io.ox/calendar/scheduling',
                chromeless: true
            });

            app.setWindow(win);

            app.view = new FreetimeView(options);
            win.nodes.main.append(
                $('<div class="scheduling-app-header">').append(
                    $('<h4 class="app-title">').text(gt.pgettext('app', 'Scheduling')),
                    app.view.timeSubview.headerNodeRow1,
                    closeButton
                ),
                app.view.header,
                $('<div class="scheduling-app-body" draggable="false">').append(app.view.body),
                app.view.createFooter()
            );
            win.show();
            app.view.render();

            win.nodes.outer.find('a.control.prev').focus();
        });

        app.setQuit(function () {
            app.view.dispose();
            return $.when();
        });

        app.failSave = function () {
            if (this.view.model) {
                return {
                    description: gt.pgettext('app', 'Scheduling'),
                    module: 'io.ox/calendar/freetime',
                    point:  {
                        attendees: this.view.model.get('attendees'),
                        startDate: this.view.model.get('startDate').valueOf(),
                        lassoStart: this.view.timeSubview.lassoStart,
                        lassoEnd: this.view.timeSubview.lassoEnd
                    }
                };
            }
            return false;
        };

        app.failRestore = function (point) {

            this.view.timeSubview.lassoStart = point.lassoStart;
            this.view.timeSubview.lassoEnd = point.lassoEnd;
            this.view.timeSubview.setDate(point.startDate);
            this.view.model.set('viewStartedWith', moment(point.startDate));
            this.view.timeSubview.updateLasso(true);
            if (!point.lassoStart) {
                this.view.timeSubview.keepScrollpos = 'today';
            } else {
                this.view.timeSubview.keepScrollpos = this.view.timeSubview.lassoStartTime;
            }
            return this.view.model.get('attendees').add(point.attendees);
        };

        app.getContextualHelp = function () {
            return 'ox.appsuite.user.sect.calendar.add.scheduling.html';
        };

        return app;
    }

    return {
        FreetimeView: FreetimeView,
        showDialog: showDialog,
        // just for convenience purposes
        FreetimeModel:  FreetimeModel,
        getApp: createApp
    };
});
