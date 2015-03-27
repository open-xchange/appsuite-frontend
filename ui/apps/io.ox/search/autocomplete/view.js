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
    ext.point(POINT + '/searchfield-mobile').extend({
        id: 'searchfield-mobile',
        index: 100,
        draw: extensions.searchfieldMobile
    });

    /**
     * reset calculated style from autocomplete tk
     * @id  io.ox/search/autocomplete/style-container
     */
    ext.point(POINT + '/style-container').extend({
        id: 'style-container',
        index: 100,
        draw: extensions.styleContainer
    });

    /**
     * dropdown item: default
     * @id  io.ox/search/autocomplete/item
     */
    ext.point(POINT + '/item').extend({
        id: 'item',
        index: 100,
        draw: extensions.item
    });

    /**
     * dropdown item: special
     * @id  io.ox/search/autocomplete/item/[facet.id]
     */
    // called via ext.point(POINT + '/item')

    /**
     * dropdown item: name
     * @id  io.ox/search/autocomplete/name
     */
    ext.point(POINT + '/name').extend({
        id: 'name',
        index: 100,
        draw: extensions.name
    });

    /**
     * dropdown item: detail
     * @id  io.ox/search/autocomplete/detail
     */
    ext.point(POINT + '/detail').extend({
        id: 'detail',
        index: 100,
        draw: extensions.detail
    });

    /**
     * dropdown item: detail
     * @id  io.ox/search/autocomplete/detail
     */
    ext.point(POINT + '/a11y').extend({
        index: 100,
        draw: extensions.a11y
    });

    /**
     * dropdown item: image
     * @id  io.ox/search/autocomplete/image
     */
    ext.point(POINT + '/image').extend({
        id: 'image',
        index: 100,
        draw: extensions.image
    });

});
