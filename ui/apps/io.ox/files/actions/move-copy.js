/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/actions/move-copy', [
    'io.ox/files/api',
    'io.ox/core/folder/actions/move',
    'io.ox/core/capabilities',
    'settings!io.ox/files'
], function (api, move, capabilities, settings) {

    'use strict';

    return function (list, baton, options) {

        // auto-open folder 10 for guests (see bug 42621)
        if (capabilities.has('guest')) options.open = ['10'];

        move.item({
            api: api,
            button: options.label,
            list: list,
            module: 'infostore',
            root: '9',
            open: options.open,
            settings: settings,
            success: options.success,
            successCallback: options.successCallback,
            target: baton.target,
            title: options.label,
            type: options.type
        });
    };
});
