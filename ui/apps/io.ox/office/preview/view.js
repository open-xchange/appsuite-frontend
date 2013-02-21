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
     'gettext!io.ox/office/main',
     'less!io.ox/office/preview/style.css'
    ], function (Utils, View, gt) {

    'use strict';

    // class PreviewView ======================================================

    /**
     * @constructor
     *
     * @extends View
     */
    function PreviewView(app) {

        var // self reference
            self = this;

        // base constructor ---------------------------------------------------

        View.call(this, app, { modelPadding: 30 });

        // private methods ----------------------------------------------------

        /**
         * Initialization after construction. Will be called once after
         * construction of the application is finished.
         */
        function initHandler() {

            var // the tool pane for tool boxes
                toolPane = self.createPane('toolpane', 'top', { overlay: true, transparent: true, css: { textAlign: 'center' } });

            toolPane.createToolBox({ hoverEffect: true, classes: 'inline' })
                .addGroupContainer(function () {
                    this.addButton('pages/first',    { icon: 'arrow-first',    tooltip: gt('Show first page') })
                        .addButton('pages/previous', { icon: 'arrow-previous', tooltip: gt('Show previous page') })
                        .addLabel('pages/current',   {                         tooltip: gt('Current page and total page count') })
                        .addButton('pages/next',     { icon: 'arrow-next',     tooltip: gt('Show next page') })
                        .addButton('pages/last',     { icon: 'arrow-last',     tooltip: gt('Show last page') });
                });

            toolPane.createToolBox({ hoverEffect: true, css: { float: 'right', paddingRight: '26px' } })
                .addButton('app/quit', { icon: 'icon-remove', tooltip: gt('Close document') });

            // show alert banners above the overlay pane (floating buttons below alert banners)
            self.showAlertsBeforePane('toolpane');
        }

        // initialization -----------------------------------------------------

        // initialization after construction
        app.registerInitHandler(initHandler);

    } // class PreviewView

    // exports ================================================================

    // derive this class from class View
    return View.extend({ constructor: PreviewView });

});
