/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/lessons/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links'
    ], function (ext, links) {

    'use strict';

    new links.Action('io.ox/lessons/actions/toc', {
        id: 'toc',
        action: function (baton) {
            baton.app.tableOfContents();
        }
    });

    new links.ActionGroup('io.ox/lessons/links/toolbar', {
        index: 100,
        id: 'default',
        icon: function () {
            return $('<i class="icon-list">');
        }
    });

    new links.ActionLink('io.ox/lessons/links/toolbar/default', {
        index: 100,
        id: 'default',
        label: 'Table of contents',
        ref: 'io.ox/lessons/actions/toc'
    });


});
