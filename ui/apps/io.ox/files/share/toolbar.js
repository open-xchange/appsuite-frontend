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
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/files/share/toolbar', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/yell',
    'io.ox/core/folder/api',
    'io.ox/files/api',
    'io.ox/files/share/api',
    'gettext!io.ox/files',
    'io.ox/files/actions',
    'less!io.ox/files/style'
], function (ext, links, actions, yell, folderAPI, filesAPI, api, gt) {

    'use strict';

    // define links for classic toolbar
    var point = ext.point('io.ox/files/share/classic-toolbar/links'),

        meta = {
            'edit': {
                prio: 'hi',
                mobile: 'lo',
                label: gt('Edit share'),
                drawDisabled: true,
                ref: 'io.ox/files/share/edit'
            },
            'delete': {
                prio: 'hi',
                mobile: 'lo',
                label: gt('Revoke access'),
                drawDisabled: true,
                ref: 'io.ox/files/share/revoke'
            }
        };

    new actions.Action('io.ox/files/share/edit', {
        requires: 'one',
        action: function (baton) {
            require(['io.ox/files/share/permissions'], function (permissions) {
                permissions.show(baton.model);
            });
        }
    });

    new actions.Action('io.ox/files/share/revoke', {
        requires: 'one',
        action: function (baton) {
            require(['io.ox/files/share/permissions'], function (permissions) {
                var collection = new permissions.Permissions();
                api.revoke(collection, baton.model).then(function () {
                    yell('success', gt('Revoked access.'));
                }).fail(yell);
            });
        }
    });

    // transform into extensions

    var index = 0;

    _(meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(new links.Link(extension));
    });

    ext.point('io.ox/files/share/classic-toolbar').extend(new links.InlineLinks({
        attributes: {},
        classes: '',
        // always use drop-down
        dropdown: true,
        index: 200,
        id: 'toolbar-links',
        ref: 'io.ox/files/share/classic-toolbar/links'
    }));

});
