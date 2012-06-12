/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

(function () {

    'use strict';

    function Template(ext) {

        var parts = {},
            plain = {},
            createDraw = function (id, extensionId, tmpl) {
                return function (context) {
                    var node = $(tmpl(context.data || context)).appendTo(this);
                    ext.point(id + '/' + extensionId).invoke('draw', node, context);
                };
            };

        this.addPart = function (id, html) {
            // look for extensions
            var fragment = $(html).filter(function () { return this.nodeType === 1; }),
                extensions = fragment.filter('extension');
            if (extensions.length > 0) {
                // create extensions
                extensions.each(function (index) {
                    var node = $(this), html = node.html(), extensionId = node.attr('id') || 'default';
                    ext.point(id).extend({
                        id: extensionId,
                        index: (index + 1) * 100,
                        draw: createDraw(id, extensionId, doT.template(html))
                    });
                });
            } else {
                // just plain template
                plain[id] = true;
                parts[id] = doT.template(html);
            }
        };

        this.render = function (id, data, node) {
            if (plain[id]) {
                return id in parts ? parts[id](data) : $();
            } else {
                node = node || $('<div>');
                ext.point(id).invoke('draw', node, data);
                return node;
            }
        };
    }

    define('dot', {
        load: function (name, parentRequire, loaded, config) {
            parentRequire(["text!" + name, 'io.ox/core/extensions'], function (html, ext) {
                // get template fragment - just elements, no comments, no text nodes
                var fragment = $(html).filter(function () { return this.nodeType === 1; }),
                    parts = fragment.filter('part'),
                    tmpl = new Template(ext);
                // just consider parts
                parts.each(function () {
                    var node = $(this), html = node.html(), id = node.attr('id') || 'default';
                    tmpl.addPart(id, html);
                });
                // test
                console.log('TEST #1', tmpl.render('scaffold', { a: 'YEAH' }));
                console.log('TEST #2', tmpl.render('io.ox/calendar/month', { a: 'YEAH' }));
                // done
                loaded(tmpl);
            });
        }
    });

}());

define('io.ox/calendar/month/view',
    ['io.ox/calendar/util',
     'io.ox/calendar/api',
     'gettext!io.ox/calendar/month/view',
     'dot!io.ox/calendar/month/template.html',
     'less!io.ox/calendar/month/style.css'], function (util, api, gt) {

    'use strict';

    return {

    };
});