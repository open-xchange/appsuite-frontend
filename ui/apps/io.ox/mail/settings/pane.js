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
     'io.ox/core/api/account'
    ], function (settings, userAPI, capabilities, contactsAPI, mailUtil, mailSettingsModel, ext, notifications, gt, api) {

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
        ],

        buildCheckbox = function (name) {
            var checkbox = $('<input>').attr({  'data-property': name, 'type': 'checkbox' })
            .on('change', function () {
                mailSettings.set(name, checkbox.prop('checked'));
            }).addClass('input-xlarge');
            checkbox.prop('checked', mailSettings.get(name));
            return checkbox;

        },

        buildInputRadio = function (list, name) {
            return _.map(list, function (option) {
                var o = $('<input type="radio" name="' + name + '">').val(option.value)
                .on('click', function () {
                    mailSettings.set(name, this.value);
                });
                if (mailSettings.get(name) === option.value) o.prop('checked', true);
                return $('<label class="radio">').text(option.label).append(o);
            });
        },

        buildInputText = function (name) {
            var input = $('<input type="text">')
            .on('change', function () {
                mailSettings.set(name, input.val());
            }).addClass('span1');
            input.val(mailSettings.get(name));
            return input;
        },

        buildOptionsSelect = function (list, name, id) {
            var select = $('<select>').attr({ id: id }).addClass('input-xlarge').on('change', function () {
                mailSettings.set(name, this.value);
            });
            _.map(list, function (option) {
                var o = $('<option>').attr({ value: option.value}).text(option.label);
                return select.append(o);
            });
            select.val(mailSettings.get(name));
            return select;
        };

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
                holder.find('[data-property="displayEmoticons"]').parent().hide();
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
                    buildCheckbox('contactCollectOnMailTransport')
                ),
                contactCollectOnMailAccess = $('<label>').addClass('checkbox expertmode').text(gt('Automatically collect contacts in the folder "Collected addresses" while reading')).append(
                    buildCheckbox('contactCollectOnMailAccess')
                );

            if (caps.contactCollect) {
                arrayOfElements.push(contactCollectOnMailTransport, contactCollectOnMailAccess);
            }

            this.append(
                $('<legend>').addClass('sectiontitle expertmode').text(gt('Common')),
                $('<div>').addClass('control-group').append(
                    $('<div>').addClass('controls').append(
                        $('<label>').addClass('checkbox expertmode').text(gt('Permanently remove deleted emails')).append(
                            buildCheckbox('removeDeletedPermanently')
                        ),
                        arrayOfElements,
                        $('<label>').addClass('checkbox expertmode').text(gt('Use fixed-width font for text mails')).append(
                            buildCheckbox('useFixedWidthFont')
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
                    $('<div>').addClass('control-group').append(
                        $('<label>').addClass('control-label').text(gt('Compose')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('checkbox').text(gt('Append vCard')).append(
                                buildCheckbox('appendVcard')
                            ),
                            $('<label>').addClass('checkbox').text(gt('Insert the original email text to a reply')).append(
                                buildCheckbox('appendMailTextOnReply')
                            )
                        )
                    ),
                    $('<div>').attr({ 'data-property-section': 'threadView'}).append(
                        $('<div>').addClass('settings sectiondelimiter'),
                        $('<div>').addClass('control-group').append(
                            $('<label>').addClass('control-label').text(gt('Thread view')),
                            $('<div>').addClass('controls').append(
                                buildInputRadio(optionsThreadview, 'threadView')
                            )
                        )
                    ),
                    $('<div>').addClass('settings sectiondelimiter expertmode'),
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').addClass('control-label').text(gt('Forward emails as')),
                        $('<div>').addClass('controls').append(
                            buildInputRadio(optionsForwardEmailAs, 'forwardMessageAs')
                        )
                    ),
                    $('<div>').addClass('settings sectiondelimiter'),
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').addClass('control-label').text(gt('Format emails as')),
                        $('<div>').addClass('controls').append(
                            buildInputRadio(optionsFormatAs, 'messageFormat')
                        )
                    ),
                    $('<div>').addClass('settings sectiondelimiter'),
                    $('<div>').addClass('control-group form-inline expertmode').append(
                        $('<div>').addClass('controls').append(
                            $('<span>').addClass('text').text(gt('Line wrap when sending text mails after ')),
                            buildInputText('lineWrapAfter'),
                            $('<span>').addClass('text').text(gt(' characters'))
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({ 'for': 'defaultSendAddress' }).addClass('control-label').text(gt('Default sender address')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('select').append(
                                buildOptionsSelect(optionsAllAccounts, 'defaultSendAddress', 'defaultSendAddress')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').attr({ 'for': 'autoSaveDraftsAfter' }).addClass('control-label').text(gt('Auto-save email drafts')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('select').append(
                                buildOptionsSelect(optionsAutoSave, 'autoSaveDraftsAfter', 'autoSaveDraftsAfter')
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
                $('<legend>').addClass('sectiontitle expertmode').text(gt('Display')),
                $('<div>').addClass('control-group expertmode').append(
                    $('<div>').addClass('controls').append(
                        $('<label>').addClass('checkbox').text(gt('Allow html formatted emails')).append(
                            buildCheckbox('allowHtmlMessages')
                        )
                    ),
                    $('<div>').addClass('controls').append(
                        $('<label>').addClass('checkbox').text(gt('Allow pre-loading of externally linked images')).append(
                            buildCheckbox('allowHtmlImages')
                        )
                    ),
                    $('<div>').addClass('controls').append(
                        $('<label>').addClass('checkbox').text(gt('Display emoticons as graphics in text emails')).append(
                            buildCheckbox('displayEmoticons')
                        )
                    ),
                    $('<div>').addClass('controls').append(
                        $('<label>').addClass('checkbox').text(gt('Color quoted lines')).append(
                            buildCheckbox('isColorQuoted')
                        )
                    ),
                    $('<div>').addClass('controls').append(
                        $('<label>').addClass('checkbox').text(gt('Ask for delivery receipt')).append(
                            buildCheckbox('sendDispositionNotification')
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
