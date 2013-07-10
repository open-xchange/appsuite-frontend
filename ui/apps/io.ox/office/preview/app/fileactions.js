/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Carsten Driesner <carsten.driesner@open-xchange.com>
 */

define('io.ox/office/preview/app/fileactions',
    ['io.ox/core/extPatterns/links',
     'io.ox/office/framework/app/extensionregistry'
    ], function (links, ExtensionRegistry) {

    'use strict';

    new links.Action('io.ox/files/actions/open', {

        id: 'officepreview',

        // we just need to be called before 'default'
        before: 'default',

        // pick items you want to take care of (actually this function is called by underscore's "filter")
        filter: function (data) {
            return ExtensionRegistry.isViewable(data.filename);
        },

        action: function (baton) {
            ox.launch('io.ox/office/preview/main', { action: 'load', file: baton.data });
        }
    });

});
