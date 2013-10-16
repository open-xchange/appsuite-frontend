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
define('io.ox/lessons/lessons/basic_apps/register', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    ext.point('io.ox/lessons/lesson').extend({
        id: 'basic_apps',
        index: 400,
        title: 'Basic Apps',
        description: 'In which a simple app will be written and app boilerplate explored',
        section: 'Basics',
        start: function (options) {
            var win = options.win;

            win.nodes.main.empty().append($('<h1>').text('Basic Apps'));
        }
    });
});
