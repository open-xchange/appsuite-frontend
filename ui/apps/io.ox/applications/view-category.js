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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/applications/view-category',
    ['io.ox/core/api/apps', 'io.ox/applications/view-common'], function (api, view) {

    'use strict';

    return {

        draw: function (context) {

            var node = $('<div>')
                .addClass('category-' + context.id)
                .append(
                    $('<div>').addClass('clear-title')
                    .text(context.title + '')
                );

            var apps = $('<div>').addClass('apps');

            _(api.getByCategory(context.id)).each(function (data) {
                apps.append(view.drawApp(data, context));
            });

            node.children().eq(0).after(apps);

            return node;
        }
    };
});