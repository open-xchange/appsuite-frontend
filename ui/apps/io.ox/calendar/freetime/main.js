/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/calendar/freetime/main', [
    'io.ox/backbone/disposable',
    'io.ox/calendar/freetime/model',
    'io.ox/calendar/freetime/participantsView',
    'io.ox/calendar/freetime/timeView',
    'gettext!io.ox/calendar',
    'settings!io.ox/calendar',
    'settings!io.ox/core',
    'less!io.ox/calendar/freetime/style',
    'less!io.ox/calendar/style'
], function (DisposableView, FreetimeModel, ParticipantsView, TimeView, gt, settings, coreSettings) {

    'use strict';

    //
    // Freetimeview. Simple view used to coordinate appointments with multiple participants
    //

    var FreetimeView = DisposableView.extend({

        className: 'freetime-view',

        initialize: function (options) {

            var self = this;

            this.options = options || {};
            this.parentModel = options.parentModel;
            this.app = options.app;
            if (options.parentModel) {
                this.model.get('participants').add(options.parentModel.get('participants'));
                this.model.set('currentWeek', moment(options.parentModel.get('start_date')).startOf('week'));
            } else {
                if (options.startDate) {
                    this.model.set('currentWeek', moment(options.startDate).startOf('week'));
                }
                if (options.participants) {
                    this.model.get('participants').add(options.participants);
                }
            }

            this.participantsSubview = new ParticipantsView({ model: this.model, parentView: this });
            this.timeSubview = new TimeView({ model: this.model, parentModel: options.parentModel, parentView: this });

            this.model.on('change:zoom', self.updateZoom.bind(this));
            this.model.on('change:compact', self.updateCompact.bind(this));
            this.model.on('change:onlyWorkingHours', self.updateWorkingHours.bind(this));
            this.model.on('change:onlyWorkingHours change:compact change:zoom change:showFree change:showTemporary change:showReserved change:showAbsent', self.updateSettings.bind(this));

            this.on('dispose', function () {
                self.timeSubview.dispose();
                self.participantsSubview.dispose();
            });
            this.timeSubview.bodyNode.on('scroll', function () {
                if (self.participantsSubview.bodyNode[0].scrollTop === 0 && this.scrollTop === 0) {
                    return;
                }
                self.participantsSubview.bodyNode[0].scrollTop = this.scrollTop;
            });

            this.header = $('<div class="freetime-view freetime-view-header">').addClass('zoomlevel-' + this.model.get('zoom'));
            this.body = $('<div class="freetime-view freetime-view-body">').addClass('zoomlevel-' + this.model.get('zoom'));
            this.updateWorkingHours();
            this.updateCompact();
        },

        updateSettings: function () {
            settings.set('scheduling/zoom', this.model.get('zoom'));
            settings.set('scheduling/onlyWorkingHours', this.model.get('onlyWorkingHours'));
            settings.set('scheduling/showFree', this.model.get('showFree'));
            settings.set('scheduling/showAbsent', this.model.get('showAbsent'));
            settings.set('scheduling/showReserved', this.model.get('showReserved'));
            settings.set('scheduling/showTemporary', this.model.get('showTemporary'));
            settings.set('scheduling/compact', this.model.get('compact'));
            settings.save();
        },

        updateZoom: function () {
            this.header.removeClass('zoomlevel-100 zoomlevel-200 zoomlevel-400 zoomlevel-1000').addClass('zoomlevel-' + this.model.get('zoom'));
            this.body.removeClass('zoomlevel-100 zoomlevel-200 zoomlevel-400 zoomlevel-1000').addClass('zoomlevel-' + this.model.get('zoom'));
        },

        updateWorkingHours: function () {
            this.header.toggleClass('only-workinghours', this.model.get('onlyWorkingHours'));
            this.body.toggleClass('only-workinghours', this.model.get('onlyWorkingHours'));
        },

        updateCompact: function () {
            this.header.toggleClass('compact', this.model.get('compact'));
            this.body.toggleClass('compact', this.model.get('compact'));
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

        render: function () {
            this.renderHeader();
            this.renderBody();
            return this;
        },

        createDistributionlistButton: function () {
            var self = this,
                distributionListButton = $('<button class="btn btn-link scheduling-distributionlist-button">').text(gt('Save as distribution list'));

            distributionListButton.on('click', function () {
                require(['io.ox/calendar/freetime/distributionListPopup'], function (distrib) {
                    distrib.showDialog({ participants: self.model.get('participants') });
                });
            });
            return distributionListButton;
        },

        save: function () {
            if (this.options.isApp && this.app) {
                var appointment = this.createAppointment();

                if (appointment) {
                    appointment.folder = coreSettings.get('folder/calendar');
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
            var saveButton = $('<button class="btn btn-primary pull-right scheduling-save-button">').text(gt('Create appointment')),
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
                focus: 'input.add-participant.tt-input',
                maximize: true,
                title: options.title || gt('Scheduling'),
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
            .open();

            return { dialog: dialog, view: view };
        });
    }

    function createApp() {

        var app = ox.ui.createApp({ name: 'io.ox/calendar/scheduling', title: gt('Scheduling'), userContent: true, closable: true }), win;

        app.setLauncher(function (options) {

            options = options || {};
            options.model = new FreetimeModel();
            options.isApp = true;
            options.app = app;

            var closeButton = $('<button class="btn btn-link scheduling-app-close">').attr('title', gt('Close')).append($('<i class="fa fa-close" aria-hidden="true">')).on('click', function () {
                app.quit();
            });

            win = ox.ui.createWindow({
                name: 'io.ox/calendar/scheduling',
                chromeless: true
            });

            app.setWindow(win);

            app.view = new FreetimeView(options);
            win.nodes.main.append($('<div class="scheduling-app-header">').append($('<h4 class="app-title">').text(gt('Scheduling')), app.view.timeSubview.headerNodeRow1, closeButton), app.view.header,
                                     $('<div class="scheduling-app-body" draggable="false">').append(app.view.body), app.view.createFooter());
            win.show();
            app.view.render();

            win.nodes.outer.find('input.add-participant.tt-input').focus();
        });

        app.setQuit(function () {
            app.view.dispose();
            return $.when();
        });

        app.failSave = function () {
            if (this.view.model) {
                return {
                    description: gt('Scheduling'),
                    module: 'io.ox/calendar/freetime',
                    point:  {
                        participants: this.view.model.get('participants'),
                        currentWeek: this.view.model.get('currentWeek').valueOf(),
                        lassoStart: this.view.timeSubview.lassoStart,
                        lassoEnd: this.view.timeSubview.lassoEnd
                    }
                };
            }
            return false;
        };

        app.failRestore = function (point) {
            this.view.model.get('participants').add(point.participants);
            this.view.timeSubview.setDate(point.currentWeek);
            this.view.timeSubview.lassoStart = point.lassoStart;
            this.view.timeSubview.lassoEnd = point.lassoEnd;
            this.view.timeSubview.updateLasso(true);
            return $.when();
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
