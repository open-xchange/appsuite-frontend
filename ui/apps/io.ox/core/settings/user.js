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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/settings/user',
    ['io.ox/core/extensions',
     'io.ox/core/api/user',
     'io.ox/contacts/model',
     'io.ox/contacts/edit/view-form',
     'io.ox/core/tk/dialogs',
     'io.ox/contacts/util',
     'gettext!io.ox/contacts'
    ], function (ext, api, contactModel, ViewForm, dialogs, util, gt) {

    'use strict';

    // Model Factory for use with the edit dialog
    var factory = contactModel.protectedMethods.buildFactory('io.ox/core/user/model', api);

    return {

        editCurrentUser: function ($node) {
            //$node.busy();
            return factory.realm('edit').get({})
                    .done(function (user) {
                        // The edit dialog
                        var UserEdit = ViewForm.protectedMethods.createContactEdit('io.ox/core/user'),
                            $userEditView = new UserEdit({ model: user }).render().$el;

                        $userEditView.find('[data-id="private_flag"]').remove();

                        $node.append($userEditView);

                        user.on('change:first_name change:last_name', function () {
                            user.set('display_name', util.getFullName(user.toJSON(), {validate: true}));
                            //app.setTitle(util.getFullName(contact.toJSON()));
                        });

                        user.on('sync:start', function () {
                            //if birthday is null on save, set selectors to empty. Otherwise the user might think a partially filled birthday is saved
                            if (user.get('birthday') === null) {
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
        },

        openModalDialog: function () {

            var dialog = new dialogs.ModalDialog({
                top: 20,
                substract: 100,
                width: 910,
                center: false,
                maximize: true,
                async: true
            })
            .addPrimaryButton('save', gt('Save'), 'save', { tabIndex: '1' })
            .addButton('discard', gt('Discard'), 'discard', { tabIndex: '1' });

            var $node = dialog.getContentNode();
            var usermodel;
            var self = this;

            this.editCurrentUser($node).then(
                function success(model) {
                    usermodel = model;
                },
                function fail() {
                    $node.append(
                        $.fail(gt('Couldn\'t load your contact data.'), function () {
                            self.editCurrentUser($node).done(function () {
                                $node.find('[data-action="discard"]').hide();
                            });
                        })
                    );
                }
            );

            dialog.show();

            dialog.on('save', function () {
                if (usermodel._valid) {
                    usermodel.save();
                    dialog.close();
                } else {
                    dialog.idle();
                }
            }).on('discard', function () {
                dialog.close();
            });
        }
    };
});
