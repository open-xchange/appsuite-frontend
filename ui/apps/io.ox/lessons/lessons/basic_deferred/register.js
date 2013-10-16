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
define('io.ox/lessons/lessons/basic_deferred/register',
    ['io.ox/core/extensions',
     'io.ox/lessons/editor',
     'io.ox/lessons/toc'
    ], function (ext, Editor, TOC) {

    'use strict';

    ext.point('io.ox/lessons/lesson').extend({
        id: 'basic_deferred',
        index: 200,
        title: 'Deferred Objects',
        description: 'In which burgers will be ordered and the deferred objects pattern for asynchronous operations will be explored',
        section: 'Basics',
        start: function (options) {
            require(['text!io.ox/lessons/lessons/basic_deferred/lesson.html'], function (html) {
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
