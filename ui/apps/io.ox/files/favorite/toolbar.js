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
 * @author York Richter <york.richter@open-xchange.com>
 */

define('io.ox/files/favorite/toolbar', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'gettext!io.ox/core',
    'io.ox/files/actions',
    'less!io.ox/files/style'
], function (ext, links, actions, gt) {

    'use strict';

    // define links for classic toolbar
    var point = ext.point('io.ox/files/favorite/classic-toolbar/links'),
        meta = {
            'delete': {
                prio: 'hi',
                mobile: 'lo',
                label: gt('Remove from favorites'),
                drawDisabled: true,
                ref: 'io.ox/files/favorite/remove'
            },
            'back': {
                prio: 'lo',
                mobile: 'hi',
                label: gt('Folder'),
                ref: 'io.ox/files/favorite/back'
            }
        };

    new actions.Action('io.ox/files/favorite/remove', {
        requires: 'one',
        action: function (baton) {
            baton.model.collection.remove(baton.model);
        }
    });

    new actions.Action('io.ox/files/favorite/back', {
        requires: 'none',
        action: function () {
            $('[data-page-id="io.ox/files/main"]').trigger('myfavorites-folder-back');
        }
    });

    var index = 0;

    _(meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(new links.Link(extension));
    });

    ext.point('io.ox/files/favorite/classic-toolbar').extend(new links.InlineLinks({
        attributes: {},
        classes: '',
        // always use drop-down
        dropdown: true,
        index: 200,
        id: 'toolbar-links',
        ref: 'io.ox/files/favorite/classic-toolbar/links'
    }));

});
