/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012 Mail: info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/filter/folder', [
    'io.ox/core/extensions',
    'settings!io.ox/core'
], function (ext, settings) {

    'use strict';

    ext.point('io.ox/folder/filter').extend({
        id: 'folder_blacklist',
        isVisible: function (folder) {
            var blacklist = settings.get('folder/blacklist', {});
            var blacklistedFolder = blacklist[String(folder.data ? folder.data.id : folder.id)];
            return folder !== undefined && (blacklistedFolder === undefined || blacklistedFolder === false);
        }
    });
});
