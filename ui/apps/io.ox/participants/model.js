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
            this.fetch();
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
                contactAPI.search(self.get('mail')).done(function (results) {
                    if (results && results.length > 0) {
                        var itemWithImage = _(results).find(function (item) {
                            return item.image1_url && item.image1_url !== '';
                        });
                        itemWithImage = itemWithImage || results[0]; // take with image or just the first one
                        self.set({
                            display_name: itemWithImage.display_name,
                            email1: self.get('mail') || self.get('email1'),
                            image1_url: itemWithImage.image1_url
                        });
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
        }
    });

    var ParticipantsCollection = Backbone.Collection.extend({
        model: ParticipantModel
    });

    return {
        Participant: ParticipantModel,
        Participants: ParticipantsCollection
    };

});