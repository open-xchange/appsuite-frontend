/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/search/autocomplete/view',
    ['io.ox/search/autocomplete/extensions',
     'io.ox/core/extensions'
    ], function (extensions, ext) {

    'use strict';

    var INDEX = 100,
        POINT = 'io.ox/search/autocomplete';

    /**
     * search field
     * @id  io.ox/search/autocomplete/searchfield
     */
    ext.point(POINT + '/searchfield').extend({
        id: 'searchfield',
        index: INDEX += 100,
        draw: extensions.searchfield
    });

    /**
     * search field: cancel button
     * @id  io.ox/search/autocomplete/cancel-button'
     */
    ext.point(POINT + '/cancel-button').extend({
        id: 'cancel-button',
        index: INDEX += 100,
        draw: extensions.cancelButton
    });

    /**
     * search field: search button
     * @id  io.ox/search/autocomplete/search-button
     */
    ext.point(POINT + '/search-button').extend({
        id: 'search-button',
        index: INDEX += 100,
        draw: extensions.searchButton
    });

    /**
     * reset calculated style from autocomplete tk
     * @id  io.ox/search/autocomplete/style-container
     */
    ext.point(POINT + '/style-container').extend({
        id: 'style-container',
        index: INDEX += 100,
        draw: extensions.styleContainer
    });

    /**
     * dropdown item: default
     * @id  io.ox/search/autocomplete/item
     */
    ext.point(POINT + '/item').extend({
        id: 'item',
        index: INDEX += 100,
        draw: extensions.item
    });

    /**
     * dropdown item: special
     * @id  io.ox/search/autocomplete/item/[facet.id]
     */



    /**
     * dropdown item: name
     * @id  io.ox/search/autocomplete/name
     */
    ext.point(POINT + '/name').extend({
        id: 'name',
        index: INDEX += 100,
        draw: extensions.name
    });

    /**
     * dropdown item: detail
     * @id  io.ox/search/autocomplete/detail
     */
    ext.point(POINT + '/detail').extend({
        id: 'detail',
        index: INDEX += 100,
        draw: extensions.detail
    });

    /**
     * dropdown item: image
     * @id  io.ox/search/autocomplete/image
     */
    ext.point(POINT + '/image').extend({
        id: 'image',
        index: INDEX += 100,
        draw: extensions.image
    });

});
