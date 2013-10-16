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
     'dot!io.ox/mail/settings/form.html',
     'io.ox/core/extensions',
     'io.ox/core/notifications',
     'gettext!io.ox/mail',
     'io.ox/core/api/account'
    ], function (settings, userAPI, capabilities, contactsAPI, mailUtil, mailSettingsModel, tmpl, ext, notifications, gt, api) {

    'use strict';

    var mailSettings =  settings.createModel(mailSettingsModel),

        staticStrings =  {
            TITLE_MAIL: gt.pgettext('app', 'Mail'),
            TITLE_COMMON: gt('Common'),
            PERMANENT_REMOVE_MAILS: gt('Permanently remove deleted emails'),
            COLLECT_CONTACTS_SENDING: gt('Automatically collect contacts in the folder "Collected addresses" while sending'),
            COLLECT_CONTACTS_READING: gt('Automatically collect contacts in the folder "Collected addresses" while reading'),
            USE_FIXED_WIDTH_FONT: gt('Use fixed-width font for text mails'),
            TITLE_COMPOSE: gt('Compose'),
            APPEND_VCARD: gt('Append vCard'),
            INSERT_ORG_TO_REPLY: gt('Insert the original email text to a reply'),
            FORWARD_EMAIL_AS: gt('Forward emails as'),
            INLINE: gt('Inline'),
            ATTACHEMENT: gt('Attachment'),
            FORMAT_AS: gt('Format emails as'),
            HTML: gt('HTML'),
            PLAIN: gt('Plain text'),
            HTML_AND_PLAIN: gt('HTML and plain text'),
            LINEWRAP: gt('Line wrap when sending text mails after '),
            CHARACTERS: gt(' characters'),
            DEFAULT_SENDER: gt('Default sender address'),
            AUTO_SAVE: gt('Auto-save email drafts'),
            TITLE_DISPLAY: gt('Display'),
            ALLOW_HTML: gt('Allow html formatted emails'),
            ALLOW_PRE: gt('Allow pre-loading of externally linked images'),
            DISPLAY_EMOTICONS: gt('Display emoticons as graphics in text emails'),
            COLOR_QUOTED: gt('Color quoted lines'),

            TITLE_THREADVIEW: gt('Thread view'),
            THREADVIEW_INBOX: gt('Enabled for inbox only'),
            THREADVIEW_ON: gt('Enabled for all mail folders'),
            THREADVIEW_OFF: gt('Disabled')
        },

        optionsAutoSave = [{label: gt('disabled'), value: 'disabled'},
                           {label: gt('1 minute'), value: '1_minute'},
                           {label: gt('3 minutes'), value: '3_minutes'},
                           {label: gt('5 minutes'), value: '5_minutes'},
                           {label: gt('10 minutes'), value: '10_minutes'}],
        mailViewSettings;

    var MailSettingsView = Backbone.View.extend({
        tagName: 'div',
        _modelBinder: undefined,
        initialize: function () {
            // create template
            this._modelBinder = new Backbone.ModelBinder();
        },
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
                self.$el.empty().append(
                    tmpl.render('io.ox/mail/settings', {
                        strings: staticStrings,
                        optionsAutoSaveMinutes: optionsAutoSave,
                        optionsAllAccounts: [].concat(addresses, numbers),
                        caps:  {
                            contactCollect: capabilities.has('collect_email_addresses') ? 'true' : 'false'
                        }
                    })
                );

                // hide non-configurable sections
                self.$el.find('[data-property-section]').each(function () {
                    var section = $(this), property = section.attr('data-property-section');
                    if (!settings.isConfigurable(property)) {
                        section.remove();
                    }
                });

                var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                self._modelBinder.bind(self.model, self.el, defaultBindings);
            });
            return self;
        }
    });

    ext.point('io.ox/mail/settings/detail').extend({
        index: 200,
        id: 'mailsettings',
        draw: function () {

            mailViewSettings = new MailSettingsView({model: mailSettings});

            var holder = $('<div>').css('max-width', '800px');
            this.append(holder.append(
                mailViewSettings.render().el)
            );
            if (Modernizr.touch) { // See Bug 24802
                holder.find('input[name="messageFormat"]:first').closest('.control-group').hide().prev().hide();
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

    ext.point('io.ox/mail/settings/detail').extend({
        index: 400,
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
