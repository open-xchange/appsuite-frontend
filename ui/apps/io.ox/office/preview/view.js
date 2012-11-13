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
     'io.ox/office/tk/component/toolpane',
     'gettext!io.ox/office/main'
    ], function (Utils, ToolPane, gt) {

    'use strict';

    // class PreviewView ======================================================

    function PreviewView(appWindow, model, controller) {

        var // all nodes of the application window
            nodes = appWindow.nodes,

            // tool pane containing all tool bars
            toolPane = new ToolPane(appWindow, controller);

        // private methods ----------------------------------------------------

        /**
         * Handles resize events of the browser window, and adjusts the size of
         * the application pane node.
         */
        function windowResizeHandler(event) {
            nodes.appPane.height(window.innerHeight - nodes.appPane.offset().top);
        }

        // methods ------------------------------------------------------------

        this.destroy = function () {
            toolPane.destroy();
            toolPane = null;
        };

        // initialization -----------------------------------------------------

        // create all panes
        nodes.main.addClass('io-ox-office-preview-main').append(
            nodes.toolPane = toolPane.getNode(),
            nodes.appPane = $('<div>').addClass('io-ox-pane apppane').append(model.getNode())
        );

        // create the tool bar
        toolPane.createToolBar('pages')
            .addButton('pages/first',    { icon: 'icon-fast-backward' })
            .addButton('pages/previous', { icon: 'icon-chevron-left' })
            .addLabel('pages/current',   { width: 100 })
            .addButton('pages/next',     { icon: 'icon-chevron-right' })
            .addButton('pages/last',     { icon: 'icon-fast-forward' });

        // listen to browser window resize events when the OX window is visible
        Utils.registerWindowResizeHandler(appWindow, windowResizeHandler);

        // update all view components every time the window will be shown
        appWindow.on('show', function () { controller.update(); });


    } // class PreviewView

    // exports ================================================================

    return PreviewView;

});
