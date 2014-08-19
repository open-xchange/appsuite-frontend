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

    ext.point(POINT + '/searchfield').extend({
        id: 'searchfield',
        index: INDEX += 100,
        draw: extensions.searchfield
    });

    ext.point(POINT +  '/cancel-button').extend({
        id: 'cancel-button',
        index: INDEX += 100,
        draw: extensions.cancelButton
    });

    ext.point(POINT +  '/search-button').extend({
        id: 'search-button',
        index: INDEX += 100,
        draw: extensions.searchButton
    });

    ext.point(POINT +  '/style-container').extend({
        id: 'style-container',
        index: INDEX += 100,
        draw: extensions.styleContainer
    });

    ext.point(POINT +  '/item').extend({
        id: 'item',
        index: INDEX += 100,
        draw: extensions.item
    });

    ext.point(POINT + '/name').extend({
        id: 'name',
        index: INDEX += 100,
        draw: extensions.name
    });

    ext.point(POINT + '/detail').extend({
        id: 'detail',
        index: INDEX += 100,
        draw: extensions.detail
    });

    ext.point(POINT + '/image').extend({
        id: 'image',
        index: INDEX += 100,
        draw: extensions.image
    });

});
