/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/boot/login/openid', [
    'io.ox/core/boot/util',
    'io.ox/core/session'
], function (util, session) {
    'use strict';

    return function openIdConnectLogin(options) {
        util.debug('Open ID Login ...');
        options = _.extend({
            flow: 'login'
        }, options);

        location.href = [
            ox.apiRoot,
            ox.serverConfig.oidcPath,
            '/init?',
            $.param({
                flow: options.flow,
                redirect: true,
                hash: location.hash,
                client: session.client(),
                version: session.version()
            })
        ].join('');
    };
});
