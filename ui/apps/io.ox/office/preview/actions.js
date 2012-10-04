/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/preview/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'gettext!io.ox/office/main'
    ], function (ext, links, gt) {

    'use strict';

    var // shortcuts for classes
        Action = links.Action,
        ButtonGroup = links.ButtonGroup,
        Button = links.Button;

    new Action('io.ox/office/preview/actions/first', {
        requires: true,
        action: function (app) {
            app.getPreview().firstPage();
        }
    });

    new Action('io.ox/office/preview/actions/previous', {
        requires: true,
        action: function (app) {
            app.getPreview().previousPage();
        }
    });

    new Action('io.ox/office/preview/actions/next', {
        requires: true,
        action: function (app) {
            app.getPreview().nextPage();
        }
    });

    new Action('io.ox/office/preview/actions/last', {
        requires: true,
        action: function (app) {
            app.getPreview().lastPage();
        }
    });

    new ButtonGroup('io.ox/office/preview/links/toolbar', {
        id: 'nav',
        index: 100
    });

    ext.point('io.ox/office/preview/links/toolbar/nav').extend(new Button({
        index: 100,
        id: 'first',
        label: gt('First'),
        cssClasses: 'btn btn-inverse',
        ref: 'io.ox/office/preview/actions/first'
    }));

    ext.point('io.ox/office/preview/links/toolbar/nav').extend(new Button({
        index: 200,
        id: 'previous',
        label: gt('Previous'),
        cssClasses: 'btn btn-inverse',
        ref: 'io.ox/office/preview/actions/previous'
    }));

    ext.point('io.ox/office/preview/links/toolbar/nav').extend(new Button({
        index: 300,
        id: 'next',
        label: gt('Next'),
        cssClasses: 'btn btn-inverse',
        ref: 'io.ox/office/preview/actions/next'
    }));

    ext.point('io.ox/office/preview/links/toolbar/nav').extend(new Button({
        index: 400,
        id: 'last',
        label: gt('Last'),
        cssClasses: 'btn btn-inverse',
        ref: 'io.ox/office/preview/actions/last'
    }));

});
