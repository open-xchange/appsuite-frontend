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
define('io.ox/lessons/lessons/model_view/register', ['io.ox/core/extensions'], function (ext) {
    "use strict";
    ext.point("io.ox/lessons/lesson").extend({
        id: 'model_view',
        index: 500,
        title: 'On models and views',
        description: 'In which changes will be observed, validations run and data displayed many times',
        section: 'Architecture',
        start: function (options) {
            var win = options.win;
            require(["text!io.ox/lessons/lessons/model_view/lesson.html"], function (html) {
                var win = options.win;
                win.nodes.main.empty().append($(html));
                TOC.setUp(win.nodes.main);
                Editor.setUp(win.nodes.main);
            });
        }
    });
});