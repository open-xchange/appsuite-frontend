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
      ['io.ox/core/tk/model',
       'io.ox/core/api/user',
       'io.ox/core/api/group',
       'io.ox/core/api/resource'], function (Model, userAPI, groupAPI, resourceAPI) {
    'use strict';


    var ParticipantModel = Model.extend({
        TYPE_USER: 1,
        TYPE_USER_GROUP: 2,
        TYPE_RESOURCE: 3,
        TYPE_RESOURCE_GROUP: 4,
        TYPE_EXTERNAL_USER: 5,
        fetch: function (obj) {
            var self = this,
                df = new $.Deferred();


            switch (obj.type) {
            case self.TYPE_USER:
                //fetch user contact
                userAPI.get({id: obj.id}).done(function (user) {
                    self._data = user;
                    df.resolve();
                });
                break;
            case self.TYPE_USER_GROUP:
                //fetch user group
                groupAPI.get({id: obj.id}).done(function (group) {
                    console.log(group);
                    self._data = group;
                    df.resolve();
                });
                break;
            case self.TYPE_RESOURCE:
                resourceAPI.get({id: obj.id}).done(function (resource) {
                    console.log(resource);
                    self._data = resource;
                    df.resolve();
                });
                break;
            case self.TYPE_RESOURCE_GROUP:
                self._data = {display_name: 'resource group'};
                df.resolve();
                break;
            case self.TYPE_EXTERNAL_USER:
                console.log(obj);
                self._data = {display_name: obj.display_name, email1: obj.mail};
                df.resolve();
                break;
            default:
                self._data = {display_name: 'unknown'};
                df.resolve();
                break;
            }

            return df;
        }
    });

    return ParticipantModel;

});
