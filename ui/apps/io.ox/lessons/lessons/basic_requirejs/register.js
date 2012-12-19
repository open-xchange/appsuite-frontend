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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/lessons/lessons/basic_requirejs/register', ['io.ox/core/extensions', 'io.ox/lessons/editor', 'io.ox/lessons/toc', 'gettext!io.ox/lessons/lessons/basic_requirejs/lang'], function (ext, Editor, TOC, gt) {
    "use strict";
    // We need some sample translations
    gt('Hello');
    gt('Good morning');
    gt('Good evening');
    
    ext.point("io.ox/lessons/lesson").extend({
        id: 'basic_requirejs',
        index: 300,
        title: 'RequireJS',
        description: 'In which dependencies will be resolved',
        section: "Basics",
        start: function (options) {
            var win = options.win;
            require(["text!io.ox/lessons/lessons/basic_requirejs/lesson.html"], function (html) {
                var win = options.win;
                win.nodes.main.empty().append($(html));
                TOC.setUp(win.nodes.main);
                Editor.setUp(win.nodes.main);
            });
        }
    });
});