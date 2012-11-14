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
     'io.ox/office/tk/view',
     'io.ox/office/tk/component/toolpane',
     'gettext!io.ox/office/main'
    ], function (Utils, View, ToolPane, gt) {

    'use strict';

    // class PreviewView ======================================================

    /**
     * @constructor
     *
     * @extends View
     */
    function PreviewView(app) {

        var // self reference
            self = this,

            // the preview model
            model = app.getModel(),

            // the application controller
            controller = app.getController(),

            // tool pane containing all tool bars
            toolPane = null;

        // private methods ----------------------------------------------------

        /**
         * Handles resize events of the browser window, and adjusts the size of
         * the application pane node.
         */
        function windowResizeHandler(event) {
            var appPane = self.getApplicationPane();
            appPane.height(window.innerHeight - appPane.offset().top);
        }

        // base constructor ---------------------------------------------------

        View.call(this, app);

        // methods ------------------------------------------------------------

        this.destroy = function () {
            toolPane.destroy();
            toolPane = null;
        };

        // initialization -----------------------------------------------------

        // the tool pane for tool bars
        toolPane = new ToolPane(app.getWindow(), controller);
        app.getWindow().nodes.main.prepend(toolPane.getNode());

        // create the tool bar
        toolPane.createToolBar('pages')
            .addButton('pages/first',    { icon: 'icon-fast-backward' })
            .addButton('pages/previous', { icon: 'icon-chevron-left' })
            .addLabel('pages/current',   { width: 100 })
            .addButton('pages/next',     { icon: 'icon-chevron-right' })
            .addButton('pages/last',     { icon: 'icon-fast-forward' });

        // listen to browser window resize events when the OX window is visible
        app.registerWindowResizeHandler(windowResizeHandler);

        // update all view components every time the window will be shown
        app.getWindow().on('show', function () { controller.update(); });


    } // class PreviewView

    // exports ================================================================

    // derive this class from class View
    return View.extend({ constructor: PreviewView });

});
