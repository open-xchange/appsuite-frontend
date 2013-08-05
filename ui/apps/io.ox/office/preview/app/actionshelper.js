/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/preview/app/actionshelper',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/office/tk/utils',
     'io.ox/office/framework/app/extensionregistry',
     'gettext!io.ox/office/main'
    ], function (ext, links, Utils, ExtensionRegistry, gt) {

    'use strict';

    // private global functions ===============================================

    /**
     * Returns whether the file selection described in the passed callback data
     * object is viewable in the OX Viewer application.
     *
     * @param {Object} data
     *  The data passed to the 'requires' callback function of an action.
     *
     * @returns {Boolean}
     *  Whether the passed data describes exactly one file that is viewable in
     *  the OX Viewer application.
     */
    function isViewable(data) {
        return data.collection.has('one') && ExtensionRegistry.isViewable(data.context.filename);
    }

    // static class ActionsHelper =============================================

    /**
     * Defines static methods to create new actions and links to launch the OX
     * Viewer application from various other applications in OX AppSuite.
     */
    var ActionsHelper = {};

    // methods ----------------------------------------------------------------

    /**
     * Creates a new action that will show a single document in the OX Viewer
     * application.
     *
     * @param {String} actionId
     *  The identifier of the new action.
     *
     * @param {Function} fileDescriptorHandler
     *  A converter callback function that receives the Baton object and has to
     *  return the file descriptor passed to the launcher of OX Viewer.
     */
    ActionsHelper.createViewerAction = function (actionId, fileDescriptorHandler) {
        new links.Action(actionId, {
            requires: isViewable,
            action: function (baton) {
                ox.launch('io.ox/office/preview/main', {
                    action: 'load',
                    file: fileDescriptorHandler(baton)
                });
            }
        });
    };

    /**
     * Creates a new clickable link that launches OX Viewer for a specific
     * file.
     *
     * @param {String} pointId
     *  The identifier of the extension point containing the links.
     *
     * @param {String} actionId
     *  The identifier of the action launching the OX Viewer application.
     *
     * @param {Object} [options]
     *  Additional options passed to the constructor of the link.
     */
    ActionsHelper.createViewerLink = function (pointId, actionId, options) {
        ext.point(pointId).extend(new links.Link(Utils.extendOptions({
            id: 'office_view',
            index: 100,
            label: gt('View'),
            ref: actionId
        }, options)));
    };

    /**
     * Extends the specified action. It will be disabled, if the file passed to
     * the action is viewable in the OX Viewer application.
     *
     * @param {String} actionId
     *  The identifier of the action to be disabled for files viewable in the
     *  OX Viewer application.
     */
    ActionsHelper.disableActionForViewable = function (actionId) {
        new links.Action(actionId, {
            id: 'disable_action',
            index: 'first',
            requires: function (data) {
                if (isViewable(data)) {
                    data.stopPropagation();
                    return false;
                }
            }
        });
    };

    // exports ================================================================

    return ActionsHelper;

});
