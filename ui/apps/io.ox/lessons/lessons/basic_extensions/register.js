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
define('io.ox/lessons/lessons/basic_extensions/register',
    ['io.ox/core/extensions',
     'io.ox/lessons/editor',
     'io.ox/lessons/toc'
    ], function (ext, Editor, TOC) {

    'use strict';

    ext.point('io.ox/lessons/lesson').extend({
        id: 'basic_extensions',
        index: 500,
        title: 'Extensions and Extension Points',
        description: 'In which we will take a look at the extension point framework and add an action to the lessons module',
        section: 'Basics',
        start: function (options) {
            require(['text!io.ox/lessons/lessons/basic_extensions/lesson.html'], function (html) {
                var win = options.win;

                win.nodes.main.empty().append($(html));
                TOC.setUp(win.nodes.main);
                Editor.setUp(win.nodes.main);



                (function () {
                    var floatingDiv = $('<div class="well"/>').css({
                        position: 'fixed',
                        top: $(window).height() / 2,
                        left: win.nodes.main.find('.navigation').offset().left,
                        width: '180px'
                    }),
                        point = ext.point('io.ox/lessons/floatingWidget');
                    win.nodes.main.find('.navigation').append(floatingDiv);

                    point.invoke('draw', floatingDiv);
                    point.on('extended', function () {
                        floatingDiv.empty();
                        point.invoke('draw', floatingDiv);
                    });

                }());
            });
        }
    });
});
