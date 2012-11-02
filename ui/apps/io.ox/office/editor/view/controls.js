/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/editor/view/controls',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/fonts',
     'io.ox/office/tk/control/button',
     'io.ox/office/tk/control/radiogroup',
     'io.ox/office/tk/control/combofield',
     'io.ox/office/tk/control/colorchooser',
     'io.ox/office/tk/dropdown/gridsizer',
     'io.ox/office/editor/format/color',
     'gettext!io.ox/office/main'
    ], function (Utils, Fonts, Button, RadioGroup, ComboField, ColorChooser, GridSizer, Color, gt) {

    'use strict';

    var // predefined color definitions
        BUILTIN_COLOR_DEFINITIONS = [
            { label: gt('Dark Red'),    color: { type: 'rgb', value: 'C00000' } },
            { label: gt('Red'),         color: { type: 'rgb', value: 'FF0000' } },
            { label: gt('Orange'),      color: { type: 'rgb', value: 'FFC000' } },
            { label: gt('Yellow'),      color: { type: 'rgb', value: 'FFFF00' } },
            { label: gt('Light Green'), color: { type: 'rgb', value: '92D050' } },
            { label: gt('Green'),       color: { type: 'rgb', value: '00B050' } },
            { label: gt('Light Blue'),  color: { type: 'rgb', value: '00B0F0' } },
            { label: gt('Blue'),        color: { type: 'rgb', value: '0070C0' } },
            { label: gt('Dark Blue'),   color: { type: 'rgb', value: '002060' } },
            { label: gt('Purple'),      color: { type: 'rgb', value: '7030A0' } }
        ],

        // definitions for the theme color table (0: pure color; negative values: 'shade'; positive values: 'tint')
        SCHEME_COLOR_DEFINITIONS = [
            { name: 'background1', label: gt('Background 1'), transformations: [    0, -242, -217, -191, -166, -128 ] },
            { name: 'text1',       label: gt('Text 1'),       transformations: [  128,  166,  191,  217,  242,    0 ] },
            { name: 'background2', label: gt('Background 2'), transformations: [    0, -230, -191, -128,  -64,  -26 ] },
            { name: 'text2',       label: gt('Text 2'),       transformations: [   51,  102,  153,    0, -191, -128 ] },
            { name: 'accent1',     label: gt('Accent 1'),     transformations: [   51,  102,  153,    0, -191, -128 ] },
            { name: 'accent2',     label: gt('Accent 2'),     transformations: [   51,  102,  153,    0, -191, -128 ] },
            { name: 'accent3',     label: gt('Accent 3'),     transformations: [   51,  102,  153,    0, -191, -128 ] },
            { name: 'accent4',     label: gt('Accent 4'),     transformations: [   51,  102,  153,    0, -191, -128 ] },
            { name: 'accent5',     label: gt('Accent 5'),     transformations: [   51,  102,  153,    0, -191, -128 ] },
            { name: 'accent6',     label: gt('Accent 6'),     transformations: [   51,  102,  153,    0, -191, -128 ] }
        ];

    // static class Controls ==================================================

    var Controls = {};

    // class StyleSheetChooser ================================================

    /**
     * A drop-down list control used to select a style sheet from a list. The
     * drop-down list entries will visualize the formatting attributes of the
     * style sheet if possible.
     *
     * @constructor
     *
     * @extends RadioGroup
     *
     * @param {Editor} editor
     *  The editor containing the style sheets visualized by this control.
     *
     * @param {String} family
     *  The attribute family of the style sheets visualized by this control.
     *
     * @param {Object} [options]
     *  Additional options passed to the RadioGroup constructor. Supports all
     *  options of the RadioGroup class, and the following additional options:
     *  @param {String|String[]} previewFamilies
     *      The attribute families used to get the formatting options of the
     *      list items representing the style sheets. If omitted, only
     *      attributes of the family specified by the 'family' parameter will
     *      be used.
     */
    Controls.StyleSheetChooser = RadioGroup.extend({ constructor: function (editor, family, options) {

        var // self reference
            self = this,
            // the style sheet container
            styleSheets = editor.getStyleSheets(family),
            // attribute families used to generate preview options
            previewFamilies = Utils.getArrayOption(options, 'previewFamilies');

        /**
         * Called for each list item to get the sorting index, which has been
         * stored in the user data of the button elements.
         */
        function sortFunctor(button) {
            return Utils.getControlUserData(button);
        }

        /**
         * Fills the drop-down list with all known style names, and adds
         * preview CSS formatting to the list items.
         */
        function fillList() {
            self.clearOptionButtons();
            _(styleSheets.getStyleSheetNames()).each(function (name, id) {

                var // options for the formatting preview
                    options = styleSheets.getPreviewButtonOptions(id, previewFamilies),
                    // sorting priority
                    priority = styleSheets.getUIPriority(id),
                    // the sort index stored at the button for lexicographical sorting
                    sortIndex = String((priority < 0) ? (priority + 0x7FFFFFFF) : priority);

                // build a sorting index usable for lexicographical comparison:
                // 1 digit for priority sign, 10 digits positive priority,
                // followed by lower-case style sheet name
                while (sortIndex.length < 10) { sortIndex = '0' + sortIndex; }
                sortIndex = ((priority < 0) ? '0' : '1') + sortIndex + name.toLowerCase();

                // create the list item, pass sorting index as user data
                self.addOptionButton(id, Utils.extendOptions(options, { label: name, css: { height: '36px', padding: '2px 12px' }, userData: sortIndex }));
            });
        }

        // base constructor ---------------------------------------------------

        RadioGroup.call(this, Utils.extendOptions(options, {
            width: 120,
            white: true,
            dropDown: true,
            sorted: true,
            sortFunctor: sortFunctor
        }));

        // initialization -----------------------------------------------------

        // add all known style sheets, listen to 'change' events
        fillList();
        styleSheets.on('change', fillList);
        // also reinitialize the preview if theme settings have been changed
        editor.getThemes().on('change', fillList);

    }}); // class StyleSheetChooser

    // class ParagraphStyleChooser ============================================

    /**
     * A style sheet chooser for paragraph style sheets.
     *
     * @constructor
     *
     * @extends StyleSheetChooser
     *
     * @param {Editor} editor
     *  The editor instance containing the style sheet container visualized by
     *  this control.
     */
    Controls.ParagraphStyleChooser = Controls.StyleSheetChooser.extend({ constructor: function (editor) {

        // base constructor ---------------------------------------------------

        Controls.StyleSheetChooser.call(this, editor, 'paragraph', {
            tooltip: gt('Paragraph Style'),
            previewFamilies: ['paragraph', 'character']
        });

    }}); // class ParagraphStyleChooser

    // class ColorChooser =====================================================

    /**
     * A special color chooser that shows a selection of standard colors, and
     * a table of shaded scheme colors from the current document theme.
     *
     * @param {Editor} editor
     *  The editor containing the document theme whose colors will be shown.
     *
     * @param {String} context
     *  The color context that will be used to resolve the 'auto' color
     *  correctly.
     *
     * @param {Object} [options]
     *  Additional options passed to the ColorChooser base constructor.
     *  Supports all options of the ColorChooser class.
     */
    Controls.ColorChooser = ColorChooser.extend({ constructor: function (editor, context, options) {

        var // self reference
            self = this,
            // the collection of themes of the edited document
            themes = editor.getThemes();

        // private methods ----------------------------------------------------

        /**
         * Converts the passed color value to a CSS color string.
         */
        function resolveCssColor(color) {
            return Color.getCssColor(color, context, themes.getTheme());
        }

        function fillList() {

            var // the current theme
                theme = themes.getTheme(),
                // row index and count for scheme colors
                rowIndex = 0, rowCount = 0;

            function fillSchemeColorRow() {
                _(SCHEME_COLOR_DEFINITIONS).each(function (definition) {

                    var // the encoded transformation
                        encoded = definition.transformations[rowIndex],
                        // decoded tint/shade value
                        tint = encoded > 0, value = Math.round(Math.abs(encoded) / 255 * 100000),
                        // the theme color object
                        color = { type: 'scheme', value: definition.name },
                        // description of the color (tool tip)
                        label = definition.label;

                    if (encoded !== 0) {
                        color.transformations = [{ type: tint ? 'tint' : 'shade', value: value }];
                        label += ', ' + (tint ? gt('Lighter') : gt('Darker')) + ' ' + (100 - Math.round(value / 1000)) + '%';
                    }

                    self.addColorButton(color, { tooltip: label });
                });
            }

            self.clearColorTable();

            // add automatic color
            self.addWideColorButton(Color.AUTO, { label: Color.isTransparentColor(Color.AUTO, context) ? gt('No Color') : gt('Automatic Color') });

            // add scheme colors
            if (theme && theme.hasSchemeColors()) {
                self.addSectionHeader({ label: gt('Theme Colors') });
                for (rowIndex = 0, rowCount = SCHEME_COLOR_DEFINITIONS[0].transformations.length; rowIndex < rowCount; rowIndex += 1) {
                    fillSchemeColorRow();
                }
            }

            // add predefined colors
            self.addSectionHeader({ label: gt('Standard Colors') });
            _(BUILTIN_COLOR_DEFINITIONS).each(function (definition) {
                self.addColorButton(definition.color, { tooltip: definition.label });
            });
        }

        // base constructor ---------------------------------------------------

        ColorChooser.call(this, Utils.extendOptions(options, {
            columns: 10,
            cssColorResolver: resolveCssColor
        }));

        // initialization -----------------------------------------------------

        fillList();
        themes.on('change', fillList);

    }}); // class ColorChooser

    // class FontFamilyChooser ================================================

    Controls.FontFamilyChooser = ComboField.extend({ constructor: function () {

        // base constructor ---------------------------------------------------

        ComboField.call(this, {
            width: 150,
            tooltip: gt('Font Name'),
            sorted: true,
            typeAhead: true
        });

        // initialization -----------------------------------------------------

        // add all known fonts
        _(Fonts.getRegisteredFontNames()).each(function (fontName) {
            this.addListEntry(fontName, { labelCss: { fontFamily: Fonts.getCssFontFamily(fontName), fontSize: '115%' } });
        }, this);

    }}); // class FontFamilyChooser

    // class FontHeightChooser ================================================

    Controls.FontHeightChooser = ComboField.extend({ constructor: function () {

        // base constructor ---------------------------------------------------

        ComboField.call(this, {
            width: 35,
            tooltip: gt('Font Size'),
            css: { textAlign: 'right' },
            validator: new ComboField.NumberValidator({ min: 1, max: 999.9, digits: 1 })
        });

        // initialization -----------------------------------------------------

        _([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96]).each(function (size) {
            this.addListEntry(size, { css: { textAlign: 'right', paddingRight: '20px' } });
        }, this);

    }}); // class FontHeightChooser

    // class TableSizeChooser =================================================

    Controls.TableSizeChooser = Button.extend({ constructor: function () {

        var options = {
                icon: 'icon-io-ox-table',
                tooltip: gt('Insert Table'),
                defaultSize: { width: 5, height: 3 },
                maxSize: { width: 15, height: 15 }
            };

        // base constructors --------------------------------------------------

        // create the default button (set value to default size, will be returned by click handler)
        Button.call(this, Utils.extendOptions(options, { value: options.defaultSize }));
        // create the grid sizer
        GridSizer.call(this, Utils.extendOptions(options, { plainCaret: true }));

    }}); // class TableSizeChooser

    // exports ================================================================

    return Controls;

});
