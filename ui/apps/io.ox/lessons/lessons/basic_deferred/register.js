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
define('io.ox/lessons/lessons/basic_deferred/register', ['io.ox/core/extensions', 'io.ox/lessons/editor', 'io.ox/lessons/toc'], function (ext, Editor, TOC) {
    "use strict";
    ext.point("io.ox/lessons/lesson").extend({
        id: 'basic_deferred',
        index: 200,
        title: 'Deferred Objects',
        description: 'In which burgers will be ordered and the deferred objects pattern for asynchronous operations will be explored',
        section: "Basics",
        start: function (options) {
            var win = options.win;
            
            require(["text!io.ox/lessons/lessons/basic_deferred/lesson.html"], function (html) {
                var win = options.win;
                
                win.nodes.main.empty().append($(html));
                TOC.setUp(win.nodes.main);
                Editor.setUp(win.nodes.main, {
                    contexts: {
                        delayedAjax: {
                            delayedAjax: function (options) {
                                var def = $.Deferred();
                                setTimeout(function () {
                                    $.ajax(options).done(def.resolve).fail(def.reject);

                                }, 2000);

                                return def;
                            }
                        }
                    }
                });
                
                win.idle();
            });
        }
    });
});