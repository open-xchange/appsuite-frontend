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

define('io.ox/participants/model', [
    'io.ox/core/api/user',
    'io.ox/core/api/group',
    'io.ox/core/api/resource',
    'io.ox/contacts/api',
    'io.ox/contacts/model',
    'io.ox/contacts/util',
    'io.ox/core/util',
    'gettext!io.ox/participants/model'
], function (userAPI, groupAPI, resourceAPI, contactAPI, ContactModel, util, coreUtil, gt) {

    'use strict';
    // TODO: Bulk Loading

    var Model = Backbone.Model.extend({

        TYPE_USER: 1,
        TYPE_USER_GROUP: 2,
        TYPE_RESOURCE: 3,
        TYPE_RESOURCE_GROUP: 4,
        TYPE_EXTERNAL_USER: 5,
        TYPE_DISTLIST_USER_GROUP: 6,

        TYPE_STRINGS: {
            1: '',
            2: gt('Group'),
            3: gt('Resource'),
            4: gt('Resource group'),
            5: gt('External contact'),
            6: gt('Distribution list')
        },

        defaults: {
            display_name: '',
            email1: '',
            type: 5
        },

        initialize: function () {
            var self = this;

            if (_.isString(this.get('type'))) {
                this.fixType();
            }

            if (this.get('internal_userid')) {
                this.cid = 'internal_' + this.get('internal_userid');
                this.set({
                    id: this.get('internal_userid'),
                    type: this.TYPE_USER
                });
            } else if (this.get('entity')) {
                this.cid = 'entity_' + parseInt(this.get('entity'), 10);
                this.set({
                    id: parseInt(this.get('entity'), 10),
                    type: this.TYPE_USER
                });
            } else {
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
                        this.set('id', this.getEmail());
                        this.cid = 'external_' + this.get('id');
                        break;
                    case this.TYPE_DISTLIST_USER_GROUP:
                        this.cid = 'distlist_' + this.get('id');
                        break;
                }
            }

            this.fetch().done(function () {
                self.trigger('fetch');
            });
        },

        fetch: function () {
            var self = this, df = new $.Deferred();

            function setUser(data) {
                self.set(data);
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
            }

            switch (self.get('type')) {
            case self.TYPE_USER:
                // fetch user contact
                if (self.isComplete()) {
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
                groupAPI.get({ id: self.get('id') }).done(function (group) {
                    self.set(group);
                    df.resolve();
                });
                break;
            case self.TYPE_RESOURCE:
                resourceAPI.get({ id: self.get('id') }).done(function (resource) {
                    self.set(resource);
                    df.resolve();
                });
                break;
            case self.TYPE_RESOURCE_GROUP:
                self.set('display_name', 'resource group');
                df.resolve();
                break;
            case self.TYPE_EXTERNAL_USER:
                // has
                if (self.isComplete()) {
                    setExternalContact(self.toJSON());
                } else {
                    contactAPI.getByEmailaddress(self.get('mail') || self.get('email1')).done(function (data) {
                        if (data && data.display_name) {
                            setExternalContact(data);
                        } else {
                            self.set({
                                display_name: coreUtil.unescapeDisplayName(self.get('display_name')),
                                email1: self.get('mail') || self.get('email1')
                            });
                        }
                        df.resolve();
                    });
                }
                break;
            case self.TYPE_DISTLIST_USER_GROUP:
                //fetch user group
                contactAPI.get({ id: self.get('id'), folder_id: self.get('folder_id') }).done(function (group) {
                    self.set(group);
                    df.resolve();
                });
                break;
            default:
                df.resolve();
                break;
            }

            return df;
        },

        isComplete: function () {
            return 'display_name' in this.attributes && 'image1_url' in this.attributes;
        },

        getDisplayName: function () {
            var dn = util.getMailFullName(this.toJSON());
            //display name: 'email only' participant
            return dn || (this.getEmail() !== '' ? this.getEmail().split('@')[0] : name);
        },

        getEmail: function () {
            return util.getMail(this.toJSON());
        },

        getTarget: function () {
            return this.get(this.get('field')) || this.getDisplayName();
        },

        getFieldName: function () {
            var field = this.get('field') || '';
            return field !== '' ? ContactModel.fields[field] : '';
        },

        getTypeString: function () {
            return this.TYPE_STRINGS[this.get('type')] || '';
        },

        getImage: function () {
            console.warn('deprecated');
        },

        fixType: function () {
            var newType = 0;
            switch (this.get('type')) {
                case 'user':
                    newType = this.TYPE_USER;
                    break;
                case 'group':
                    newType = this.TYPE_USER_GROUP;
                    break;
                case 'resource':
                    newType = this.TYPE_RESOURCE;
                    break;
                case 'contact':
                    if (this.get('mark_as_distributionlist')) {
                        newType = this.TYPE_DISTLIST_USER_GROUP;
                    } else {
                        newType = this.TYPE_EXTERNAL_USER;
                    }
                    break;
            }
            this.set('type', newType);
        },

        getAPIData: function () {
            var ret = {
                type: this.get('type')
            };
            if (this.get('type') === 5) {
                ret.mail = this.getEmail();
                var dn = util.getMailFullName(this.toJSON());
                if (!_.isEmpty(dn)) {
                    ret.display_name = dn;
                }
            } else if (this.has('id')) {
                ret.id = this.get('id');
            }
            return ret;
        }

    });

    var Collection = Backbone.Collection.extend({

        model: Model,

        getAPIData: function () {
            return this.map(function (model) { return model.getAPIData(); });
        },

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

        addUniquely: function (models, opt) {
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
            return this.add(toAdd, opt);
        }
    });

    return {
        Participant: Model,
        Participants: Collection
    };

});
