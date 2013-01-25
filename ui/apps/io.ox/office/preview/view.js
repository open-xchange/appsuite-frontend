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
     'io.ox/office/tk/view/view',
     'gettext!io.ox/office/main'
    ], function (Utils, View, gt) {

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

        View.call(this, app, { modelPadding: 30 });

        // initialization -----------------------------------------------------

        // the tool pane for tool boxes
        toolPane = this.createPane('toolpane', 'top', { overlay: true, transparent: true, css: { textAlign: 'center' } });

        toolPane.createToolBox({ hoverEffect: true, classes: 'inline' })
            .startGroupContainer()
                .addButton('pages/first',    { icon: 'arrow-first',    tooltip: gt('Show first page') })
                .addButton('pages/previous', { icon: 'arrow-previous', tooltip: gt('Show previous page') })
                .addLabel('pages/current',   {                         tooltip: gt('Current page and total page count') })
                .addButton('pages/next',     { icon: 'arrow-next',     tooltip: gt('Show next page') })
                .addButton('pages/last',     { icon: 'arrow-last',     tooltip: gt('Show last page') })
            .endGroupContainer();

        toolPane.createToolBox({ hoverEffect: true, css: { float: 'right', paddingRight: '26px' } })
            .addButton('app/quit', { icon: 'icon-remove', tooltip: gt('Close document') });

    } // class PreviewView

    // exports ================================================================

    // derive this class from class View
    return View.extend({ constructor: PreviewView });

});
