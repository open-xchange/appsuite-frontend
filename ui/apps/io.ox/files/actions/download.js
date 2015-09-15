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

define('io.ox/files/actions/download', [
    'io.ox/core/download',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (download, notifications, gt) {

    'use strict';

    /**
     * filters 'description only items' (just descriptions without 'real' files)
     * @param  {object|array} list or single item
     * @return {deferred} resolves as array
     */
    function filterUnsupported(list) {
        return _(list).filter(function (obj) {
            return !_.isEmpty(obj.filename) || obj.file_size > 0 || obj.standard_folder !== undefined;
        });
    }

    // loop over list, get full file object and trigger downloads
    return function (list) {
        var filtered = filterUnsupported(list);
        if (filtered.length === 1) {
            // single as file
            download.file(filtered[0]);
        } else if (filtered.length > 1) {
            // multiple as zip
            download.files(filtered);
        }
        // 'description only' items
        if (filtered.length === 0 || list.length !== filtered.length) {
            notifications.yell('info', gt('Items without a file can not be downloaded.'));
        }
    };

});
