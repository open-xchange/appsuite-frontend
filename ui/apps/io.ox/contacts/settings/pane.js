/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/contacts/settings/pane',
    ['settings!io.ox/contacts',
     'io.ox/contacts/settings/model',
     'io.ox/core/extensions',
     'gettext!io.ox/contacts',
     'io.ox/backbone/mini-views',
     'io.ox/core/notifications',
    ], function (settings, contactsSettingsModel, ext, gt, mini, notifications) {

    'use strict';

    var POINT = 'io.ox/contacts/settings/detail', pane,
        contactsModel =  settings.createModel(contactsSettingsModel),
        reloadMe = [];


    contactsModel.on('change', function (e, path) {
        contactsModel.saveAndYell().then(
            function success() {
                var showNotice = _(reloadMe).any(function (attr) {
                    return attr === path;
                });
                if (showNotice) {
                    notifications.yell(
                        'success',
                        gt('The setting has been saved and will become active when you enter the application the next time.')
                    );
                }
            }
        );
    });

    ext.point(POINT).extend({
        index: 100,
        id: 'contactssettings',
        draw: function () {
            var holder = $('<div>').css('max-width', '800px');
            pane = $('<div class="io-ox-contacts-settings">');
            this.append(holder.append(pane));
            ext.point(POINT + '/pane').invoke('draw', pane);
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.append(
                $('<h1>').text(gt('Address Book'))
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: 'displaynames',
        draw: function () {
            var preferences = [
                { label: gt('Language-specific default'), value: 'auto' },
                { label: gt('First name Last name'), value: 'firstname lastname'},
                { label: gt('Last name, First name'), value: 'lastname, firstname'}

            ];
            this.append(
                $('<fieldset>').append(
                    $('<legend>').text(gt('Display of names')),
                    new mini.RadioView({ list: preferences, name: 'fullNameFormat', model: contactsModel}).render().$el
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 300,
        id: 'myaccount',
        draw: function () {
            var usermodel,
                button = $('<button type="button" class="btn btn-primary" data-action="add">')
                    .text(gt('My contact data'));

            button.on('click', function () {
                require(['io.ox/core/tk/dialogs', 'io.ox/core/settings/user'], function (dialogs, users) {
                    var dialog = new dialogs.ModalDialog({
                            top: 60,
                            width: 900,
                            center: false,
                            maximize: true
                        })
                        .addPrimaryButton('save', gt('Save'), 'save', {'tabIndex': '1'})
                        .addButton('discard', gt('Discard'), 'discard', {'tabIndex': '1'});

                    var $node = dialog.getContentNode();

                    if (_.device('smartphone')) {
                        // workaround: will be fixed with upcoming bootstrap 4
                        dialog.getPopup().width('100%');
                        $node
                            .css('padding', 10)
                            .addClass('max-height-350');
                    }

                    users.editCurrentUser($node).done(function (model) {
                        usermodel = model;
                    }).fail(function () {
                        $node.append(
                            $.fail(gt('Couldn\'t load your contact data.'), function () {
                                users.editCurrentUser($node).done(function () {
                                    $node.find('[data-action="discard"]').hide();
                                });
                            })
                        );
                    });
                    dialog.show().done(function (action) {
                        if (action === 'save') {
                            usermodel.save();
                        }
                    });
                });
            });

            this.append(
                $('<div class="settings sectiondelimiter">'),
                $('<div class="section">').append(
                    $('<div id="controls">').append(
                        $('<div class="btn-group pull-left">').append(button)
                    )
                )
            );
        }
    });
});
