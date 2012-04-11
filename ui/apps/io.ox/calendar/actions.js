/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'gettext!io.ox/calendar/actions'], function (ext, links, gt) {

    'use strict';

    var Action = links.Action, Link = links.XLink, Dropdown = links.Dropdown;

    // Actions

    new Action('io.ox/calendar/actions/switch-to-list-view', {
        requires: true,
        action: function (app) {
            app.getWindow().setView('main');
        }
    });

    new Action('io.ox/calendar/actions/switch-to-month-view', {
        requires: true,
        action: function (app) {
            require(['io.ox/calendar/month/view'], function (view) {
                view.show(app);
            });
        }
    });

    // Links - toolbar

    new Dropdown('io.ox/calendar/links/toolbar', {
        id: 'view',
        index: 100,
        label: gt('View')
    });

    new Link('io.ox/calendar/links/toolbar/view', {
        id: 'list',
        index: 100,
        label: gt('List'),
        ref: 'io.ox/calendar/actions/switch-to-list-view'
    });

    new Link('io.ox/calendar/links/toolbar/view', {
        id: 'month',
        index: 200,
        label: gt('Month'),
        ref: 'io.ox/calendar/actions/switch-to-month-view'
    });

    window.ext = ext;
});
