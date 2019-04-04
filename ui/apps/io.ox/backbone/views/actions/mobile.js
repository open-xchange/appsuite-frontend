/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/views/actions/mobile', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/toolbar'
], function (ext, ToolbarView) {

    'use strict';

    var util = {

        addAction: function (point, meta, ids) {
            var index = 0;
            point = ext.point(point + '/links');
            _(ids).each(function (id) {
                point.extend(_.extend({ id: id, index: index += 100 }, meta[id]));
            });
        },

        createToolbarExtensions: function (points) {
            _(points).values().forEach(function (id) {
                ext.point(id).extend({
                    index: 100,
                    id: 'bottom-toolbar-actions',
                    draw: drawToolbar(id + '/links')
                });
            });
        }
    };

    function drawToolbar(point) {
        return function (baton) {
            this.append(
                new ToolbarView({ point: point, inline: true })
                .setSelection(baton.array(), function () {
                    var options = _(baton).pick('models', 'collection', 'allIds');
                    options.data = baton.array();
                    options.folder_id = null;
                    if (baton.app) {
                        options.app = baton.app;
                        options.folder_id = baton.app.folder.get();
                    }
                    return options;
                })
                .$el
            );
        };
    }

    return util;
});
