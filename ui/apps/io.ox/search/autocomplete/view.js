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

define('io.ox/search/autocomplete/view', [
    'io.ox/search/autocomplete/extensions',
    'io.ox/core/extensions'
], function (extensions, ext) {

    'use strict';

    var POINT = 'io.ox/search/autocomplete';

    /**
     * search field
     * @id  io.ox/search/autocomplete/searchfield
     */
    ext.point(POINT + '/searchfield').extend({
        id: 'searchfield',
        index: 100,
        draw: extensions.searchfield
    });

    /**
     * search field
     * @id  io.ox/search/autocomplete/searchfield
     */
    ext.point(POINT + '/tokenfield').extend({
        id: 'tokenfield',
        index: 100,
        draw: extensions.tokenfield
    });

    /**
     * dropdown item: image
     * @id  io.ox/search/autocomplete/image
     */
    ext.point(POINT + '/item').extend({
        id: 'image',
        index: 100,
        draw: extensions.image
    });
    /**
     * dropdown item: name
     * @id  io.ox/search/autocomplete/name
     */
    ext.point(POINT + '/item').extend({
        id: 'name',
        index: 200,
        draw: extensions.name
    });

    /**
     * dropdown item: detail
     * @id  io.ox/search/autocomplete/detail
     */
    ext.point(POINT + '/item').extend({
        id: 'detail',
        index: 300,
        draw: extensions.detail
    });

    /**
     * dropdown item: detail
     * @id  io.ox/search/autocomplete/detail
     */
    ext.point(POINT + '/item').extend({
        index: 400,
        draw: extensions.a11y
    });

    /**
     * dropdown item: detail
     * @id  io.ox/search/autocomplete/detail
     */
    ext.point(POINT + '/handler/click').extend({
        id: 'default',
        index: 1000000000000,
        flow: extensions.select
    });

});
