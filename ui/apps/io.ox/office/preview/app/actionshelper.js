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
    ['io.ox/core/extPatterns/links',
     'io.ox/office/framework/app/extensionregistry'
    ], function (links, ExtensionRegistry) {

    'use strict';

    // static class ActionsHelper =============================================

    var ActionsHelper = {};

    // methods ----------------------------------------------------------------

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
    ActionsHelper.isViewable = function (data) {
        return data.collection.has('one') && ExtensionRegistry.isViewable(data.context.filename);
    };

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
            requires: ActionsHelper.isViewable,
            action: function (baton) {
                ox.launch('io.ox/office/preview/main', {
                    action: 'load',
                    file: fileDescriptorHandler(baton)
                });
            }
        });
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
                if (ActionsHelper.isViewable(data)) {
                    data.stopPropagation();
                    return false;
                }
            }
        });
    };

    // exports ================================================================

    return ActionsHelper;

});
