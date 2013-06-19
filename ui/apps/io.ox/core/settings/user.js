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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/settings/user', [
    'io.ox/core/extensions',
    'io.ox/core/api/user',
    'io.ox/contacts/model',
    'io.ox/contacts/edit/view-form',
    'io.ox/core/tk/dialogs',
    'io.ox/contacts/util'
], function (ext, api, contactModel, ViewForm, dialogs, util) {

    'use strict';


    // Model Factory for use with the edit dialog
    var factory = contactModel.protectedMethods.buildFactory('io.ox/core/user/model', api);

    // The edit dialog
    var UserEdit = ViewForm.protectedMethods.createContactEdit('io.ox/core/user');

    return {
        editCurrentUser: function ($node) {
            // Load the user
            return factory.realm('edit').get({}).done(function (user) {
                var $userEditView = new UserEdit({model: user}).render().$el;

                /* remove image edit dialog for PIM users, because they cannot access the place where the image is stored */
                require(['io.ox/core/api/folder'], function (folderAPI) {
                    /* I would have preferred to use folderAPI.can('read', 6)... */
                    folderAPI.get({ folder: 6, cache: false }).fail(function (data) {
                        $userEditView.find('div.header-pic').remove();
                    });
                });

                $node.append($userEditView);

                user.on('change:first_name change:last_name', function () {
                    user.set('display_name', util.getFullName(user.toJSON(), {validate: true}));
                    //app.setTitle(util.getFullName(contact.toJSON()));
                });

                user.on('sync:start', function () {
                    // dont't hide on IE to fix form submit.
                    if (!_.browser.IE || _.browser.IE > 9) {
                        dialogs.busy($node);
                    }
                });

                user.on('sync:always', function () {
                    if (!_.browser.IE || _.browser.IE > 9) {
                        dialogs.idle($node);
                    }
                });
            });
        },
        getCurrentUser: function () {
            return factory.realm('default').get({});
        }
    };

});
