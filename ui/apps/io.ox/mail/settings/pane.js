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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/settings/pane', [
    'settings!io.ox/mail',
    'io.ox/core/api/user',
    'io.ox/core/capabilities',
    'io.ox/contacts/api',
    'io.ox/mail/util',
    'io.ox/mail/settings/model',
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'gettext!io.ox/mail',
    'io.ox/core/api/account',
    'io.ox/backbone/mini-views'
], function (settings, userAPI, capabilities, contactsAPI, mailUtil, mailSettings, ext, notifications, gt, api, mini) {

    'use strict';

    var mailViewSettings,
        POINT = 'io.ox/mail/settings/detail',
        optionsAllAccounts,

        optionsForwardEmailAs = [
            { label: gt('Inline'), value: 'Inline' },
            { label: gt('Attachment'), value: 'Attachment' }
        ],

        optionsFormatAs = [
            { label: gt('HTML'), value: 'html' },
            { label: gt('Plain text'), value: 'text' },
            { label: gt('HTML and plain text'), value: 'alternative' }
        ],

        optionsAutoSave = [
            { label: gt('disabled'), value: 'disabled' },
            { label: gt('1 minute'), value: '1_minute' },
            { label: gt('3 minutes'), value: '3_minutes' },
            { label: gt('5 minutes'), value: '5_minutes' },
            { label: gt('10 minutes'), value: '10_minutes' }
        ];

    // not possible to set nested defaults, so do it here
    if (mailSettings.get('features/registerProtocolHandler') === undefined) {
        mailSettings.set('features/registerProtocolHandler', true);
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
            baton.model = mailSettings;
            this.addClass('io-ox-mail-settings');
            mailViewSettings = new MailSettingsView({ model: mailSettings });

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

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: 'common',
        draw: function () {

            var contactCollect = !!capabilities.has('collect_email_addresses');

            this.append(
                $('<fieldset>').append(
                    $('<legend class="sectiontitle expertmode">').append(
                        $('<h2>').text(gt('Common'))
                    ),
                    $('<div class="form-group">').append(
                        // Permanently remove
                        $('<div class="checkbox expertmode">').append(
                            $('<label>').text(gt('Permanently remove deleted emails')).prepend(
                                new mini.CheckboxView({ name: 'removeDeletedPermanently', model: mailSettings }).render().$el
                            )
                        ),
                        // Collect while sending
                        contactCollect ?
                            $('<div class="checkbox expertmode">').append(
                                $('<label>').text(gt('Automatically collect contacts in the folder "Collected addresses" while sending')).prepend(
                                    new mini.CheckboxView({ name: 'contactCollectOnMailTransport', model: mailSettings }).render().$el
                                )
                            ) : [],
                        // collect while reading
                        contactCollect ?
                            $('<div class="checkbox expertmode">').append(
                                $('<label>').text(gt('Automatically collect contacts in the folder "Collected addresses" while reading')).prepend(
                                    new mini.CheckboxView({ name: 'contactCollectOnMailAccess', model: mailSettings }).render().$el
                                )
                            ) : [],
                        // fixed width
                        $('<div class="checkbox expertmode">').append(
                            $('<label>').text(gt('Use fixed-width font for text mails')).prepend(
                                new mini.CheckboxView({ name: 'useFixedWidthFont', model: mailSettings }).render().$el
                            )
                        ),
                        // mailto handler registration
                        $('<div class="checkbox expertmode">').append(
                            $('<label>').text(gt('Ask for mailto link registration')).prepend(
                                new mini.CheckboxView({ name: 'features/registerProtocolHandler', model: mailSettings }).render().$el
                            ),
                            // if supported add register now link
                            navigator.registerProtocolHandler ?
                            $('<a href="#" >').text(gt('Register now')).css('margin-left', '8px').on('click', function (e) {
                                e.preventDefault();
                                var l = location, $l = l.href.indexOf('#'), url = l.href.substr(0, $l);
                                navigator.registerProtocolHandler(
                                    'mailto', url + '#app=' + ox.registry.get('mail-compose') + ':compose&mailto=%s', ox.serverConfig.productNameMail
                                );
                            }) : []
                        )
                    )
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 300,
        id: 'compose',
        draw: function () {
            this.append(
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle').append(
                        $('<h2>').text(gt('Compose'))
                    ),
                    $('<div>').addClass('controls').append(
                        $('<div>').addClass('checkbox').append(
                            $('<label>').text(gt('Append vCard')).prepend(
                                new mini.CheckboxView({ name: 'appendVcard', model: mailSettings }).render().$el
                            )
                        ),
                        $('<div>').addClass('checkbox').append(
                            $('<label>').text(gt('Insert the original email text to a reply')).prepend(
                                new mini.CheckboxView({ name: 'appendMailTextOnReply', model: mailSettings }).render().$el
                            )
                        ),
                        $('<div class="checkbox">').append(
                            //#. this setting is about what happens when the user presses <enter>
                            //#. in mail compose: either simple line breaks (<br> tags) or paragraphs (<p> tags)
                            $('<label>').text(gt('Insert line breaks instead paragraphs when pressing <enter>')).prepend(
                                new mini.CheckboxView({ name: 'simpleLineBreaks', model: mailSettings }).render().$el
                            )
                        )
                    )
                ),
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle').append(
                        $('<h2>').text(gt('Forward emails as'))
                    ),
                    new mini.RadioView({ list: optionsForwardEmailAs, name: 'forwardMessageAs', model: mailSettings }).render().$el
                ),

                (function () {
                    if (_.device('smartphone')) return $();
                    return $('<fieldset>').append(
                        $('<legend>').addClass('sectiontitle').append(
                            $('<h2>').text(gt('Format emails as'))
                        ),
                        new mini.RadioView({ list: optionsFormatAs, name: 'messageFormat', model: mailSettings }).render().$el
                    );
                })(),

                $('<div>').addClass('settings sectiondelimiter'),
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle sr-only').append(
                        $('<h2>').text(gt('Additional settings'))
                    ),
                    $('<div>').addClass('form-group expertmode').append(

                        $('<label for="lineWrapAfter">').addClass('control-label').text(
                            //#. It's a label for an input field with a number
                            //#. This only applies for plain text messages, so please keep this information in translations
                            gt('Automatically wrap plain text after character:')
                        ),
                        $('<div>').addClass('controls').append(
                            $('<div>').addClass('row').append(
                                $('<div>').addClass('col-md-2').append(
                                    new mini.InputView({ name: 'lineWrapAfter', model: mailSettings, className: 'form-control', id: 'lineWrapAfter' }).render().$el
                                ),
                                $('<div>').addClass('col-md-10').append(
                                    new mini.ErrorView({ selector: '.form-group.expertmode' }).render().$el
                                )
                            )
                        )
                    ),
                    $('<div>').addClass('form-group').append(
                        $('<label>').attr({ 'for': 'defaultSendAddress' }).text(gt('Default sender address')),
                        $('<div>').addClass('controls').append(
                            $('<div>').addClass('row').append(
                                $('<div>').addClass('col-lg-6 col-xs-12').append(
                                    new mini.SelectView({ list: optionsAllAccounts, name: 'defaultSendAddress', model: mailSettings, id: 'defaultSendAddress', className: 'form-control' }).render().$el
                                )
                            )
                        )
                    ),
                    $('<div>').addClass('form-group expertmode').append(
                        $('<label>').attr({ 'for': 'autoSaveDraftsAfter' }).addClass('control-label').text(gt('Auto-save email drafts')),
                        $('<div>').addClass('controls').append(
                            $('<div>').addClass('row').append(
                                $('<div>').addClass('col-lg-6 col-xs-12').append(
                                    new mini.SelectView({ list: optionsAutoSave, name: 'autoSaveDraftsAfter', model: mailSettings, id: 'autoSaveDraftsAfter', className: 'form-control' }).render().$el
                                )
                            )
                        )
                    )
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 400,
        id: 'display',
        draw: function () {
            this.append(
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle expertmode').append(
                        $('<h2>').text(gt('Display'))
                    ),
                    $('<div>').addClass('form-group expertmode').append(
                        $('<div>').addClass('checkbox').append(
                            $('<label>').text(gt('Allow html formatted emails')).prepend(
                                new mini.CheckboxView({ name: 'allowHtmlMessages', model: mailSettings }).render().$el
                            )
                        ),
                        $('<div>').addClass('checkbox').append(
                            $('<label>').text(gt('Allow pre-loading of externally linked images')).prepend(
                                new mini.CheckboxView({ name: 'allowHtmlImages', model: mailSettings }).render().$el
                            )
                        ),
                        $('<div>').addClass('checkbox').append(
                            $('<label>').text(gt('Display emoticons as graphics in text emails')).prepend(
                                new mini.CheckboxView({ name: 'displayEmoticons', model: mailSettings }).render().$el
                            )
                        ),
                        $('<div>').addClass('checkbox').append(
                            $('<label>').text(gt('Color quoted lines')).prepend(
                                new mini.CheckboxView({ name: 'isColorQuoted', model: mailSettings }).render().$el
                            )
                        ),
                        $('<div>').addClass('checkbox').append(
                            $('<label>').text(gt('Show requests for read receipts')).prepend(
                                new mini.CheckboxView({ name: 'sendDispositionNotification', model: mailSettings }).render().$el
                            )
                        )
                    )
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
                        $('<button type="button" class="btn btn-primary" tabindex="1">')
                        .on('click', changeIMAPSubscription)
                        .text(gt('Change IMAP subscriptions'))
                    )
                )
            );
        }
    });

});
