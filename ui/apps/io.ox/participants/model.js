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
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define("io.ox/participants/model",
        ['io.ox/core/api/user',
         'io.ox/core/api/group',
         'io.ox/core/api/resource',
         'io.ox/contacts/api',
         'io.ox/contacts/util'], function (userAPI, groupAPI, resourceAPI, contactAPI, util) {

    "use strict";
    // TODO: Bulk Loading

    var ParticipantModel = Backbone.Model.extend({
        TYPE_USER: 1,
        TYPE_USER_GROUP: 2,
        TYPE_RESOURCE: 3,
        TYPE_RESOURCE_GROUP: 4,
        TYPE_EXTERNAL_USER: 5,
        TYPE_DISTLIST_USER_GROUP: 6,

        defaults: {
            display_name: '...',
            email1: '',
            image1_url: ''
        },
        initialize: function () {
            var self = this;
            if (self.get('internal_userid')) {
                self.id = self.get('internal_userid');
                self.set({
                    id: self.get('internal_userid'),
                    type: this.TYPE_USER
                });
            }
            if (self.get('entity')) {
                self.id = parseInt(self.get('entity'), 10);
                self.set({
                    id: parseInt(self.get('entity'), 10),
                    type: this.TYPE_USER
                });
            }
            this.fetch().done(function () {
                self.trigger("fetch");
                self.trigger("change");
            });
            if (this.get('type') === this.TYPE_EXTERNAL_USER) {
                this.id = this.get('mail');
                this.set('id', this.get('mail'));
            }
        },
        fetch: function (options) {
            var self = this,
                df = new $.Deferred();
            switch (self.get('type')) {
            case self.TYPE_USER:
                //fetch user contact
                userAPI.get({id: self.get('id')}).done(function (user) {
                    self.set(user);
                    self.trigger('change', self);
                    df.resolve();
                }).fail(function () {
                    if (!self.get('display_name')) {
                        self.set('display_name', self.get('mail'));
                    }
                    df.resolve();
                });
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
                contactAPI.getByEmailadress(self.get('mail')).done(function (results) {
                    if (results && results.length > 0) {
                        var itemWithImage = _(results).find(function (item) {
                            return item.image1_url && item.image1_url !== '';
                        });
                        itemWithImage = itemWithImage || results[0]; // take with image or just the first one
                        self.set({
                            display_name: itemWithImage.display_name,
                            email1: self.get('mail') || self.get('email1'),
                            image1_url: itemWithImage.image1_url,
                            type: itemWithImage.internal_userid ? self.TYPE_USER : self.TYPE_EXTERNAL_USER,
                            id: itemWithImage.internal_userid ? itemWithImage.internal_userid : self.get('id')
                        });
                        self.id = self.get('id');
                        self.trigger("change");
                    } else {
                        self.set({display_name: self.get('display_name').replace(/(^["'\\\s]+|["'\\\s]+$)/g, ''), email1: self.get('mail') || self.get('email1')});
                    }
                    self.trigger('change', self);
                    df.resolve();
                });
                break;
            case self.TYPE_DISTLIST_USER_GROUP:
                //fetch user group
                groupAPI.get({id: self.get('id')}).done(function (group) {
                    self.set(group);
                    self.trigger('change', self);
                    df.resolve();
                });
                break;
            default:
                self.set({display_name: 'unknown'});
                self.trigger('change', self);
                df.resolve();
                break;
            }

            return df;
        },

        getDisplayName: function () {
            return util.getDisplayName(this.toJSON());
        },
        getEmail: function () {
            return util.getMail(this.toJSON());
        },
        getImage: function () {
            return util.getImage(this.toJSON());
        },
        markAsUnremovable: function () {
            this.set('ui_removable', false);
        }

    });

    var ParticipantsCollection = Backbone.Collection.extend({
        initialize: function () {
            var self = this;
            self.on("change", function () {
                // Deduplication
                var idMap = {};
                var duplicates = [];
                self.each(function (p, index) {
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
        addUniquely: function (models, options) {
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