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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/settings/accounts/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/core/api/account',
    'io.ox/keychain/api',
    'io.ox/keychain/model',
    'io.ox/core/settings/util',
    'io.ox/settings/accounts/views',
    'io.ox/backbone/mini-views/settings-list-view',
    'settings!io.ox/core',
    'gettext!io.ox/settings/accounts',
    'withPluginsFor!keychainSettings'
], function (ext, ExtensibleView, accountAPI, api, keychainModel, util, AccountViews, ListView, settings, gt) {

    'use strict';

    ext.point('io.ox/settings/accounts/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/settings/accounts/settings/detail/view', model: settings })
                .inject({
                    hasNoOAuthCredentials: function (account) {
                        return !(account.has('mail_oauth') && account.get('mail_oauth') >= 0);
                    },
                    openRecoveryDialog: function (e) {
                        e.preventDefault();
                        ox.load(['io.ox/keychain/secretRecoveryDialog']).done(function (dialog) {
                            dialog.show();
                        });
                    },
                    updateStatuses: function () {
                        var collection = this.collection;
                        return accountAPI.getStatus().done(function (status) {
                            for (var id in status) {
                                // to avoid double ids the collection has the account type as prefix see Bug 50219
                                var model = collection.get('mail' + id),
                                    s = status[id];
                                if (!model) return;
                                model.set('status', s.status !== 'ok' ? s : s.status);
                            }
                        });
                    }
                })
                .build(function () {
                    // make sure changes get saved
                    this.listenTo(settings, 'change:security/acceptUntrustedCertificates', function () {
                        settings.save();
                    });
                })
                .render().$el
            );
        }
    });

    var INDEX = 0;

    ext.point('io.ox/settings/accounts/settings/detail/view').extend(
        //
        // Header
        //
        {
            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.addClass('io-ox-accounts-settings').append(
                    util.header(gt('Accounts'))
                );
            }
        },
        //
        // List view
        //
        {
            id: 'list',
            index: INDEX += 100,
            render: function () {

                this.collection = keychainModel.wrap(api.getAll());

                this.$el.append(
                    new ListView({
                        tagName: 'ul',
                        childView: AccountViews.ListItem,
                        collection: this.collection,
                        filter: this.hasNoOAuthCredentials
                    })
                    .render().$el
                );

                this.updateStatuses();
                this.listenTo(api, 'refresh.all refresh.list', this.updateStatuses);
            }
        },
        //
        // Untrusted Certificates
        //
        {
            id: 'untrusted-certificates',
            index: INDEX += 100,
            render: function () {

                if (!settings.isConfigurable('security/acceptUntrustedCertificates')) return;

                this.$el.append(
                    $('<div class="form-group">').append(
                        util.checkbox('security/acceptUntrustedCertificates', gt('Allow connections with untrusted certificates'), settings)
                    )
                );
            }
        },
        //
        // Password Recovery
        //
        {
            id: 'recovery',
            index: INDEX += 100,
            render: function () {

                if (this.collection.length <= 1) return;

                this.$el.append(
                    $('<h2 class="sr-only">').text(gt('Password recovery')),
                    $('<a href="#" role="button" class="hint">')
                        //#. Shown in settings page for accounts. Should use the indefinite form, it's a general information
                        //#. about account recovery, where account can be plural. In German "Informationen zur Accounwiederherstellung"
                        .text(gt('Show information about account recovery'))
                        .on('click', function (e) {
                            e.preventDefault();
                            $(this).hide().next().show();
                        }),
                    $('<div class="hint">').hide().append(
                        $('<p>').text(
                            gt('For security reasons, all credentials are encrypted with your primary account password. ' +
                                'If you change your primary password, your external accounts might stop working. In this case, ' +
                                'you can use your old password to recover all account passwords.')
                        ),
                        $('<button type="button" class="btn btn-primary" data-action="recover">')
                            .text(gt('Recover passwords'))
                            .on('click', this.openRecoveryDialog)
                    )
                );
            }
        }
    );
});
