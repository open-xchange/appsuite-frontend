/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/files/share/toolbar', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/yell',
    'io.ox/files/share/api',
    'gettext!io.ox/files',
    'io.ox/files/actions',
    'less!io.ox/files/style'
], function (ext, actionsUtil, yell, api, gt) {

    'use strict';

    // define links for classic toolbar
    var point = ext.point('io.ox/files/share/toolbar/links');

    // the link meta data used for desktop and tablets
    var meta = {
        'edit': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Edit share'),
            ref: 'io.ox/files/actions/editShare',
            drawDisabled: true
        },
        'delete': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Revoke access'),
            ref: 'io.ox/files/share/revoke',
            drawDisabled: true
        }
    };

    // the link meta data used for smartphones
    var metaPhone = {
        'back': {
            prio: 'lo',
            mobile: 'hi',
            title: gt('Folders'),
            ref: 'io.ox/files/share/back'
        }
    };

    var Action = actionsUtil.Action;
    // TODO check action Kristof
    new Action('io.ox/files/share/edit', {
        collection: 'one',
        action: function (baton) {
            require(['io.ox/files/share/permissions'], function (permissions) {
                permissions.show(baton.model);
            });
        }
    });
    // TODO check action Kristof
    new Action('io.ox/files/share/back', {
        toggle: _.device('smartphone'),
        action: function () {
            $('[data-page-id="io.ox/files/main"]').trigger('myshares-folder-back');
        }
    });

    // transform into extensions
    var index = 0;
    // fix for #58808 - use different link meta data on smartphones
    _(_.device('smartphone') ? metaPhone : meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(extension);
    });
});
