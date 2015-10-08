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
