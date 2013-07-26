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
    'io.ox/contacts/util',
    'io.ox/core/api/folder',
    'gettext!io.ox/core'
], function (ext, api, contactModel, ViewForm, dialogs, util, folderAPI, gt) {

    'use strict';


    // Model Factory for use with the edit dialog
    var factory = contactModel.protectedMethods.buildFactory('io.ox/core/user/model', api);

    //check grants for global address book
    var options = {
            access: {}
        },
        hasAccess = function () {
            var cont = function () {
                return this.state() === 'resolved';
            };
            return 'gab' in options.access ? $.Deferred().resolve(options.access.gab) : folderAPI.get({ folder: 6, cache: false, suppressYell: true })
                   .then(cont, cont);
        };

    return {
        editCurrentUser: function ($node) {
            $node.busy();
            return hasAccess()
                    .then(function (resp) {
                        options.access.gab = resp;
                        // Load the user
                        return factory.realm('edit').get({});
                    })
                    .always(function (user) {
                        $node.idle();
                        // The edit dialog
                        var UserEdit = ViewForm.protectedMethods.createContactEdit('io.ox/core/user', options),
                            $userEditView = new UserEdit({model: user}).render().$el;

                        $userEditView.find('[data-id="private_flag"]').remove();

                        $node.append($userEditView);
                        $($node.find('.edit-contact')[0]).on('dispose', function () {
                            $(document.activeElement).blur();//make the active element lose focus to get the changes of the field a user was editing
                            if (!_.isEmpty(user.changed)) {//check if there is something to save
                                new dialogs.ModalDialog()
                                .text(gt('Do you really want to discard your changes?'))
                                .addPrimaryButton('save', gt('Save changes'))
                                .addButton('discard', gt('Discard changes'))
                                .show()
                                .done(function (action) {
                                    if  (action === 'save') {
                                        user.save();
                                    }
                                });
                            }
                        });

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
