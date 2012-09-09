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
define('io.ox/lessons/lessons/basic_jquery/register', ['io.ox/core/extensions', 'ace/ace', 'ace/mode/javascript'], function (ext, ace, JavaScript) {
    "use strict";
    ext.point("io.ox/lessons/lesson").extend({
        id: 'basic_jquery',
        index: 100,
        title: 'Basic JQuery',
        description: 'In which DOM nodes will be selected and the JQuery API will be explored',
        section: 'Basics',
        start: function (options) {
            var win = options.win;
            
            win.nodes.main.empty().append($("<h1>").text("Basic JQuery"));
            
            var $editor = $("<div>").css({
                position: 'absolute',
                width: '500',
                height: '400',
                border: "1px solid black"
            }).appendTo(win.nodes.main);
            
            var editor = ace.edit($editor);
            
            editor.getSession().setMode(new JavaScript.Mode());
            editor.setTheme('ace/theme/eclipse');
        }
    });
});