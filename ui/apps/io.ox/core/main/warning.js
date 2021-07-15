/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/main/warning', [
    'io.ox/core/notifications',
    'io.ox/core/folder/api',
    'gettext!io.ox/core'
], function (notifications, folderAPI, gt) {

    //
    // Visual response to hidden folders
    //
    folderAPI.on('warn:hidden', function (folder) {
        if (folder) {
            notifications.yell('info',
                //#. %1$s is the filename
                gt('Folder with name "%1$s" will be hidden. Enable setting "Show hidden files and folders" to access this folder again.', folder.title)
            );
        }
    });

    //
    // Respond to special http error codes (see bug 32836)
    //

    ox.on('http:error', function (error) {
        switch (error.code) {
            // IMAP-specific: 'Relogin required'
            case 'MSG-1000':
            case 'MSG-1001':
            case 'MSG-1036':
            case 'MSG-1038':
            case 'MSG-1039':
            case 'MSG-1040':
            // INUSE (see bug 37218)
            // falls through
            case 'MSG-1031':
            case 'MSG-0114':
            case 'OAUTH-0013':
            case 'OAUTH-0042':
            case 'OAUTH-0043':
            case 'OAUTH-0044':
                notifications.yell(error);
                break;
            case 'LGI-0016':
                // redirect based on error message; who had the brilliant idea to name the message of the error object 'error'?
                _.url.redirect(_.url.vars(error.error));
                break;
            // no default
        }
    });

    // white list warning codes
    var isValidWarning = (function () {
        var check = function (code, regex) { return regex.test(code); },
            reCodes = [
                // sharing warnings
                /^SHR_NOT-\d{4}$/,
                /^RSS-0007/,
                // IMAP-specific on unified inbox folders (see Bug 50799)
                /^MSG-1001/
            ];
        return function (code) {
            // return true in case at least one regex matched
            var getValid = _.partial(check, code);
            return !!(_.find(reCodes, getValid));
        };
    })();

    ox.on('http:warning', function (warning) {
        var valid = isValidWarning(warning.code);
        if (valid) return notifications.yell('warning', warning.error);
        if (ox.debug) console.warn('server response: ', warning.error);
    });

});
