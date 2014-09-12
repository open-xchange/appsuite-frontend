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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/core/api/export', [
    'io.ox/core/http',
    'io.ox/core/api/factory'
], function (http, apiFactory) {

    'use strict';

    // generate basic API
    var api = apiFactory({
        module: 'export',
        requests: {
            get: {
                action: 'get'
            }
        }
    });

    /**
     * returns export url
     * @param  {string} type/format
     * @param  {string} folder
     * @param  {object} options
     * @return { string} url
     */
    api.getUrl = function (type, folder, options) {
        var opt = $.extend({ include: true }, options || {});
        return ox.apiRoot + '/export' +
                '?action=' + type +
                '&folder=' + folder +
                '&export_dlists=' + opt.include +
                '&content_disposition=attachment' +
                '&session=' + ox.session;
    };

    return api;
});
