/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/calendar/model', ['io.ox/calendar/api',
                                'io.ox/backbone/modelFactory',
                                'io.ox/core/extensions',
                                'gettext!io.ox/calendar/calendar',
                                'io.ox/backbone/validation',
                                'io.ox/participants/model',
                                'io.ox/core/date',
                                'io.ox/core/api/folder',
                                'io.ox/core/config'], function (api, ModelFactory, ext, gt, Validators, pModel, dateAPI, folderAPI, configAPI) {

    "use strict";

    var defStart = new dateAPI.Local();
    var defEnd = new dateAPI.Local();
    defStart.setMinutes(0);
    defStart.setHours(defStart.getHours() + 1);
    defEnd.setMinutes(0);
    defEnd.setHours(defEnd.getHours() + 2);

    var factory = new ModelFactory({
        ref: 'io.ox/calendar/model',
        api: api,
        model: {
            defaults: {
                start_date: dateAPI.Local.localTime(defStart.getTime()),
                end_date: dateAPI.Local.localTime(defEnd.getTime()),
                recurrence_type: 0,
                alarm: 15
            },
            getParticipants: function () {
                if (this._participants) {
                    return this._participants;
                }
                var self = this;
                var resetListUpdate = false;
                var changeParticipantsUpdate = false;
                var participants = this._participants = new pModel.Participants(this.get('participants'));
                participants.invoke('fetch');

                function resetList(participant) {
                    if (changeParticipantsUpdate) {
                        return;
                    }
                    resetListUpdate = true;
                    self.set('participants', participants.toJSON());
                    resetListUpdate = false;
                }

                participants.on('add remove reset', resetList);

                this.on('change:participants', function () {
                    if (resetListUpdate) {
                        return;
                    }
                    changeParticipantsUpdate = true;
                    participants.reset(self.get('participants'));
                    participants.invoke('fetch');
                    changeParticipantsUpdate = false;
                });

                return participants;
            }
            // TODO: Add convenience methods for recurrence handling
            // TODO: Add convenience methods for turning full day appointments into regular appointments and back
        }
    });

    ext.point("io.ox/calendar/model/validation").extend({
        id: 'start-date-before-end-date',
        validate: function (attributes) {
            if (attributes.start_date && attributes.end_date && attributes.end_date < attributes.start_date) {
                this.add('start_date', gt("The start date must be before the end date."));
                this.add('end_date', gt("The start date must be before the end date."));
            }
        }
    });

    Validators.validationFor('io.ox/calendar/model', {
        title: { format: 'string', mandatory: true},
        start_date : { format: 'date', mandatory: true},
        end_date: { format: 'date', mandatory: true}
    });

    return {
        setDefaultParticipants: function (model) {
            return folderAPI.get({folder: model.get('folder_id')}).done(function (folder) {
                if (folderAPI.is('private', folder)) {
                    // it's a private folder for the current user, add him by default
                    // as participant
                    model.set('participants', [{id: configAPI.get('identifier'), type: 1, ui_removable: false}]);

                } else if (folderAPI.is('public', folder)) {
                    // if public folder, current user will be added
                    model.set('participants', [{id: configAPI.get('identifier'), type: 1}]);

                } else if (folderAPI.is('shared', folder)) {
                    // in a shared folder the owner (created_by) will be added by default
                    model.set('participants', [{id: folder.created_by, type: 1}]);
                }

            });
        },
    return {
        setDefaultParticipants: function (model) {
            return folderAPI.get({folder: model.get('folder_id')}).done(function (folder) {
                if (folderAPI.is('private', folder)) {
                    // it's a private folder for the current user, add him by default
                    // as participant
                    model.set('participants', [{id: configAPI.get('identifier'), type: 1, ui_removable: false}]);

                } else if (folderAPI.is('public', folder)) {
                    // if public folder, current user will be added
                    model.set('participants', [{id: configAPI.get('identifier'), type: 1}]);

                } else if (folderAPI.is('shared', folder)) {
                    // in a shared folder the owner (created_by) will be added by default
                    model.set('participants', [{id: folder.created_by, type: 1}]);
                }

            });
        },
        factory: factory,
        Appointment: factory.model,
        Appointments: factory.collection
    };
});