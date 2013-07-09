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

define('io.ox/office/preview/controls',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/button',
     'io.ox/office/tk/control/textfield',
     'io.ox/office/tk/control/radiolist',
     'gettext!io.ox/office/main'
    ], function (Utils, Button, TextField, RadioList, gt) {

    'use strict';

    // static class PreviewControls ===========================================

    var PreviewControls = {};

    // constants --------------------------------------------------------------

    /**
     * Standard options for the 'Previous page' button.
     *
     * @constant
     */
    PreviewControls.PREV_OPTIONS = { icon: 'icon-minus', tooltip: gt('Show previous page') };

    /**
     * Standard options for the 'Next page' button.
     *
     * @constant
     */
    PreviewControls.NEXT_OPTIONS = { icon: 'icon-plus', tooltip: gt('Show next page') };

    /**
     * Standard options for the 'Zoom out' button.
     *
     * @constant
     */
    PreviewControls.ZOOMOUT_OPTIONS = { icon: 'docs-zoom-out', tooltip: gt('Zoom out') };

    /**
     * Standard options for the 'Zoom in' button.
     *
     * @constant
     */
    PreviewControls.ZOOMIN_OPTIONS = { icon: 'docs-zoom-in', tooltip: gt('Zoom in') };

    // class ZoomTypeChooser ==================================================

    /**
     * The button to start editing the current document.
     *
     * @constructor
     *
     * @extends Button
     */
    PreviewControls.EditDocumentButton = Button.extend({ constructor: function (app) {

        var // self reference
            self = this;

        // base constructor ---------------------------------------------------

        Button.call(this, { icon: 'icon-pencil', tooltip: gt('Edit document'), css: { color: 'yellow' } });

        // initialization -----------------------------------------------------

        // hide the button completely, if it is disabled
        this.on('enable', function (event, state) { self.toggle(state); });

    }}); // class EditDocumentButton

    // class PageChooser ======================================================

    /**
     * The drop-down list for additional options to select a page.
     *
     * @constructor
     *
     * @extends RadioList
     */
    PreviewControls.PageChooser = RadioList.extend({ constructor: function (app) {

        var // self reference
            self = this;

        // base constructor ---------------------------------------------------

        RadioList.call(this, { icon: 'icon-ellipsis-vertical', tooltip: gt('Select page'), caret: 'none', menuAlign: 'center', updateCaptionMode: 'none' });

        // initialization -----------------------------------------------------

        this.getMenuNode().addClass('app-preview page-chooser');

        // create the first/last list entries
        this.createOptionButton('first', { label: gt('Show first page') })
            .createOptionButton('last', { label: gt('Show last page') })
            .createSection('pages', { separator: true });

        // enable/disable the list entries dynamically
        this.getItemGroup().registerUpdateHandler(function (page) {
            var items = self.getItems();
            Utils.enableControls(items.filter('[data-value="first"]'), page > 1);
            Utils.enableControls(items.filter('[data-value="last"]'), page < app.getModel().getPageCount());
        });

        // create the text input field for the page number, when page count is known
        app.on('docs:import:success', function () {

            var pageInput = new TextField({
                    label: gt('Go to page'),
                    width: 50,
                    validator: new TextField.NumberValidator({ min: 1, max: app.getModel().getPageCount(), digits: 0 }),
                    tooltip: gt('Page number')
                });

            pageInput.getTextFieldNode().css({ textAlign: 'right' });
            // register the text field to establish automatic event forwarding
            self.registerPrivateGroup(pageInput);
            // insert the text field node into the prepared section
            self.getSectionNode('pages').append(pageInput.getNode());
        });

    }}); // class PageChooser

    // class ZoomTypeChooser ==================================================

    /**
     * The selector for additional zoom types.
     *
     * @constructor
     *
     * @extends RadioList
     */
    PreviewControls.ZoomTypeChooser = RadioList.extend({ constructor: function () {

        // base constructor ---------------------------------------------------

        RadioList.call(this, { icon: 'icon-ellipsis-vertical', tooltip: gt('More zoom settings'), caret: 'none', menuAlign: 'center', updateCaptionMode: 'none' });

        // initialization -----------------------------------------------------

        this.getMenuNode().addClass('app-preview zoom-chooser');

        this.createOptionButton(50, { label: gt('50%') })
            .createOptionButton(75, { label: gt('75%') })
            .createOptionButton(100, { label: gt('100%') })
            .createOptionButton(150, { label: gt('150%') })
            .createOptionButton(200, { label: gt('200%') })
            .createSection('fit', { separator: true })
            .createOptionButton('width', { sectionId: 'fit', label: gt('Fit to screen width') })
            .createOptionButton('page', { sectionId: 'fit', label: gt('Fit to screen size') });

    }}); // class ZoomTypeChooser

    // exports ================================================================

    return PreviewControls;

});
