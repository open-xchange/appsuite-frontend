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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/edit/model-participant',
      ['io.ox/core/api/user',
       'io.ox/core/api/group',
       'io.ox/core/api/resource'], function (userAPI, groupAPI, resourceAPI) {

    'use strict';

    var ParticipantModel = Backbone.Model.extend({
        TYPE_USER: 1,
        TYPE_USER_GROUP: 2,
        TYPE_RESOURCE: 3,
        TYPE_RESOURCE_GROUP: 4,
        TYPE_EXTERNAL_USER: 5,

        defaults: {
            display_name: '...',
            email1: '',
            image1_url: ''
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
                self.set({display_name: self.get('display_name'), email1: self.get('mail')});
                self.trigger('change', self);
                df.resolve();
                break;
            default:
                self.set({display_name: 'unknown'});
                self.trigger('change', self);
                df.resolve();
                break;
            }

            return df;
        }
    });

    return ParticipantModel;

});
