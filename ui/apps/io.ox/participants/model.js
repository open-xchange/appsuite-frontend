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

        TYPE_UNKNOWN: 0,
        TYPE_USER: 1,
        TYPE_USER_GROUP: 2,
        TYPE_RESOURCE: 3,
        TYPE_RESOURCE_GROUP: 4,
        TYPE_EXTERNAL_USER: 5,
        TYPE_DISTLIST: 6,

        TYPE_LABEL: 'unknown internal usergroup resource resourcegroup external distlist'.split(' '),

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
            type: 5 // external
        },

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
                }
                this.set('type', newType);
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
                if (this.get('type') === this.TYPE_EXTERNAL_USER) {
                    this.set('id', this.getEmail());
                }
                this.cid = this.TYPE_LABEL[this.get('type')] + '_' + this.get('id');
            }

            this.fetch().done(function () {
                self.trigger('fetch');
            });
        },

        getDisplayName: function () {
            var dn = util.getMailFullName(this.toJSON());
            // 'email only' participant
            return dn || (this.getEmail() !== '' ? this.getEmail().split('@')[0] : '');
        },

        getEmail: function () {
            return util.getMail(this.toJSON());
        },

        getTarget: function () {
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
            } else {
                return 0;
            }
        },

        getImage: function () {
            console.warn('deprecated');
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
                if (this.get('display_name') && 'image1_url' in this.attributes) {
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
                if (this.get('display_name') && this.get('members')) break;
                groupAPI.get({ id: self.get('id') }).done(function (group) {
                    self.set(group);
                    df.resolve();
                });
                break;
            case self.TYPE_RESOURCE:
                if (this.get('display_name')) break;
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
                if (this.get('display_name') && 'image1_url' in this.attributes) {
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
            case self.TYPE_DISTLIST:
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
            this.oldAdd = this.add;
            this.add = this.addUniquely;
        },

        addUniquely: function (models, opt) {
            var self = this,
                tmpDistList = [];

            function addParticipant(participant) {
                if (!(participant instanceof self.model)) {
                    participant = new self.model(participant);
                }

                // check double entries
                if (!self.get(participant.id)) {
                    self.oldAdd(participant, opt);
                }
            }

            models = _([].concat(models))
                .chain()
                .map(function (participant) {
                    // ensure models
                    if (!(participant instanceof self.model)) {
                        participant = new self.model(participant);
                    }
                    return participant;
                })
                .filter(function (participant) {
                    // resolev distribution lists
                    if (participant.get('mark_as_distributionlist')) {
                        tmpDistList = tmpDistList.concat(participant.get('distribution_list'));
                        return false;
                    }
                    return true;
                })
                .each(function (participant) {
                    addParticipant(participant);
                });

            if (tmpDistList.length > 0) {
                _.each(tmpDistList, function (val) {
                    if (val.folder_id === 6) {
                        return contactAPI.get({ id: val.id, folder: 6 }).then(function (data) {
                            addParticipant({ id: data.user_id, type: 1 });
                        });
                    } else {
                        addParticipant(val);
                    }
                });
            }
            // alreadyParticipant = collection.any(function (item) {
            //     if (data.type === 5) {
            //
            //         return item.getEmail() === (data.mail || data.email1) && item.get('type') === data.type;
            //     } else if (data.type === 1) {
            //         return item.get('id') ===  data.internal_userid;
            //     } else {
            //         return (item.id === data.id && item.get('type') === data.type);
            //     }
            // });
        }
    });

    return {
        Participant: Model,
        Participants: Collection
    };

});
