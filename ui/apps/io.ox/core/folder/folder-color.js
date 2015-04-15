/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/core/folder/folder-color', ['settings!io.ox/calendar'], function (settings) {

    'use strict';

    return {
        getFolderColor: function (folder) {
            return folder.meta ? folder.meta.color_label || settings.get('defaultFolderColor', 1) : settings.get('defaultFolderColor', 1);
        }
    };

});
