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
define('io.ox/lessons/lessons/basic_extensions/register', ['io.ox/core/extensions'], function (ext) {
    "use strict";
    ext.point("io.ox/lessons/lesson").extend({
        id: 'basic_extensions',
        index: 500,
        title: 'Extensions and Extension Points',
        description: 'In which we will take a look at the extension point framework and add an action to the lessons module',
        section: 'Basics',
        start: function (options) {
            var win = options.win;
            
            win.nodes.main.empty().append($("<h1>").text("Basic Extensions"));
        }
    });
});