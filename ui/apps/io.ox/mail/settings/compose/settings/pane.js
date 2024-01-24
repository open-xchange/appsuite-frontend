/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/settings/compose/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/core/api/account',
    'io.ox/core/settings/util',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/colorpicker',
    'io.ox/core/capabilities',
    'io.ox/core/api/user',
    'io.ox/contacts/api',
    'io.ox/mail/util',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (ext, ExtensibleView, api, util, mini, Dropdown, Colorpicker, capabilities, userAPI, contactsAPI, mailUtil, settings, gt) {

    'use strict';

    var INDEX = 0;

    function isConfigurable(id) {
        return settings.isConfigurable(id);
    }

    ext.point('io.ox/mail/settings/compose/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/mail/settings/compose/settings/detail/view', model: settings })
                .inject({
                    getForwardOptions: function () {
                        return [
                            { label: gt('Inline'), value: 'Inline' },
                            { label: gt('Attachment'), value: 'Attachment' }
                        ];
                    },
                    getFormatOptions: function () {
                        return [
                            { label: gt('HTML'), value: 'html' },
                            { label: gt('Plain text'), value: 'text' },
                            { label: gt('HTML and plain text'), value: 'alternative' }
                        ];
                    },
                    getFontNameOptions: function () {
                        return [{ label: gt('Use browser default'), value: 'browser-default' }].concat(
                            mailUtil.getFontFormats().split(';')
                                .filter(function (str) {
                                    return !/^(Web|Wing)dings/.test(str);
                                })
                                .map(function (pair) {
                                    pair = pair.split('=');
                                    return { label: pair[0], value: pair[1] };
                                })
                        );
                    },
                    getFontSizeOptions: function () {
                        return [
                            { label: gt('Use browser default'), value: 'browser-default' },
                            { label: '8pt', value: '8pt' },
                            { label: '10pt', value: '10pt' },
                            { label: '11pt', value: '11pt' },
                            { label: '12pt', value: '12pt' },
                            { label: '13pt', value: '13pt' },
                            { label: '14pt', value: '14pt' },
                            { label: '16pt', value: '16pt' }
                        ];
                    },
                    fetchAccounts: function () {

                        /* TODO: only the default account (id: 0) can have multiple aliases for now
                         * all other accounts can only have one address (the primary address)
                         * So the option is only for the default account, for now. This should
                         * be changed in the future. If more (e.g. external) addresses are shown
                         * here, server _will_ respond with an error, when these are selected.
                         *
                         * THIS COMMENT IS IMPORTANT, DON’T REMOVE
                         */
                        return api.getSenderAddresses(0).then(function (addresses) {
                            return _(addresses).map(function (address) {
                                //use value also as label
                                return { value: address[1], label: address[1] };
                            });
                        });
                    },
                    // overwrite render to resolve async stuff first
                    render: function () {

                        this.fetchAccounts().done(function (options) {
                            this.getSenderOptions = function () { return options; };
                            ExtensibleView.prototype.render.apply(this);
                        }.bind(this));

                        return this;
                    }
                })
                .build(function () {
                    this.listenTo(settings, 'change', function () {
                        settings.saveAndYell();
                    });
                })
                .render().$el
            );
        }
    });

    ext.point('io.ox/mail/settings/compose/settings/detail/view').extend(
        {

            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.header(gt.pgettext('settings', 'Mail Compose'))
                );
            }
        },
        {
            id: 'format',
            index: INDEX += 100,
            render: function () {

                if (!isConfigurable('messageFormat')) return;
                if (_.device('smartphone')) return;

                this.$el.append(
                    util.fieldset(
                        gt('Format emails as'),
                        new mini.CustomRadioView({ list: this.getFormatOptions(), name: 'messageFormat', model: settings }).render().$el
                    )
                );
            }
        },
        {
            id: 'defaultStyle',
            index: INDEX += 100,
            render: function () {

                if (_.device('smartphone')) return;

                var exampleText, defaultStyleSection;

                function update() {
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
                    this.label();
                }

                function getCSS() {

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
                }

                var fontFamilySelect = new Dropdown({ caret: true, model: settings, label: gt('Font'), tagName: 'div', className: 'dropdown fontnameSelectbox', update: update, name: 'defaultFontStyle/family' }),
                    fontSizeSelect = new Dropdown({ caret: true, model: settings, label: gt('Size'), tagName: 'div', className: 'dropdown fontsizeSelectbox', update: update, name: 'defaultFontStyle/size' });

                _(this.getFontNameOptions()).each(function (item, index) {
                    if (index === 1) fontFamilySelect.divider();
                    fontFamilySelect.option('defaultFontStyle/family', item.value, item.label, { radio: true });
                });

                _(this.getFontSizeOptions()).each(function (item, index) {
                    if (index === 1) fontSizeSelect.divider();
                    fontSizeSelect.option('defaultFontStyle/size', item.value, item.label, { radio: true });
                });

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

                this.$el.append(
                    util.fieldset(gt('Default font style'),
                        $('<div>').css('margin', '8px 0').append(
                            fontFamilySelect.render().$el,
                            fontSizeSelect.render().$el,
                            $('<div class="fontcolorButton">').append(
                                new Colorpicker({ name: 'defaultFontStyle/color', model: settings, className: 'dropdown', label: gt('Color'), caret: true }).render().$el
                            )
                        ),
                        exampleText = $('<div class="example-text">')
                            .text(gt('This is how your message text will look like.'))
                            .css(getCSS())
                    )
                );
            }
        },
        {
            id: 'forward',
            index: INDEX += 100,
            render: function () {

                if (!isConfigurable('forwardMessageAs')) return;

                this.$el.append(
                    util.fieldset(
                        gt('Forward emails as'),
                        new mini.CustomRadioView({ list: this.getForwardOptions(), name: 'forwardMessageAs', model: settings }).render().$el
                    )
                );
            }
        },
        {
            id: 'advanced',
            index: INDEX += 100,
            render: function () {
                if (capabilities.has('guest')) return;
                this.$el.append(
                    util.fieldset(gt('Advanced settings'),
                        $('<div class="form-group">').append(
                            // vcard
                            util.checkbox('appendVcard', gt('Append vCard'), settings),
                            // reply
                            util.checkbox('appendMailTextOnReply', gt('Insert the original email text to a reply'), settings),
                            // mailing lists
                            util.checkbox('confirmReplyToMailingLists', gt('Confirm recipients when replying to a mailing list'), settings)
                        ),
                        // Default sender
                        util.compactSelect('defaultSendAddress', gt('Default sender address'), settings, this.getSenderOptions()),
                        // BCC
                        $('<div class="form-group row">').append(
                            $('<div class="col-md-9">').append(
                                $('<label for="autobcc">').text(gt('Always add the following recipient to blind carbon copy (BCC)')),
                                new mini.InputView({ name: 'autobcc', model: settings, className: 'form-control', id: 'autobcc' }).render().$el
                            )
                        )
                    )
                );
            }
        }
    );
});
