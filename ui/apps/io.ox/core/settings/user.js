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

define('io.ox/core/settings/user',
    ['io.ox/core/extensions',
     'io.ox/core/api/user',
     'io.ox/contacts/model',
     'io.ox/contacts/edit/view-form',
     'io.ox/core/tk/dialogs',
     'io.ox/contacts/util'
    ], function (ext, api, contactModel, ViewForm, dialogs, util) {

    'use strict';

    // Model Factory for use with the edit dialog
    var factory = contactModel.protectedMethods.buildFactory('io.ox/core/user/model', api);

    return {
        editCurrentUser: function ($node) {
            //$node.busy();
            return factory.realm('edit').get({})
                    .done(function (user) {
                        //$node.idle();
                        // The edit dialog
                        var UserEdit = ViewForm.protectedMethods.createContactEdit('io.ox/core/user'),
                            $userEditView = new UserEdit({model: user}).render().$el;

                        $userEditView.find('[data-id="private_flag"]').remove();

                        $node.append($userEditView);

                        user.on('change:first_name change:last_name', function () {
                            user.set('display_name', util.getFullName(user.toJSON(), {validate: true}));
                            //app.setTitle(util.getFullName(contact.toJSON()));
                        });

                        user.on('sync:start', function () {
                            if (user.get('birthday') === null) {//if birthday is null on save, set selectors to empty. Otherwise the user might think a partially filled birthday is saved
                                $node.find('[data-field="birthday"]').find('.year,.month,.date').val('');
                            }
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
