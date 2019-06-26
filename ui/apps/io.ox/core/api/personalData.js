/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/api/personalData', [
    'io.ox/core/event'
], function (Events) {

    'use strict';

    var mockRequestData = {
        'status': 'none',
        'mail': {
            'enabled': true,
            'includeTrash': false,
            'includeShared': false,
            'subscribedOnly': true
        },
        'calendar': {
            'enabled': true,
            'includePublic': false,
            'includeShared': false
        },
        'contacts': {
            'enabled': true,
            'includePublic': false,
            'includeShared': false
        },
        'files': {
            'enabled': true,
            'includeAllFileVersions': false,
            'includeTrash': false,
            'includePublic': false,
            'includeShared': false
        },
        'tasks': {
            'enabled': true,
            'includePublic': false,
            'includeShared': false
        },
        'maxArchiveSize': '2G'
    };
    var api = {
        getStatus: function () {
            return $.Deferred().resolve(mockRequestData);
        },

        requestDownload: function (data) {
            data.started = _.now();
            data.status = 'running';
            mockRequestData = data;
            console.log('download requested', data, mockRequestData);
        }
    };

    Events.extend(api);

    return api;
});
