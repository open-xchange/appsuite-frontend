/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/mail/actions/copyMove', [
    'io.ox/mail/api',
    'io.ox/core/folder/api',
    'settings!io.ox/mail'
], function (api, folderAPI, settings) {

    'use strict';

    return {

        multiple: function (o) {
            require(['io.ox/core/folder/actions/move'], function (move) {
                move.item({
                    all: o.list,
                    api: api,
                    button: o.label,
                    list: folderAPI.ignoreSentItems(o.list),
                    module: 'mail',
                    root: '1',
                    settings: settings,
                    success: o.success,
                    target: o.baton.target,
                    title: o.label,
                    type: o.type
                });
            });
        }
    };
});
