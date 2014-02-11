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

define('io.ox/mail/settings/pane',
    ['settings!io.ox/mail',
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
    ], function (settings, userAPI, capabilities, contactsAPI, mailUtil, mailSettingsModel, ext, notifications, gt, api, mini) {

    'use strict';

    var mailSettings =  settings.createModel(mailSettingsModel),

        mailViewSettings,
        POINT = 'io.ox/mail/settings/detail',
        optionsAllAccounts,
        caps,

        optionsThreadview = [
            { label: gt('Enabled for inbox only'), value: 'inbox' },
            { label: gt('Enabled for all mail folders'), value: 'on' },
            { label: gt('Disabled'), value: 'off' }
        ],

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
            { label: gt('10 minutes'), value: '10_minutes'}
        ];

    var MailSettingsView = Backbone.View.extend({
        tagName: 'div',

        render: function () {
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
                    return {value: address[1], label: address[1]};
                });
            });

            //get msisdn numbers
            msisdns = !capabilities.has('msisdn') ? [] : userAPI.get({id: ox.user_id}).then(function (data) {
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

            new $.when(accounts, msisdns).then(function (addresses, numbers) {
                optionsAllAccounts = [].concat(addresses, numbers);
                caps = {
                    contactCollect: capabilities.has('collect_email_addresses') ? 'true' : 'false'
                };

                ext.point(POINT + '/pane').invoke('draw', self.$el);

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
        draw: function () {

            mailViewSettings = new MailSettingsView({model: mailSettings});

            var holder = $('<div>').css('max-width', '800px'),
                pane = $('<div class="io-ox-mail-settings">');

            this.append(holder.append(pane.append(mailViewSettings.render().$el)));

            if (Modernizr.touch) { // See Bug 24802
                holder.find('input[name="messageFormat"]:first').closest('.control-group').hide().prev().hide();
            }

            if (!capabilities.has('emoji')) { // see Bug 25537
                holder.find('[name="displayEmoticons"]').parent().hide();
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
        ox.load(['io.ox/core/folder/imap-subscription']).done(function (subscription) {
            subscription.show();
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
            var arrayOfElements =  [],
                contactCollectOnMailTransport = $('<label>').addClass('checkbox expertmode').text(gt('Automatically collect contacts in the folder "Collected addresses" while sending')).append(
                    new mini.CheckboxView({ name: 'contactCollectOnMailTransport', model: mailSettings}).render().$el
                ),
                contactCollectOnMailAccess = $('<label>').addClass('checkbox expertmode').text(gt('Automatically collect contacts in the folder "Collected addresses" while reading')).append(
                    new mini.CheckboxView({ name: 'contactCollectOnMailAccess', model: mailSettings}).render().$el
                );

            if (caps.contactCollect) {
                arrayOfElements.push(contactCollectOnMailTransport, contactCollectOnMailAccess);
            }

            this.append(
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle expertmode').text(gt('Common')),
                    $('<div>').addClass('control-group').append(
                        $('<label>').addClass('checkbox expertmode').text(gt('Permanently remove deleted emails')).append(
                            new mini.CheckboxView({ name: 'removeDeletedPermanently', model: mailSettings}).render().$el
                        ),
                        arrayOfElements,
                        $('<label>').addClass('checkbox expertmode').text(gt('Use fixed-width font for text mails')).append(
                            new mini.CheckboxView({ name: 'useFixedWidthFont', model: mailSettings}).render().$el
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
                $('<div>').addClass('settings sectiondelimiter expertmode'),
                $('<div>').addClass('form-horizontal').append(
                    $('<fieldset>').append(
                        $('<legend>').addClass('control-label').text(gt('Compose')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('checkbox').text(gt('Append vCard')).append(
                                new mini.CheckboxView({ name: 'appendVcard', model: mailSettings}).render().$el
                            ),
                            $('<label>').addClass('checkbox').text(gt('Insert the original email text to a reply')).append(
                                new mini.CheckboxView({ name: 'appendMailTextOnReply', model: mailSettings}).render().$el
                            )
                        )
                    ),
                    $('<div>').attr({ 'data-property-section': 'threadView'}).append(
                        $('<div>').addClass('settings sectiondelimiter'),
                        $('<fieldset>').append(
                            $('<legend>').addClass('control-label').text(gt('Thread view')),
                            new mini.RadioView({ list: optionsThreadview, name: 'threadView', model: mailSettings}).render().$el
                        )
                    ),
                    $('<div>').addClass('settings sectiondelimiter expertmode'),
                    $('<fieldset>').append(
                        $('<legend>').addClass('control-label').text(gt('Forward emails as')),
                        new mini.RadioView({ list: optionsForwardEmailAs, name: 'forwardMessageAs', model: mailSettings}).render().$el
                    ),
                    $('<div>').addClass('settings sectiondelimiter'),
                    $('<fieldset>').append(
                        $('<legend>').addClass('control-label').text(gt('Format emails as')),
                        new mini.RadioView({ list: optionsFormatAs, name: 'messageFormat', model: mailSettings}).render().$el
                    ),
                    $('<div>').addClass('settings sectiondelimiter'),
                    $('<fieldset>').append(
                        $('<legend>').text((gt('Line wrap when sending text mails after '))).addClass('justForA11y').hide(),
                        $('<div>').addClass('control-group form-inline expertmode').append(
                            $('<span>').addClass('text').text(gt('Line wrap when sending text mails after ')),
                            $('<label for="lineWrapAfter">').addClass('justForA11y'),
                            new mini.InputView({ name: 'lineWrapAfter', model: mailSettings, className: 'span1' }).render().$el,
                            $('<span>').addClass('text').text(gt(' characters'))
                        )
                    ),
                    $('<fieldset>').append(
                        $('<div>').addClass('control-group').append(
                            $('<label>').attr({ 'for': 'defaultSendAddress' }).addClass('control-label').text(gt('Default sender address')),
                            $('<div>').addClass('controls').append(
                                new mini.SelectView({ list: optionsAllAccounts, name: 'defaultSendAddress', model: mailSettings}).render().$el
                            )
                        )
                    ),
                    $('<fieldset>').append(
                        $('<div>').addClass('control-group expertmode').append(
                            $('<label>').attr({ 'for': 'autoSaveDraftsAfter' }).addClass('control-label').text(gt('Auto-save email drafts')),
                            $('<div>').addClass('controls').append(
                                $('<label>').addClass('select').append(
                                    new mini.SelectView({ list: optionsAutoSave, name: 'autoSaveDraftsAfter', model: mailSettings}).render().$el
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
                    $('<legend>').addClass('sectiontitle expertmode').text(gt('Display')),
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').addClass('checkbox').text(gt('Allow html formatted emails')).append(
                            new mini.CheckboxView({ name: 'allowHtmlMessages', model: mailSettings}).render().$el
                        ),
                        $('<label>').addClass('checkbox').text(gt('Allow pre-loading of externally linked images')).append(
                            new mini.CheckboxView({ name: 'allowHtmlImages', model: mailSettings}).render().$el
                        ),
                        $('<label>').addClass('checkbox').text(gt('Display emoticons as graphics in text emails')).append(
                            new mini.CheckboxView({ name: 'displayEmoticons', model: mailSettings}).render().$el
                        ),
                        $('<label>').addClass('checkbox').text(gt('Color quoted lines')).append(
                            new mini.CheckboxView({ name: 'isColorQuoted', model: mailSettings}).render().$el
                        ),
                        $('<label>').addClass('checkbox').text(gt('Ask for delivery receipt')).append(
                            new mini.CheckboxView({ name: 'sendDispositionNotification', model: mailSettings}).render().$el
                        )
                    )
                )
            );
        }
    });

    ext.point('io.ox/mail/settings/detail').extend({
        index: 500,
        id: 'imap-subscription',
        draw: function () {
            var button = $('<button type="button" class="btn btn-primary">').on('click', changeIMAPSubscription);

            if (_.device('smartphone')) return;

            this.append(
                $('<div class="settings sectiondelimiter expertmode">'),
                $('<legend class="sectiontitle">').text(gt('IMAP folder subscription')),
                $('<div class="sectioncontent">').append(
                    button.text(gt('Change subscription'))
                )
            );
        }
    });

});
