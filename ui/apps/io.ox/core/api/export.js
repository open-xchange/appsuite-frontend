/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
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
     * returns export url for complete folders
     * @param  {string} type/format
     * @param  {string} folder
     * @param  {object} options
     * @return { string} url
     */
    api.getURL = function (type, folder, options) {
        var opt = $.extend({ include: true }, options || {});
        return ox.apiRoot + '/export' +
                '?action=' + type +
                '&folder=' + folder +
                '&export_dlists=' + opt.include +
                '&content_disposition=attachment' +
                '&session=' + ox.session;
    };


    /**
     * returns export url for list of contacts/distribution lists
     * @param  {string} list contacts with at leat folder_id and id property
     * @return {string} url
     */
    api.getVCardURL = function (list, options) {
        var opt = $.extend({ include: true }, options || {}),
            ids = _.map(list, function (item) { return [String(item.folder_id), String(item.id)]; });
        var url = ox.apiRoot + '/export' +
                '?action=VCARD' +
                '&ids=' + encodeURIComponent(JSON.stringify(ids)) +
                '&export_dlists=' + opt.include +
                '&content_disposition=attachment' +
                '&session=' + ox.session;
        // max length check for huge lists of contacts
        if (url.length <= http.getRequestLengthLimit()) return url;
    };

    return api;
});
