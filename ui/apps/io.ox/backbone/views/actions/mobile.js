/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
                    // some detailview inline toolbars have a model attribute
                    if (baton.model) {
                        options.model = baton.model;
                    }
                    return options;
                })
                .$el
            );
        };
    }

    return util;
});
