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
    'gettext!io.ox/core'
], function (userAPI, groupAPI, resourceAPI, contactAPI, ContactModel, util, coreUtil, gt) {

    'use strict';
    // TODO: Bulk Loading

    var Model = Backbone.Model.extend({

        idAttribute: 'pid',

        TYPE_UNKNOWN: 0,
        TYPE_USER: 1,
        TYPE_USER_GROUP: 2,
        TYPE_RESOURCE: 3,
        TYPE_RESOURCE_GROUP: 4,
        TYPE_EXTERNAL_USER: 5,
        TYPE_DISTLIST: 6,

        TYPE_LABEL: 'unknown internal usergroup resource resourcegroup external distlist'.split(' '),

        TYPE_STRINGS: {
            0: gt('Unknown'),
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
            field: 'email1',
            type: 5 // external
        },

        loading: null,

        initialize: function () {
            var self = this;

            // fix type attribute / for example autocomplete api
            if (_.isString(this.get('type'))) {
                var newType = this.TYPE_UNKNOWN;
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
                            newType = this.TYPE_DISTLIST;
                        } else {
                            newType = this.TYPE_EXTERNAL_USER;
                        }
                        break;
                    // no default
                }
                this.set('type', newType);
            }

            // handling for distribution list members
            if (this.get('mail_field')) {
                this.set('field', 'email' + this.get('mail_field'));
            }

            this.loading = this.fetch().then(function () {
                self.magic();
            });
        },

        magic: function () {
            // It's a kind of magic
            // convert external user having an internal user id to internal users
            if (this.has('field')) {
                if (this.is('user-contact')) {
                    this.set({
                        'type': this.TYPE_USER,
                        'contact_id': this.get('id'),
                        'id': this.get('internal_userid')
                    });
                } else if (this.is('user-extra')) {
                    this.set({
                        'type': this.TYPE_EXTERNAL_USER,
                        'internal_userid': this.get('id'),
                        'id': this.get('contact_id')
                    });
                }
            }

            // add: missing id for unknown external users
            if (this.is('contact') && !this.has('id')) {
                this.set('id', this.getEmail(), { silent: true });
            }
            // set pid
            this.setPID();
            // for typeahead hint
            this.value = this.getTarget() || this.getDisplayName();
        },

        setPID: function () {
            var pid = [this.TYPE_LABEL[this.get('type')], this.get('id'), this.get('field')].join('_');
            this.set('pid', pid, { silent: true });
        },


        is: function (type) {
            switch (type) {
                // a contact based on a user (f.e. secondary mail address)
                case 'user':
                    return this.get('type') === this.TYPE_USER;
                // a contact without connection to a user
                case 'contact':
                    return this.get('type') === this.TYPE_EXTERNAL_USER;
                case 'group':
                    return this.get('type') === this.TYPE_USER_GROUP;
                case 'resource':
                    return this.get('type') === this.TYPE_RESOURC;
                case 'list':
                    return this.get('type') === this.TYPE_DISTLIST;
                case 'unknown':
                    return this.get('type') === this.TYPE_UNKNOWN;
                // USER-CONTACT MAGIC
                case 'user-contact':
                    return this.is('contact') && this.get('internal_userid') && this.get('field') === 'email1';
                case 'user-extra':
                    return this.is('user') && this.get('contact_id') && this.has('field') && this.get('field') !== 'email1';
                default:
                    break;
            }
        },

        getContactID: function () {
            if (this.is('user') && this.get('contact_id')) {
                return this.get('contact_id');
            }
            return this.get('id');
        },

        getDisplayName: function () {
            var dn = util.getMailFullName(this.toJSON());
            // 'email only' participant
            return dn || (this.getEmail() !== '' ? this.getEmail() : '');
        },

        getEmail: function () {
            return util.getMail(this.toJSON());
        },

        getTarget: function (opt) {
            opt = _.extend({ fallback: false }, opt);
            if (opt.fallback && this.is('list')) return 'distribution_list';
            return this.get(this.get('field')) || this.getEmail();
        },

        getFieldString: function () {
            return this.has('field') ? ContactModel.fields[this.get('field')] : '';
        },

        getTypeString: function () {
            return this.TYPE_STRINGS[this.get('type')] || '';
        },

        getFieldNumber: function () {
            if (_.isNumber(this.get('mail_field'))) {
                return this.get('mail_field');
            } else if (this.get('field')) {
                return parseInt(this.get('field').slice(-1), 10);
            }
            return 0;
        },

        getAPIData: function () {
            var ret = {
                type: this.get('type')
            };
            if (this.get('field')) {
                ret.field = this.get('field');
            }
            if (this.get('type') === 5) {
                ret.mail = this.getTarget();
                var dn = this.getDisplayName(this.toJSON());
                if (!_.isEmpty(dn)) {
                    ret.display_name = dn;
                }
            } else if (this.has('id')) {
                ret.id = this.get('id');
            }
            return ret;
        },

        fetch: function () {

            var model = this,
                update = function (data) {
                    model.set(data);
                },
                partialUpdate = function (data) {
                    // keep display_name (see bug 40264)
                    if (model.get('display_name')) {
                        // if we have a display name we drop other names to keep it
                        // since this update is done on search results
                        data = _(data).omit('first_name', 'last_name', 'display_name');
                    }
                    model.set(data);
                };

            switch (this.get('type')) {
                case this.TYPE_USER:
                    if (this.get('display_name') && 'image1_url' in this.attributes) break;
                    return userAPI.get({ id: this.get('id') }).then(update);
                case this.TYPE_USER_GROUP:
                    if (this.get('display_name') && this.get('members')) break;
                    return groupAPI.get({ id: this.get('id') }).then(update);
                case this.TYPE_RESOURCE:
                    if (this.get('display_name')) break;
                    return resourceAPI.get({ id: this.get('id') }).then(update);
                case this.TYPE_RESOURCE_GROUP:
                    this.set('display_name', 'resource group');
                    break;
                case this.TYPE_EXTERNAL_USER:
                    if (this.get('display_name') && 'image1_url' in this.attributes) break;
                    if (this.get('id') && this.get('folder_id')) {
                        return contactAPI.get(this.pick('id', 'folder_id')).then(update);
                    }
                    return contactAPI.getByEmailaddress(this.getEmail()).then(partialUpdate);
                case this.TYPE_DISTLIST:
                    if (this.get('display_name') && 'distribution_list' in this.attributes) break;
                    return contactAPI.get(this.pick('id', 'folder_id')).then(update);
                // no default
            }

            return $.when();
        }
    });

    var Collection = Backbone.Collection.extend({

        model: Model,

        getAPIData: function () {
            return this.map(function (model) { return model.getAPIData(); });
        },

        initialize: function (models, options) {
            var self = this;
            this.options = options || {};
            this.on('change', function () {
                // Deduplication on model change
                var idMap = {},
                    duplicates = [];
                self.each(function (p) {
                    if (!p.id) return;
                    if (idMap[p.id]) {
                        duplicates.push(p);
                    } else {
                        idMap[p.id] = true;
                    }
                });
                self.remove(duplicates);
            });
            // wrap add function
            this.oldAdd = this.add;
            this.add = this.addUniquely;
        },

        addUniquely: function (models, opt) {
            var self = this;
            _([].concat(models))
                .each(function (participant) {
                    // resolve distribution lists
                    var add;
                    if (participant instanceof self.model && participant.get('mark_as_distributionlist')) {
                        add = participant.get('distribution_list');
                    } else if (participant.mark_as_distributionlist) {
                        add = participant.distribution_list;
                    }
                    // split groups into single users if the option is set. Note: this requires a server call
                    if (self.options.splitGroups && (participant.type === 2 || (participant.get && participant.get('type') === 2))) {
                        var groupUsers = participant.get ? participant.get('members') : participant.members;
                        // if member attribute is not present we need to fetch the group first
                        if (!groupUsers) {
                            groupAPI.get({ id: participant.id || participant.get('id') }).done(function (group) {
                                groupUsers = group.members;
                                userAPI.getList(groupUsers).done(function (Users) {
                                    self.addUniquely(Users);
                                });
                            });
                        }
                        userAPI.getList(groupUsers).done(function (Users) {
                            self.addUniquely(Users);
                        });
                    } else {
                        _([].concat(add || participant)).each(function (data) {
                            // check if model
                            var mod = data instanceof self.model ? data : new self.model(data);
                            // wait for fetch, then add to collection
                            mod.loading.then(function () {
                                self.oldAdd(mod, opt);
                            });
                        });
                    }
                });
        }
    });

    return {
        Participant: Model,
        Participants: Collection
    };

});
