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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/settings/accounts/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'io.ox/keychain/api',
    'io.ox/keychain/model',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views',
    'io.ox/settings/accounts/views',
    'settings!io.ox/core',
    'gettext!io.ox/settings/accounts',
    'io.ox/backbone/mini-views/settings-list-view',
    'withPluginsFor!keychainSettings'
], function (ext, dialogs, api, keychainModel, Dropdown, mini, AccountViews, coreSettings, gt, ListView) {

    'use strict';

    // make sure changes get saved
    coreSettings.on('change:security/acceptUntrustedCertificates', function () {
        this.save();
    });

    var drawCertificateValidation = function () {
            return $('<div class="form-group">').append(
                $('<div class="checkbox">').append(
                    $('<label class="control-label">').text(gt('Allow connections with untrusted certificates')).prepend(
                        new mini.CheckboxView({ name: 'security/acceptUntrustedCertificates', model: coreSettings }).render().$el
                    )
                )
            );
        },

        drawRecoveryButtonHeadline = function () {
            return $('<h2 class="sr-only">').text(gt('Password recovery'));
        },

        drawRecoveryButton = function () {
            var b = $('<a href="#" class="hint col-md-6 col-lg-12">')
                .text(gt('Info about account recovery...'))
                .attr({
                    role: 'button',
                    title: gt('Show infos about account recovery'),
                    'aria-label': gt('Show infos about account recovery')
                }).on('click', function (e) {
                    e.preventDefault();
                    hint.show();
                    $(this).hide();
                });

            var hint = $('<div class="hint col-md-8 col-lg-12">').append(
                $.txt(
                    gt('For security reasons, all credentials are encrypted with your primary account password. ' +
                        'If you change your primary password, your external accounts might stop working. In this case, ' +
                        'you can use your old password to recover all account passwords.')
                ),
                $('<a href="#" class="hint recover" data-action="recover">').text(gt('Recover passwords')).attr({
                    role: 'button',
                    title: gt('Recover passwords'),
                    'aria-label': gt('Recover passwords')
                })
                .on('click', function (e) {
                    e.preventDefault();
                    ox.load(['io.ox/keychain/secretRecoveryDialog']).done(function (srd) {
                        srd.show();
                    });
                }));

            hint.hide();
            return [b, hint];
        },

        drawPane = function () {
            return $('<div class="io-ox-accounts-settings">').append(
                $('<div>').addClass('row').append(
                    $('<h1 class="col-md-8 col-xs-8">').text(gt('Accounts'))
                ),
                $('<ul class="list-unstyled list-group widget-list">')
            );
        },

        hasOAuthCredentials = function hasOAuthCredentials(account) {
            return account.has('mail_oauth') && account.get('mail_oauth') >= 0;
        };

    /**
     * Extension point for account settings detail view
     *
     * This extension point provides a list to manage accounts of the keyring.
     *
     * As an extension to basic extension points, accounts can implement a canAdd
     * attribute of type {bool|function} to specify if the user is able to add new
     * accounts of this type. If false, the user is able to view the account in the
     * list and edit it, but it will be filtered from the dropdown menu of the add
     * button.
     *
     */

    ext.point('io.ox/settings/accounts/settings/detail').extend({
        index: 300,
        id: 'accountssettings',
        draw: function (data) {
            var that = this;

            function redraw() {

                var allAccounts = api.getAll(),
                    collection = keychainModel.wrap(allAccounts);

                var $pane = drawPane(),
                    accountsList = new ListView({
                        tagName: 'ul',
                        childView: AccountViews.ListItem,
                        collection: collection,
                        filter: function (m) { return !hasOAuthCredentials(m); }
                    });

                $pane.append(accountsList.render().$el);

                if (coreSettings.isConfigurable('security/acceptUntrustedCertificates')) {
                    $pane.append(drawCertificateValidation());
                }

                if (collection.length > 1) {
                    $pane.append(drawRecoveryButtonHeadline(), drawRecoveryButton());
                }

                that.empty().append($pane);
            }

            redraw();

            function onChange(id, list) {
                if (!list || list.length === 0 || (id !== 'virtual/io.ox/settings/accounts' && id !== 'virtual/settings/io.ox/settings/accounts')) {
                    api.off('refresh.all refresh.list', redraw);
                    data.tree.off('virtual', onChange);
                }
            }
            api.on('refresh.all refresh.list', redraw);
            data.tree.on('virtual', onChange);
        },
        save: function () {
            // TODO
            //console.log('now accounts get saved?');
        }
    });

    return {};

});
