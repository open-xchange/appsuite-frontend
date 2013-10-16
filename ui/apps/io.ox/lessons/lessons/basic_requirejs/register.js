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
define('io.ox/lessons/lessons/basic_requirejs/register',
    ['io.ox/core/extensions',
     'io.ox/lessons/editor',
     'io.ox/lessons/toc',
     'gettext!io.ox/lessons/lessons/basic_requirejs/lang'
    ], function (ext, Editor, TOC, gt) {

    'use strict';
    // We need some sample translations
    gt('Hello');
    gt('Good morning');
    gt('Good evening');

    ext.point('io.ox/lessons/lesson').extend({
        id: 'basic_requirejs',
        index: 300,
        title: 'RequireJS',
        description: 'In which dependencies will be resolved',
        section: 'Basics',
        start: function (options) {
            require(['text!io.ox/lessons/lessons/basic_requirejs/lesson.html'], function (html) {
                var win = options.win;
                win.nodes.main.empty().append($(html));
                TOC.setUp(win.nodes.main);
                Editor.setUp(win.nodes.main);
            });
        }
    });
});
