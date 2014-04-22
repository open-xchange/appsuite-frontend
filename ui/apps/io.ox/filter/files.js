/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Hellweg<christoph.hellweg@open-xchange.com>
 */

define('io.ox/filter/files', [
    'io.ox/core/extensions',
    'settings!io.ox/files'
], function (ext, fileSettings) {

    'use strict';

    ext.point('io.ox/files/filter').extend({
        id: 'dot_files',
        isEnabled: function () {
            return fileSettings.get('showHidden', false) !== true;
        },
        isVisible: function (file) {
            var title = (file ? file.title : '');
            return title.indexOf('.') !== 0;
        }
    });
});
