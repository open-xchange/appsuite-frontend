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

define('io.ox/search/facets/view', [
    'io.ox/search/facets/extensions',
    'io.ox/core/extensions'
], function (extensions, ext) {

    'use strict';

    var INDEX = 100,
        POINT = 'io.ox/search/facets';

    ext.point(POINT + '/facets').extend({
        id: 'facets',
        index: INDEX += 100,
        draw: extensions.facets
    });

    /**
     * special: folder facet is hardcoded by front end
     */
    ext.point(POINT + '/item').extend({
        id: 'general',
        index: INDEX += 100,
        draw: extensions.item
    });

    /**
     * special: folder facet is hardcoded by front end
     */
    ext.point(POINT + '/item/folder').extend({
        id: 'folder-facet',
        index: INDEX += 100,
        draw: extensions.folderFacet
    });

    /**
     * presentation of facet type
     * @example: e.g. folder, time, contact
     */
    ext.point(POINT + '/facet-type').extend({
        id: 'facet-type',
        index: INDEX += 100,
        draw: extensions.facetType
    });

    /**
     * presentation of facet value name
     */
    ext.point(POINT + '/facet-name').extend({
        id: 'facet-name',
        index: INDEX += 100,
        draw: extensions.facetName
    });

    /**
     * presentation of remove action
     */
    ext.point(POINT + '/facet-remove').extend({
        id: 'facet-remove',
        index: INDEX += 100,
        draw: extensions.facetRemove
    });

    /**
     * attach drodown to quicky switch between facet value options
     * @example: e.g. time facet -> week, month, etc.
     */
    ext.point(POINT + '/facet-dropdown').extend({
        id: 'facet-dropdown',
        index: INDEX += 100,
        draw: extensions.facetDropdown
    });

    ext.point(POINT + '/options-handler').extend({
        id: 'options-handler',
        index: INDEX += 100,
        draw: extensions.optionsHandler
    });

});
