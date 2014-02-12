/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/participants/model',
    ['io.ox/core/api/user',
     'io.ox/core/api/group',
     'io.ox/core/api/resource',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/core/util'
    ], function (userAPI, groupAPI, resourceAPI, contactAPI, util, coreUtil) {

    'use strict';
    // TODO: Bulk Loading

    var ParticipantModel = Backbone.Model.extend({

        TYPE_USER: 1,
        TYPE_USER_GROUP: 2,
        TYPE_RESOURCE: 3,
        TYPE_RESOURCE_GROUP: 4,
        TYPE_EXTERNAL_USER: 5,
        TYPE_DISTLIST_USER_GROUP: 6,

        defaults: {
            display_name: '',
            email1: ''
        },

        initialize: function () {
            var self = this;
            if (this.get('internal_userid')) {
                this.cid = 'internal_' + this.get('internal_userid');
                this.set({
                    id: this.get('internal_userid'),
                    type: this.TYPE_USER
                });
            }
            else if (this.get('entity')) {
                this.cid = 'entity_' + parseInt(this.get('entity'), 10);
                this.set({
                    id: parseInt(this.get('entity'), 10),
                    type: this.TYPE_USER
                });
            }
            else {
                switch (this.get('type')) {
                case this.TYPE_USER:
                    this.cid = 'internal_' + this.get('id');
                    break;
                case this.TYPE_USER_GROUP:
                    this.cid = 'usergroup_' + this.get('id');
                    break;
                case this.TYPE_RESOURCE:
                    this.cid = 'resource_' + this.get('id');
                    break;
                case this.TYPE_RESOURCE_GROUP:
                    this.cid = 'resourcegroup_' + this.get('id');
                    break;
                case this.TYPE_EXTERNAL_USER:
                    this.cid = 'external_' + this.getEmail();
                    this.set('id', this.getEmail());
                    break;
                case this.TYPE_DISTLIST_USER_GROUP:
                    this.cid = 'distlist_' + this.get('id');
                    break;
                }
            }

            this.fetch().done(function () {
                self.trigger('fetch');
                self.trigger('change');
            });
        },

        fetch: function () {

            var self = this, df = new $.Deferred();

            function setUser(data) {
                self.set(data);
                self.trigger('change', self);
                df.resolve();
            }

            function setExternalContact(data) {
                self.set({
                    display_name: data.display_name,
                    email1: self.get('mail') || self.get('email1'),
                    image1_url: data.image1_url,
                    type: data.internal_userid ? self.TYPE_USER : self.TYPE_EXTERNAL_USER,
                    id: data.internal_userid ? data.internal_userid : self.get('id')
                });
                self.id = self.get('id');
                self.trigger('change');
            }

            switch (self.get('type')) {
            case self.TYPE_USER:
                // fetch user contact
                if (self.has('display_name') && self.has('image1_url')) {
                    setUser(self.toJSON());
                } else {
                    userAPI.get({ id: self.get('id') }).then(
                        function (data) {
                            setUser(data);
                        },
                        function () {
                            if (!self.get('display_name')) {
                                self.set('display_name', self.get('mail'));
                            }
                            df.resolve();
                        }
                    );
                }
                break;
            case self.TYPE_USER_GROUP:
                //fetch user group
                groupAPI.get({id: self.get('id')}).done(function (group) {
                    self.set(group);
                    self.trigger('change', self);
                    df.resolve();
                });
                break;
            case self.TYPE_RESOURCE:
                resourceAPI.get({id: self.get('id')}).done(function (resource) {
                    self.set(resource);
                    self.trigger('change', self);
                    df.resolve();
                });
                break;
            case self.TYPE_RESOURCE_GROUP:
                self._data = {display_name: 'resource group'};
                self.trigger('change', self);
                df.resolve();
                break;
            case self.TYPE_EXTERNAL_USER:
                // has
                if (self.has('display_name') && self.has('image1_url')) {
                    setExternalContact(self.toJSON());
                } else {
                    contactAPI.getByEmailadress(self.get('mail') || self.get('email1')).done(function (data) {
                        if (data && data.display_name) {
                            setExternalContact(data);
                        } else {
                            self.set({
                                display_name: coreUtil.unescapeDisplayName(self.get('display_name')),
                                email1: self.get('mail') || self.get('email1')
                            });
                        }
                        self.trigger('change', self);
                        df.resolve();
                    });
                }
                break;
            case self.TYPE_DISTLIST_USER_GROUP:
                //fetch user group
                contactAPI.get({ id: self.get('id'), folder_id: self.get('folder_id') }).done(function (group) {
                    self.set(group);
                    self.trigger('change', self);
                    df.resolve();
                });
                break;
            default:
                self.set({ display_name: 'unknown' });
                self.trigger('change', self);
                df.resolve();
                break;
            }

            return df;
        },

        getDisplayName: function () {
            return util.getMailFullName(this.toJSON());
        },
        getEmail: function () {
            return util.getMail(this.toJSON());
        },
        getImage: function () {
            console.warn('deprecated');
        },
        markAsUnremovable: function () {
            this.set('ui_removable', false);
        }

    });

    var ParticipantsCollection = Backbone.Collection.extend({

        initialize: function () {
            var self = this;
            self.on('change', function () {
                // Deduplication
                var idMap = {};
                var duplicates = [];
                self.each(function (p) {
                    if (idMap[p.id]) {
                        duplicates.push(p);
                    } else {
                        idMap[p.id] = true;
                    }
                });
                self.remove(duplicates);
            });
        },

        model: ParticipantModel,

        addUniquely: function (models) {
            var self = this;
            if (!_.isArray(models)) {
                models = [models];
            }
            var toAdd = [];
            _(models).each(function (participant) {
                if (!self.get(participant.id)) {
                    toAdd.push(participant);
                }
            });
            this.add(toAdd);
        }
    });

    return {
        Participant: ParticipantModel,
        Participants: ParticipantsCollection
    };

});
