/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/participants/model', [
    'io.ox/core/api/user',
    'io.ox/core/api/group',
    'io.ox/core/api/resource',
    'io.ox/contacts/api',
    'io.ox/contacts/model',
    'io.ox/contacts/util'
], function (userAPI, groupAPI, resourceAPI, contactAPI, ContactModel, util) {

    'use strict';
    // TODO: Bulk Loading

    var TYPE = {
            UNKNOWN: 0,
            USER: 1,
            USER_GROUP: 2,
            RESOURCE: 3,
            RESOURCE_GROUP: 4,
            EXTERNAL_USER: 5,
            DISTLIST: 6
        },
        TYPE_PIDS = {
            0: 'unknown',
            1: 'internal',
            2: 'usergroup',
            3: 'resource',
            4: 'resourcegroup',
            5: 'external',
            6: 'distlist'
        };

    var Model = Backbone.Model.extend({

        idAttribute: 'pid',


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
                var newType = TYPE.UNKNOWN;
                switch (this.get('type')) {
                    case 'user':
                        newType = TYPE.USER;
                        break;
                    case 'group':
                        newType = TYPE.USER_GROUP;
                        break;
                    case 'resource':
                        newType = TYPE.RESOURCE;
                        break;
                    case 'contact':
                        if (this.get('mark_as_distributionlist')) {
                            newType = TYPE.DISTLIST;
                        } else {
                            newType = TYPE.EXTERNAL_USER;
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

        // It's a kind of magic
        magic: function () {
            // convert: special-contact -> user (usually used for distribution list)
            if (this.is('special-contact')) {
                this.set({
                    'type': TYPE.USER,
                    'contact_id': this.get('id'),
                    'id': this.get('internal_userid')
                });
            }
            // convert: special-user -> contact (usually used for autocomplete dropdown)
            if (this.is('special-user')) {
                this.set({
                    'type': TYPE.EXTERNAL_USER,
                    'internal_userid': this.get('id'),
                    'id': this.get('contact_id')
                });
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
            var pid = [TYPE_PIDS[this.get('type')], this.get('id'), this.get('field')].join('_');
            this.set('pid', pid, { silent: true });
        },

        is: function (type) {
            switch (type) {
                // a contact based on a user (f.e. secondary mail address)
                case 'user':
                    return this.get('type') === TYPE.USER;
                // a contact without connection to a user
                case 'contact':
                    return this.get('type') === TYPE.EXTERNAL_USER;
                case 'group':
                    return this.get('type') === TYPE.USER_GROUP;
                case 'resource':
                    return this.get('type') === TYPE.RESOURCE;
                case 'list':
                    return this.get('type') === TYPE.DISTLIST;
                case 'unknown':
                    return this.get('type') === TYPE.UNKNOWN;
                // special: a contact but actually a user with it's email2 or email3
                case 'special-contact':
                    return this.is('contact') && this.get('internal_userid') && this.get('field') === 'email1';
                // special: a user object that referencing it's email2 or email3 field
                case 'special-user':
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

        getDisplayName: function (options) {
            options = options || {};
            var dn = options.isMail ? util.getMailFullName(this.toJSON(), options.asHtml) : util.getFullName(this.toJSON(), options.asHtml);
            // 'email only' participant
            return dn || (this.getEmail() !== '' ? this.getEmail() : '');
        },

        getEmail: function () {
            return util.getMail(this.toJSON());
        },

        getTarget: function (opt) {
            opt = _.extend({ fallback: false, strict: false }, opt);
            if (opt.fallback && this.is('list')) return 'distribution_list';
            // strict option forces the use of the specified field. Prevents missleading information (user thinks theres a mail address, when there's actually non in the specific field)
            // mail_field = 0 means independent contact, which lacks specific mailfields and need the fallback in any case. So we need an exact check here
            return opt.strict && !(this.get('mail_field') === 0 && this.get('mail')) ? this.get(this.get('field')) : this.get(this.get('field')) || this.getEmail();
        },

        getFieldString: function () {
            return this.has('field') ? ContactModel.fields[this.get('field')] : '';
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
                        data = _(data).omit('first_name', 'last_name', 'display_name', 'company');
                    }
                    // fix wrong mail field (see bug 47874)
                    if (model.has('mail') && model.get('mail') !== data[model.get('field')]) {
                        _.each(['email1', 'email2', 'email3'], function (key) {
                            if (data[key] === model.get('mail')) data.field = key;
                        });
                    }
                    model.set(data);
                };

            switch (this.get('type')) {
                case TYPE.USER:
                    if (this.get('display_name') && 'image1_url' in this.attributes) break;
                    return userAPI.get({ id: this.get('id') }).then(update);
                case TYPE.USER_GROUP:
                    if (this.get('display_name') && this.get('members')) break;
                    return groupAPI.get({ id: this.get('id') }).then(update);
                case TYPE.RESOURCE:
                    if (this.get('display_name')) break;
                    return resourceAPI.get({ id: this.get('id') }).then(update);
                case TYPE.RESOURCE_GROUP:
                    this.set('display_name', 'resource group');
                    break;
                case TYPE.EXTERNAL_USER:
                    if (this.get('display_name') && 'image1_url' in this.attributes) break;
                    if (this.get('id') && this.get('folder_id')) {
                        return contactAPI.get(this.pick('id', 'folder_id')).then(update);
                    }
                    return contactAPI.getByEmailaddress(this.getEmail()).then(partialUpdate);
                case TYPE.DISTLIST:
                    if (this.get('display_name') && 'distribution_list' in this.attributes) break;
                    return contactAPI.get(this.pick('id', 'folder_id')).then(update);
                // no default
            }

            return $.when();
        }
    });

    function resolveGroupMembers(participant) {
        return $.Deferred().resolve()
            .then(function () {
                // fetch members in not available yet
                var members = participant instanceof Backbone.Model ? participant.get('members') : participant.members;
                return members ? { members: members } : groupAPI.get({ id: participant.id || participant.get('id') });
            })
            .then(function (data) {
                return userAPI.getList(data.members);
            })
            .then(function (users) {
                return _.sortBy(users, 'last_name');
            });
    }

    function getValue(obj, name) {
        obj = obj || {};
        return obj.get ? obj.get(name) : obj[name];
    }

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
            this.processing = [];
        },

        resolve: function () {
            return $.when.apply($, this.processing);
        },

        addUniquely: function (list, opt) {
            var self = this, defs;

            defs = _.map([].concat(list), function (participant) {
                // resolve user groups (recursion)
                if (self.options.splitGroups && getValue(participant, 'type') === 2) {
                    return resolveGroupMembers(participant).then(self.addUniquely.bind(self));
                }

                // resolve distribution lists
                var isDistributionList = getValue(participant, 'mark_as_distributionlist');
                participant = isDistributionList ? getValue(participant, 'distribution_list') : participant;

                var models = [], defs = [], omittedContacts = [];
                _.each([].concat(participant), function (data) {
                    // check if model
                    var mod = data instanceof self.model ? data : new self.model(data);
                    if (self.options.needsMail) {
                        // yep mail_field = 0 is possible
                        if (mod.get('mail_field') !== undefined && !mod.get('mail')) {
                            omittedContacts.push(mod);
                            return;
                        }
                    }
                    models.push(mod);
                    // wait for fetch, then add to collection
                    defs.push(mod.loading);
                });
                util.validateDistributionList(omittedContacts);

                return $.when.apply($, defs).then(function () {
                    models = _(models).sortBy(function (obj) { return obj.get('last_name'); });
                    _(models).each(function (model) {
                        self.oldAdd(model, opt);
                    });
                    return models;
                });
            });
            this.processing = this.processing.concat(_.flatten(defs));
        }
    });

    return {
        Participant: Model,
        Participants: Collection
    };

});
