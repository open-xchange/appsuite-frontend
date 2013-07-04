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

        // base constructor ---------------------------------------------------

        RadioList.call(this, { icon: 'icon-ellipsis-vertical', tooltip: gt('Select page'), caret: 'none', menuAlign: 'center', updateCaptionMode: 'none' });

        // initialization -----------------------------------------------------

        this.createOptionButton('first', { label: gt('Show first page') })
            .createOptionButton('last', { label: gt('Show last page') });

        //this.addPrivateMenuGroup(new TextField());

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

        this.createOptionButton(100, { label: gt('Set zoom factor to 100%') })
            .createOptionButton('width', { label: gt('Fit pages to screen width') })
            .createOptionButton('page', { label: gt('Fit pages to screen width and height') });

    }}); // class ZoomTypeChooser

    // exports ================================================================

    return PreviewControls;

});
