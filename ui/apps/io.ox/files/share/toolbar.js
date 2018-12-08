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
 * @author David Bauer <david.bauer@open-xchange.com>
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
            steady: true
        },
        'delete': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Revoke access'),
            ref: 'io.ox/files/share/revoke',
            steady: true
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

    new Action('io.ox/files/share/edit', {
        requires: 'one',
        action: function (baton) {
            require(['io.ox/files/share/permissions'], function (permissions) {
                permissions.show(baton.model);
            });
        }
    });

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
