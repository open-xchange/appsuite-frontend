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
define('io.ox/lessons/lessons/jslobs/register', ['io.ox/core/extensions'], function (ext) {
    "use strict";
    ext.point("io.ox/lessons/lesson").extend({
        id: 'jslobs',
        title: 'JSLobs',
        index: 400,
        description: 'In which simple configuration data will be saved persistently on the backend',
        section: 'HTTP-API',
        start: function (options) {
            var win = options.win;
            
            win.nodes.main.empty().append($("<h1>").text("Basic Apps"));
        }
    });
});