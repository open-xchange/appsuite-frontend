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

define('io.ox/office/framework/app/toolbaractions',
    ['io.ox/core/extPatterns/links',
     'io.ox/office/tk/utils',
     'gettext!io.ox/office/framework'
    ], function (links, Utils, gt) {

    'use strict';

    // static class ToolBarActions ============================================

    /**
     * Provides static methods to configure the global window tool bar for
     * various application types.
     */
    var ToolBarActions = {};

    // methods ----------------------------------------------------------------

    /**
     * Creates a new icon in the global window tool bar of the specified
     * application type. Registration is done globally once per application
     * type, using the extension framework.
     *
     * @param {String} moduleName
     *  The application type identifier.
     *
     * @param {Object} options
     *  A map with options for the new tool bar icon. The following options
     *  are supported:
     *  @param {String} id
     *      The unique identifier of the tool bar icon.
     *  @param {String} icon
     *      The CSS class of the icon symbol.
     *  @param {String} label
     *      The tool tip label of the icon.
     *  @param {Number} index
     *      The insertion index, compared to other icons on the same level.
     *  @param {Function} action
     *      The action to be executed when the icon has been clicked.
     *      Receives the application instance as first parameter.
     */
    ToolBarActions.createIcon = function (moduleName, options) {

        var // extract all passed options
            id = Utils.getStringOption(options, 'id'),
            icon = Utils.getStringOption(options, 'icon'),
            label = Utils.getStringOption(options, 'label', ''),
            index = Utils.getIntegerOption(options, 'index', 0),
            actionFunc = Utils.getFunctionOption(options, 'action', $.noop),

            // unique name of the action
            ACTION_POINT = moduleName + '/actions/' + id,
            // root path for tool bar links
            TOOLBAR_PATH = moduleName + '/links/toolbar',
            // unique name of the tool bar link
            TOOLBAR_POINT = TOOLBAR_PATH + '/' + id;

        // create the action (call with application instead of baton)
        new links.Action(ACTION_POINT, {
            action: function (baton) { return actionFunc(baton.app); }
        });

        // create an action group for the action link in the tool bar
        new links.ActionGroup(TOOLBAR_PATH, {
            id: id,
            index: index,
            icon: function () { return $('<i>').addClass(icon); }
        });

        // create the action link in the group (single links are shown as
        // icons in the tool bar, not as drop-down menu)
        new links.ActionLink(TOOLBAR_POINT, {
            label: label,
            index: 100,
            ref: ACTION_POINT
        });
    };

    // exports ================================================================

    return ToolBarActions;

});
