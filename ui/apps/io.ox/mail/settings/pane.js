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
    'io.ox/mail/util',
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'gettext!io.ox/mail',
    'io.ox/core/api/account',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/colorpicker'
], function (settings, userAPI, capabilities, contactsAPI, mailUtil, ext, notifications, gt, api, mini, Dropdown, Colorpicker) {

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
        ],

        optionsFontName = [
            { label: gt('Use browser default'), value: 'browser-default' },
            { label: 'Andale Mono', value: '"andale mono", monospace' },
            { label: 'Arial ', value: 'arial, helvetica, sans-serif' },
            { label: 'Arial Black', value: '"arial black", sans-serif' },
            { label: 'Book Antiqua', value: '"book antiqua", palatino, serif' },
            { label: 'Comic Sans MS', value: '"comic sans ms", sans-serif' },
            { label: 'Courier New', value: '"courier new", courier, monospace' },
            { label: 'Georgia', value: 'georgia, palatino, serif' },
            { label: 'Helvetica', value: 'helvetica, arial, sans-serif' },
            { label: 'Impact', value: 'impact, sans-serif' },
            { label: 'Symbol', value: 'symbol' },
            { label: 'Tahoma', value: 'tahoma, arial, helvetica, sans-serif' },
            { label: 'Terminal', value: 'terminal, monaco, monospace' },
            { label: 'Times New Roman', value: '"times new roman", times, serif' },
            { label: 'Trebuchet MS', value: '"trebuchet ms", geneva, sans-serif' },
            { label: 'Verdana', value: 'verdana, geneva, sans-serif' }
        ],

        optionsFontsize = [
            { label: gt('Use browser default'), value: 'browser-default' },
            { label: '8pt', value: '8pt' },
            { label: '10pt', value: '10pt' },
            { label: '11pt', value: '11pt' },
            { label: '12pt', value: '12pt' },
            { label: '13pt', value: '13pt' },
            { label: '14pt', value: '14pt' },
            { label: '16pt', value: '16pt' }
        ];

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

    function fieldset(text) {
        var args = _(arguments).toArray();
        return $('<fieldset>').append($('<legend class="sectiontitle">').append($('<h2>').text(text))).append(args.slice(1));
    }

    function checkbox(id, label) {
        var args = _(arguments).toArray();
        if (!isConfigurable(id)) return $();
        return $('<div class="checkbox">').append(
            $('<label class="control-label">').text(label).prepend(args.slice(2))
        );
    }

    function isConfigurable(id) {
        return settings.isConfigurable(id);
    }

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: 'display',
        draw: function () {
            this.append(fieldset(
                gt('Display'),
                // html
                checkbox(
                    'allowHtmlMessages',
                    gt('Allow html formatted emails'),
                    new mini.CheckboxView({ name: 'allowHtmlMessages', model: settings }).render().$el
                ),
                // images
                checkbox(
                    'allowHtmlImages',
                    gt('Allow pre-loading of externally linked images'),
                    new mini.CheckboxView({ name: 'allowHtmlImages', model: settings }).render().$el
                ),
                // emojis
                checkbox(
                    'displayEmoticons',
                    gt('Display emoticons as graphics in text emails'),
                    new mini.CheckboxView({ name: 'displayEmoticons', model: settings }).render().$el
                ),
                // colored quotes
                checkbox(
                    'isColorQuoted',
                    gt('Color quoted lines'),
                    new mini.CheckboxView({ name: 'isColorQuoted', model: settings }).render().$el
                ),
                // fixed width
                checkbox(
                    'useFixedWidthFont',
                    gt('Use fixed-width font for text mails'),
                    new mini.CheckboxView({ name: 'useFixedWidthFont', model: settings }).render().$el
                ),
                // beautify plain text
                checkbox(
                    'beautifyPlainText',
                    //#. prettify or beautify
                    //#. technically plain text is parsed and turned into HTML to have nicer lists or blockquotes, for example
                    gt('Prettify plain text mails'),
                    new mini.CheckboxView({ name: 'beautifyPlainText', model: settings }).render().$el
                ),
                // read receipts
                checkbox(
                    'sendDispositionNotification',
                    gt('Show requests for read receipts'),
                    new mini.CheckboxView({ name: 'sendDispositionNotification', model: settings }).render().$el
                )
            ));
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 300,
        id: 'common',
        draw: function () {

            var contactCollect = !!capabilities.has('collect_email_addresses');

            this.append(
                fieldset(
                    gt('Common'),
                    checkbox(
                        'removeDeletedPermanently',
                        gt('Permanently remove deleted emails'),
                        new mini.CheckboxView({ name: 'removeDeletedPermanently', model: settings }).render().$el
                    ),
                    contactCollect ? checkbox(
                        'contactCollectOnMailTransport',
                        gt('Automatically collect contacts in the folder "Collected addresses" while sending'),
                        new mini.CheckboxView({ name: 'contactCollectOnMailTransport', model: settings }).render().$el
                    ) : [],
                    contactCollect ? checkbox(
                        'contactCollectOnMailAccess',
                        gt('Automatically collect contacts in the folder "Collected addresses" while reading'),
                        new mini.CheckboxView({ name: 'contactCollectOnMailAccess', model: settings }).render().$el
                    ) : [],
                    // mailto handler registration
                    checkbox(
                        'features/registerProtocolHandler',
                        gt('Ask for mailto link registration'),
                        new mini.CheckboxView({ name: 'features/registerProtocolHandler', model: settings }).render().$el
                    )
                    .append(
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
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 400,
        id: 'compose',
        draw: function () {
            var update = function () {
                    var $ul = this.$ul,
                        li = $ul.find('[data-name="' + this.options.name + '"]'),
                        self = this;
                    // clear check marks
                    li.children('i').attr('class', 'fa fa-fw fa-none');
                    // loop over list items also allow compare non-primitive values
                    li.each(function () {
                        var node = $(this);
                        node.filter('[role=menuitemcheckbox][aria-checked]').attr({ 'aria-checked': _.isEqual(node.data('value'), self.model.get(self.options.name)) });
                        if (_.isEqual(node.data('value'), self.model.get(self.options.name))) node.children('i').attr('class', 'fa fa-fw fa-check');
                    });
                    // update drop-down toggle
                    self.label();
                },
                fontFamilySelect,
                fontSizeSelect,
                exampleText,
                defaultStyleSection,
                getCSS = function () {
                    var css = {
                        'font-size': settings.get('defaultFontStyle/size', 'browser-default'),
                        'font-family': settings.get('defaultFontStyle/family', 'browser-default'),
                        'color': settings.get('defaultFontStyle/color', 'transparent')
                    };

                    // using '' as a value removes the attribute and thus any previous styling
                    if (css['font-size'] === 'browser-default') css['font-size'] = '';
                    if (css['font-family'] === 'browser-default') css['font-family'] = '';
                    if (css.color === 'transparent') css.color = '';

                    return css;
                };

            if (!_.device('smartphone')) {
                fontFamilySelect = new Dropdown({ caret: true, model: settings, label: gt('Font'), tagName: 'div', className: 'dropdown fontnameSelectbox', update: update, name: 'defaultFontStyle/family' });
                fontSizeSelect = new Dropdown({ caret: true, model: settings, label: gt('Size'), tagName: 'div', className: 'dropdown fontsizeSelectbox', update: update, name: 'defaultFontStyle/size' });

                _(optionsFontName).each(function (item, index) {
                    if (index === 1) fontFamilySelect.divider();
                    fontFamilySelect.option('defaultFontStyle/family', item.value, item.label, { radio: true });
                });
                _(optionsFontsize).each(function (item, index) {
                    if (index === 1) fontSizeSelect.divider();
                    fontSizeSelect.option('defaultFontStyle/size', item.value, item.label, { radio: true });
                });
            }


            this.append(
                fieldset(gt('Compose'),
                    checkbox(
                        'appendVcard',
                        gt('Append vCard'),
                        new mini.CheckboxView({ name: 'appendVcard', model: settings }).render().$el
                    ),
                    checkbox(
                        'appendMailTextOnReply',
                        gt('Insert the original email text to a reply'),
                        new mini.CheckboxView({ name: 'appendMailTextOnReply', model: settings }).render().$el
                    ),
                    checkbox(
                        'confirmReplyToMailingLists',
                        gt('Confirm recipients when replying to a mailing list'),
                        new mini.CheckboxView({ name: 'confirmReplyToMailingLists', model: settings }).render().$el
                    )
                    // $('<div class="checkbox">').append(
                    //     //#. this setting is about what happens when the user presses <enter>
                    //     //#. in mail compose: either simple line breaks (<br> tags) or paragraphs (<p> tags)
                    //     $('<label>').text(gt('Insert line breaks instead paragraphs when pressing <enter>')).prepend(
                    //         new mini.CheckboxView({ name: 'simpleLineBreaks', model: settings }).render().$el
                    //     )
                    // )
                ),
                isConfigurable('forwardMessageAs') ? fieldset(gt('Forward emails as'),
                    new mini.RadioView({ list: optionsForwardEmailAs, name: 'forwardMessageAs', model: settings }).render().$el
                ) : [],

                isConfigurable('messageFormat') && _.device('!smartphone') ? fieldset(
                    gt('Format emails as'),
                    new mini.RadioView({ list: optionsFormatAs, name: 'messageFormat', model: settings }).render().$el
                ) : [],

                (_.device('smartphone') ? '' : defaultStyleSection = [
                    $('<div>').addClass('settings sectiondelimiter'),
                    $('<fieldset>').append(
                        $('<legend>').addClass('sectiontitle').append(
                            $('<h2>').text(gt('Default font style'))
                        ),
                        $('<dev class="col-xs-12 col-md-12">').append(
                            $('<div class="row">').append(
                                fontFamilySelect.render().$el,
                                fontSizeSelect.render().$el,
                                $('<div class="fontcolorButton">').append(
                                    new Colorpicker({ name: 'defaultFontStyle/color', model: settings, className: 'dropdown', label: gt('Color'), caret: true }).render().$el
                                )
                            ),
                            $('<div class="row">').append(exampleText = $('<div class="example-text">').text(gt('This is how your message text will look like.')).css(getCSS()))
                        )
                    )]
                ),

                $('<div>').addClass('settings sectiondelimiter'),
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle sr-only').append(
                        $('<h2>').text(gt('Additional settings'))
                    ),
                    $('<dev class="col-xs-12 col-md-6">').append(
                        $('<div class="row">').append(
                            $('<label>').attr({ 'for': 'defaultSendAddress' }).text(gt('Default sender address')),
                            new mini.SelectView({ list: optionsAllAccounts, name: 'defaultSendAddress', model: settings, id: 'defaultSendAddress', className: 'form-control' }).render().$el
                        ),
                        $('<div class="row">').append(
                            $('<label>').attr({ 'for': 'autoSaveDraftsAfter' }).addClass('control-label').text(gt('Auto-save email drafts')),
                            new mini.SelectView({ list: optionsAutoSave, name: 'autoSaveDraftsAfter', model: settings, id: 'autoSaveDraftsAfter', className: 'form-control' }).render().$el
                        ),
                        $('<div class="row">').append(
                            $('<label for="autobcc">').text(gt('Always add the following recipient to blind carbon copy (BCC)')),
                            new mini.InputView({ name: 'autobcc', model: settings, className: 'form-control', id: 'autobcc' }).render().$el
                        )
                    )
                )
            );

            if (!_.device('smartphone')) {
                settings.on('change:defaultFontStyle/size change:defaultFontStyle/family change:defaultFontStyle/color', function () {
                    exampleText.css(getCSS());

                    settings.save();
                });

                _(fontFamilySelect.$ul.find('a')).each(function (item, index) {
                    // index 0 is browser default
                    if (index === 0) return;
                    $(item).css('font-family', $(item).data('value'));
                });

                _(defaultStyleSection).each(function (obj) {
                    obj.toggle(settings.get('messageFormat') !== 'text');
                });

                settings.on('change:messageFormat', function (value) {
                    _(defaultStyleSection).each(function (obj) {
                        obj.toggle(value !== 'text');
                    });
                });
            }
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
