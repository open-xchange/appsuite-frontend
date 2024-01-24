/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/search/items/main', [
    'io.ox/search/items/collection',
    'io.ox/search/items/view'
], function (Collection, View) {

    'use strict';

    return {
        // init controller
        create: function () {
            var collection = new Collection(),
                view = new View({ collection: collection });

            // event listener
            collection.on('reset set', function () {
                collection.trigger('needs-redraw');
            });

            return _.extend(collection, {
                render: view.render,
                empty: function () {
                    delete this.timestamp;
                    if (this.length) {
                        this.reset();
                    }
                    return collection;
                }
            });

        }
    };

});
