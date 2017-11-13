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
    'io.ox/core/api/user',
    'io.ox/contacts/model',
    'io.ox/core/a11y',
    'gettext!io.ox/contacts'
], function (api, contactModel, a11y, gt) {

    'use strict';

    // Model Factory for use with the edit dialog
    var factory = contactModel.protectedMethods.buildFactory('io.ox/core/user/model', api);

    function getCurrentUser() {
        return factory.realm('default').get({});
    }

    return {

        getCurrentUser: getCurrentUser,

        openModalDialog: function () {
            //var self = this;
            ox.load(['io.ox/contacts/edit/view-form', 'io.ox/backbone/views/window', 'io.ox/core/yell']).done(function (ViewForm, floatingWindow, yell) {
                var EditView = ViewForm.protectedMethods.createContactEdit('io.ox/core/user');
                factory.realm('edit').get({}).then(function (user) {
                    var view = new EditView({ model: user }),
                        win = new floatingWindow({ title: gt('My contact data'), closable: true, footer: true });

                    view.on('sync:start', function () {
                        // if birthday is null on save, set selectors to empty. Otherwise the user might think a partially filled birthday is saved
                        if (view.model.get('birthday') !== null) return;
                        win.$body.find('[data-field="birthday"]').find('.year,.month,.date').val('');
                    });
                    win.open();
                    win.$body.css('overflow', 'auto').append(view.render().$el);
                    win.$footer.append(
                        $('<div class="checkbox pull-left">').css('display', 'inline-block').append($('<label>').append(
                            $('<input type="checkbox">')
                                .on('change', function () {
                                    view.toggle.call(view.$el);
                                }),
                            gt('Show all fields')
                        )),
                        $('<button class="btn btn-default" type="button">').text(gt('Discard'))
                            .on('click', function () { win.close(); }),
                        $('<button class="btn btn-primary" type="button">').text(gt('Save'))
                            .on('click', function () {
                                var model = view.model;
                                if (!model._valid) return;
                                model.save().fail(yell);
                                win.close();
                            })
                    );
                    a11y.getTabbable(win.$body).first().focus();
                });
            });
        }
    };
});
