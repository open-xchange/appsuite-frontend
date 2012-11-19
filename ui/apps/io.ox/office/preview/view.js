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

define('io.ox/office/preview/view',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/view/toolpane',
     'io.ox/office/tk/view/view',
     'gettext!io.ox/office/main'
    ], function (Utils, ToolPane, View, gt) {

    'use strict';

    // class PreviewView ======================================================

    /**
     * @constructor
     *
     * @extends View
     */
    function PreviewView(app) {

        var // tool pane containing all tool bars
            toolPane = null;

        // base constructor ---------------------------------------------------

        View.call(this, app);

        // initialization -----------------------------------------------------

        // the tool pane for tool bars
        toolPane = new ToolPane(app);
        this.addPane('toolpane', toolPane, 'top');

        // create the tool bar
        toolPane.createToolBar('pages')
            .addButton('pages/first',    { icon: 'icon-io-ox-arrow-first',    tooltip: gt('First page') })
            .addButton('pages/previous', { icon: 'icon-io-ox-arrow-previous', tooltip: gt('Previous page') })
            .addLabel('pages/current',   { width: 100 })
            .addButton('pages/next',     { icon: 'icon-io-ox-arrow-next',     tooltip: gt('Next page') })
            .addButton('pages/last',     { icon: 'icon-io-ox-arrow-last',     tooltip: gt('Last page') })
            .getNode().css('text-align', 'center');

    } // class PreviewView

    // exports ================================================================

    // derive this class from class View
    return View.extend({ constructor: PreviewView });

});
