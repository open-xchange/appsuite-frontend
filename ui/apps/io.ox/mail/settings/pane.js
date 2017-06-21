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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/settings/pane', [
    'settings!io.ox/mail',
    'io.ox/core/api/user',
    'io.ox/core/capabilities',
    'io.ox/contacts/api',
    'io.ox/core/settings/util',
    'io.ox/mail/util',
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'gettext!io.ox/mail',
    'io.ox/core/api/account'
], function (settings, userAPI, capabilities, contactsAPI, util, mailUtil, ext, notifications, gt, api) {

    'use strict';

    var mailViewSettings,
        POINT = 'io.ox/mail/settings/detail',
        optionsAllAccounts;

    // not possible to set nested defaults, so do it here
    if (settings.get('features/registerProtocolHandler') === undefined) {
        settings.set('features/registerProtocolHandler', true);
    }

    var MailSettingsView = Backbone.View.extend({
        tagName: 'div',

        render: function (baton) {
            var self = this, accounts, msisdns;
            /* TODO: only the default account (id: 0) can have multiple aliases for now
             * all other accounts can only have one address (the primary address)
             * So the option is only for the default account, for now. This should
             * be changed in the future. If more (e.g. external) addresses are shown
             * here, server _will_ respond with an error, when these are selected.
             *
             * THIS COMMENT IS IMPORTANT, DON’T REMOVE
             */
            accounts = api.getSenderAddresses(0).then(function (addresses) {
                return _.map(addresses, function (address) {
                    //use value also as label
                    return { value: address[1], label: address[1] };
                });
            });

            //get msisdn numbers
            msisdns = !capabilities.has('msisdn') ? [] : userAPI.get({ id: ox.user_id }).then(function (data) {
                return _(contactsAPI.getMapping('msisdn', 'names'))
                        .chain()
                        .map(function (field) {
                            if (data[field]) {
                                return {
                                    label: data[field],
                                    value: mailUtil.cleanupPhone(data[field]) + mailUtil.getChannelSuffixes().msisdn
                                };
                            }
                        })
                        .compact()
                        .value();
            });

            $.when(accounts, msisdns).then(function (addresses, numbers) {

                optionsAllAccounts = [].concat(addresses, numbers);
                console.log('Sooo', optionsAllAccounts);
                ext.point(POINT + '/pane').invoke('draw', self.$el, baton);

                // hide non-configurable sections
                self.$el.find('[data-property-section]').each(function () {
                    var section = $(this), property = section.attr('data-property-section');
                    if (!settings.isConfigurable(property)) {
                        section.remove();
                    }
                });

            });
            return self;
        }
    });

    ext.point(POINT).extend({
        index: 200,
        id: 'mailsettings',
        draw: function (baton) {
            baton.model = settings;
            this.addClass('io-ox-mail-settings');
            mailViewSettings = new MailSettingsView({ model: settings });

            this.append(mailViewSettings.render(baton).$el);

            if (!capabilities.has('emoji')) {
                // see Bug 25537 - Emotes not working as advertised
                this.find('[name="displayEmoticons"]').parent().parent().hide();
            }
        },

        save: function () {
            mailViewSettings.model.saveAndYell().done(function () {
                //update mailapi
                require(['io.ox/mail/api'], function (mailAPI) {
                    mailAPI.updateViewSettings();
                });
            }).fail(function () {
                notifications.yell('error', gt('Could not save settings'));
            });
        }
    });

    function changeIMAPSubscription() {
        ox.load(['io.ox/core/folder/actions/imap-subscription']).done(function (subscribe) {
            subscribe();
        });
    }

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.append(
                $('<h1>').text(gt.pgettext('app', 'Mail'))
            );
        }
    });

    function isConfigurable(id) {
        return settings.isConfigurable(id);
    }

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: 'display',
        draw: function () {
            this.append(util.fieldset(
                gt('Display'),
                // html
                util.checkbox('allowHtmlMessages', gt('Allow html formatted emails'), settings),
                // images
                util.checkbox('allowHtmlImages', gt('Allow pre-loading of externally linked images'), settings),
                // emojis
                util.checkbox('displayEmoticons', gt('Display emoticons as graphics in text emails'), settings),
                // colored quotes
                util.checkbox('isColorQuoted', gt('Color quoted lines'), settings),
                // fixed width
                util.checkbox('useFixedWidthFont', gt('Use fixed-width font for text mails'), settings),
                // // beautify plain text
                // hidden until bug 52294 gets fixed
                // util.checkbox('beautifyPlainText',
                //     //#. prettify or beautify
                //     //#. technically plain text is parsed and turned into HTML to have nicer lists or blockquotes, for example
                //     gt('Prettify plain text mails'),
                //     settings
                // ),
                // read receipts
                util.checkbox('sendDispositionNotification', gt('Show requests for read receipts'), settings)
            ));
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 300,
        id: 'common',
        draw: function () {

            var contactCollect = !!capabilities.has('collect_email_addresses');

            this.append(
                util.fieldset(
                    gt('Common'),
                    util.checkbox('removeDeletedPermanently', gt('Permanently remove deleted emails'), settings),
                    contactCollect ? util.checkbox('contactCollectOnMailTransport', gt('Automatically collect contacts in the folder "Collected addresses" while sending'), settings) : [],
                    contactCollect ? util.checkbox('contactCollectOnMailAccess', gt('Automatically collect contacts in the folder "Collected addresses" while reading'), settings) : [],
                    // mailto handler registration
                    util.checkbox('features/registerProtocolHandler', gt('Ask for mailto link registration'), settings)
                    .find('label').css('margin-right', '8px').end()
                    .append(
                        // if supported add register now link
                        navigator.registerProtocolHandler ?
                            $('<a href="#" role="button">').text(gt('Register now')).on('click', function (e) {
                                e.preventDefault();
                                var l = location, $l = l.href.indexOf('#'), url = l.href.substr(0, $l);
                                navigator.registerProtocolHandler(
                                    'mailto', url + '#app=' + ox.registry.get('mail-compose') + ':compose&mailto=%s', ox.serverConfig.productNameMail
                                );
                            }) : []
                    ),
                    settings.get('features/unseenFolder', false) && isConfigurable('unseenMessagesFolder') ? util.checkbox('unseenMessagesFolder', gt('Show folder with all unseen messages'), settings) : []
                )
            );
        }
    });

    // extension point with index 500 is in 'io.ox/mail/settings/signatures/register'
    // and displays signature settings

    ext.point(POINT + '/pane').extend({
        index: 600,
        id: 'imap-subscription',
        draw: function () {

            if (_.device('smartphone')) return;

            this.append(
                $('<fieldset>').append(
                    $('<div class="sectioncontent">').append(
                        $('<button type="button" class="btn btn-primary">')
                        .on('click', changeIMAPSubscription)
                        .text(gt('Change IMAP subscriptions'))
                    )
                )
            );
        }
    });
});
