/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/settings/compose/settings/pane', [
    'io.ox/core/extensions',
    'gettext!io.ox/mail',
    'settings!io.ox/mail',
    'io.ox/core/settings/util',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/colorpicker'
], function (ext, gt, settings, util, mini, Dropdown, Colorpicker) {

    'use strict';

    var INDEX = 0,

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

    function isConfigurable(id) {
        return settings.isConfigurable(id);
    }

    ext.point('io.ox/mail/settings/compose/settings/detail').extend(
        {
            index: INDEX += 100,
            id: 'header',
            draw: function () {
                this.append(
                    $('<h1>').text(gt.pgettext('settings', 'Mail Compose'))
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'format',
            draw: function () {

                if (!isConfigurable('messageFormat')) return;
                if (_.device('smartphone')) return;

                this.append(
                    util.fieldset(
                        gt('Format emails as'),
                        new mini.CustomRadioView({ list: optionsFormatAs, name: 'messageFormat', model: settings }).render().$el
                    )
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'defaultStyle',
            draw: function () {

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

                _(optionsFontName).each(function (item, index) {
                    if (index === 1) fontFamilySelect.divider();
                    fontFamilySelect.option('defaultFontStyle/family', item.value, item.label, { radio: true });
                });

                _(optionsFontsize).each(function (item, index) {
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

                this.append(
                    util.fieldset(gt('Default font style'),
                        $('<div>').css('margin', '8px 0').append(
                            fontFamilySelect.render().$el,
                            fontSizeSelect.render().$el,
                            $('<div class="fontcolorButton">').append(
                                new Colorpicker({ name: 'defaultFontStyle/color', model: settings, className: 'dropdown', label: gt('Color'), caret: true }).render().$el
                            )
                        ),
                        exampleText = $('<div class="example-text">')
                            .text(gt('This is how your message text will look.'))
                            .css(getCSS())
                    )
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'forward',
            draw: function () {

                if (!isConfigurable('forwardMessageAs')) return;

                this.append(
                    util.fieldset(
                        gt('Forward emails as'),
                        new mini.CustomRadioView({ list: optionsForwardEmailAs, name: 'forwardMessageAs', model: settings }).render().$el
                    )
                );
            }
        },
        {
            index: INDEX += 100,
            id: 'advanced',
            draw: function () {
                this.append(
                    util.fieldset(gt('Advanced settings'),
                        $('<div class="form-group">').append(
                            // vcard
                            util.checkbox('appendVcard', gt('Append vCard'), settings),
                            // reply
                            util.checkbox('appendMailTextOnReply', gt('Insert the original email text to a reply'), settings),
                            // mailing lists
                            util.checkbox('confirmReplyToMailingLists', gt('Confirm recipients when replying to a mailing list'), settings)
                        ),
                        // $('<div class="row form-group">').append(
                        //     $('<label for="defaultSendAddress">').text(gt('Default sender address')),
                        //     new mini.SelectView({ list: optionsAllAccounts, name: 'defaultSendAddress', model: settings, id: 'defaultSendAddress', className: 'form-control' }).render().$el
                        // ),
                        $('<div class="row form-group">').append(
                            $('<div class="col-md-9">').append(
                                $('<label for="autoSaveDraftsAfter">').text(gt('Auto-save email drafts')),
                                new mini.SelectView({ list: optionsAutoSave, name: 'autoSaveDraftsAfter', model: settings, id: 'autoSaveDraftsAfter', className: 'form-control' }).render().$el
                            )
                        ),
                        $('<div class="row form-group">').append(
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
