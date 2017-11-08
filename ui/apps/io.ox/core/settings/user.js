/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/settings/user', [
    'io.ox/core/extensions',
    'io.ox/core/api/user',
    'io.ox/contacts/model',
    'io.ox/contacts/edit/view-form',
    'io.ox/backbone/views/modal',
    'io.ox/contacts/util',
    'io.ox/core/yell',
    'io.ox/core/a11y',
    'gettext!io.ox/contacts'
], function (ext, api, contactModel, ViewForm, ModalDialog, util, yell, a11y, gt) {

    'use strict';

    // Model Factory for use with the edit dialog
    var factory = contactModel.protectedMethods.buildFactory('io.ox/core/user/model', api);

    function getCurrentUser() {
        return factory.realm('default').get({});
    }

    return {

        getCurrentUser: getCurrentUser,

        openModalDialog: function () {
            var self = this;
            return new ModalDialog({
                width: 910,
                maximize: true,
                async: true,
                title: gt('My contact data'),
                point: 'io.ox/core/settings/user'
            })
            .extend({
                'edit-view': function (baton) {
                    var EditView = ViewForm.protectedMethods.createContactEdit('io.ox/core/user');
                    baton.realm = factory.realm('edit').get({}).then(function (user) {
                        baton.view.editView = new EditView({ model: user });
                    });
                },
                'render': function (baton) {
                    baton.realm = baton.realm.then(function () {
                        var dialog = baton.view,
                            model = dialog.editView.model;
                        // render
                        dialog.$body.append(dialog.editView.render().$el);
                        a11y.getTabbable(dialog.$body).first().focus();
                        dialog.editView.on('sync:start', function () {
                            // if birthday is null on save, set selectors to empty. Otherwise the user might think a partially filled birthday is saved
                            if (model.get('birthday') !== null) return;
                            dialog.$body.find('[data-field="birthday"]').find('.year,.month,.date').val('');
                        });
                    });

                },
                'fail': function (baton) {
                    baton.realm.fail(function () {
                        var dialog = baton.view;
                        dialog.$footer.empty();
                        dialog.addButton({ label: gt('Cancel'), action: 'cancel' });
                        dialog.disableFormElements();
                        return dialog.$body.append(
                            $.fail(gt('Couldn\'t load your contact data.'), function () {
                                dialog.close();
                                self.openModalDialog();
                            })
                        );
                    });
                }
            })
            .addButton({ label: gt('Discard'), action: 'discard', className: 'btn-default' })
            .addButton({ label: gt('Save'), action: 'save' })
            .addCheckbox({ label: gt('Show all fields'), action: 'toggle', status: false })
            .on('toggle', function () {
                this.idle();
                this.editView.toggle.call(this.editView.$el);
            })
            .on('discard', function () { this.close(); })
            .on('save', function () {
                var model = this.editView.model;
                if (!model._valid) return this.idle();
                model.save().fail(yell);
                this.close();
            })
            .open();
        }
    };
});
