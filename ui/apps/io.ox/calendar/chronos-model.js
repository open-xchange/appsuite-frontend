/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 *
 */

define('io.ox/calendar/chronos-model', [
    'io.ox/core/extensions',
    'io.ox/calendar/chronos-util',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar',
    'io.ox/backbone/basicModel',
    'io.ox/backbone/validation',
    'io.ox/core/strings'
], function (ext, util, folderAPI, gt, BasicModel, Validators, strings) {

    'use strict';

    var // be careful with the add method. If the option resolveGroups is present it changes from synchronous to asynchronous (must get the proper user data first)
        AttendeeCollection = Backbone.Collection.extend({
            // if an email is present distinguisch the attendees by email address (provides support for attendee with multiple mail addresses).
            // Some attendee types don't have an email address (groups and resources), but have entity numbers. Use those as id to prevent duplicates
            modelId: function (attrs) {
                return attrs.email || attrs.entity;
            },
            initialize: function (models, options) {
                this.options = options || {};
                if (this.options.resolveGroups) {
                    this.oldAdd = this.add;
                    this.add = this.addAsync;
                }
            },
            // special add function that allows resolving of groups
            // is used when option resolveGroups is active (used by scheduling view)
            addAsync: function (models, options) {
                var usersToResolve  = [],
                    modelsToAdd = [],
                    self = this,
                    def = $.Deferred();
                models = [].concat(models);
                _(models).each(function (model) {
                    if (model.cuType === 'GROUP' || (model.get && model.get('cuType') === 'GROUP')) {
                        usersToResolve = _.uniq(usersToResolve.concat(model instanceof Backbone.Model ? model.get('members') : model.members));
                    } else {
                        modelsToAdd.push(model);
                    }
                });
                require(['io.ox/core/api/user'], function (userAPI) {
                    userAPI.getList(usersToResolve).done(function (users) {
                        modelsToAdd = _.uniq(_.union(modelsToAdd, _(users).map(function (user) {
                            return util.createAttendee(user);
                        })));
                        // no merge here or we would overwrite the confirm status
                        def.resolve(self.oldAdd(modelsToAdd, options));
                    }).fail(def.reject);
                });

                return def;
            }
        });

    var Model = BasicModel.extend({
        idAttribute: 'cid',
        ref: 'io.ox/chronos/model/',
        init: function () {
            // models in create view do not have an id yet. avoid undefined.undefined cids
            if (this.attributes.folder && this.attributes.id) {
                this.cid = this.attributes.cid = util.cid(this.attributes);
            }
        },
        getAttendees: function () {
            if (this._attendees) {
                return this._attendees;
            }
            var self = this,
                resetListUpdate = false,
                changeAttendeesUpdate = false;

            this._attendees = new AttendeeCollection(this.get('attendees'), { silent: false });

            this._attendees.on('add remove reset', function () {
                if (changeAttendeesUpdate) {
                    return;
                }

                resetListUpdate = true;
                self.set('attendees', this.toJSON(), { validate: true });
                resetListUpdate = false;
            });

            this.on('change:attendees', function () {
                if (resetListUpdate) {
                    return;
                }
                changeAttendeesUpdate = true;
                self._attendees.reset(self.get('attendees'));
                changeAttendeesUpdate = false;
            });
            return this._attendees;
        },

        setDefaultAttendees: function (options) {
            var self = this;
            var def = $.Deferred();
            folderAPI.get(this.get('folder')).then(function (folder) {
                if (folderAPI.is('private', folder)) {
                    // if private folder, current user will be the organizer
                    if (options.create) {
                        require(['io.ox/core/api/user'], function (userAPI) {
                            userAPI.get().done(function (user) {

                                self.set('organizer', {
                                    cn: user.display_name,
                                    email: user.email1,
                                    uri: 'mailto:' + user.email1,
                                    entity: ox.user_id
                                });
                                self.getAttendees().add(util.createAttendee(user, { partStat: 'ACCEPTED' }));
                                def.resolve();

                            }).fail(def.reject);
                        });
                    } else {
                        def.resolve();
                    }
                } else if (folderAPI.is('public', folder)) {
                    // if public folder, current user will be added
                    if (options.create) {
                        require(['io.ox/core/api/user'], function (userAPI) {
                            userAPI.get().done(function (user) {

                                self.getAttendees().add(util.createAttendee(user, { partStat: 'ACCEPTED' }));
                                def.resolve();

                            }).fail(def.reject);
                        });
                    } else {
                        def.resolve();
                    }
                } else if (folderAPI.is('shared', folder)) {
                    // in a shared folder the owner (created_by) will be added by default
                    require(['io.ox/core/api/user'], function (userAPI) {
                        userAPI.get(folder.created_by).done(function (user) {

                            self.getAttendees().add(util.createAttendee(user, { partStat: 'ACCEPTED' }));
                            def.resolve();

                        }).fail(def.reject);
                    });
                }
            }).fail(def.reject);
            return def;
        },
        getMoment: function (name) {
            if (!this.get(name)) return;
            var date = this.get(name);
            return moment.tz(date.value, date.tzid || moment.defaultZone.name);
        },
        getTimestamp: function (name) {
            if (!this.get(name)) return;
            return this.getMoment(name).valueOf();
        },
        parse: function (res) {
            return res;
        }
    });

    ext.point('io.ox/chronos/model/validation').extend({
        id: 'start-date-before-end-date',
        validate: function (attr, err, model) {
            if (model.getTimestamp('endDate') < model.getTimestamp('startDate')) {
                this.add('endDate', gt('The end date must be after the start date.'));
            }
        }
    });

    ext.point('io.ox/calendar/model/validation').extend({
        id: 'upload-quota',
        validate: function (attributes) {
            if (attributes.quotaExceeded) {
                //#. %1$s is an upload limit like for example 10mb
                this.add('quota_exceeded', gt('Files can not be uploaded, because upload limit of %1$s is exceeded.', strings.fileSize(attributes.quotaExceeded.attachmentMaxUploadSize, 2)));
            }
        }
    });

    Validators.validationFor('io.ox/chronos/model', {
        summary: { format: 'string', mandatory: true }
    });

    var Collection = Backbone.Collection.extend({

        model: Model,

        comparator: function (model) {
            return model.getTimestamp('startDate');
        }

    });

    return {
        Model: Model,
        Collection: Collection,
        AttendeeCollection: AttendeeCollection
    };
});
