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

define('io.ox/search/facets/view',
    ['io.ox/search/facets/extensions',
     'io.ox/core/extensions'
    ], function (extensions, ext) {

    'use strict';

    var INDEX = 100,
        POINT = 'io.ox/search/facets';

    ext.point(POINT + '/applications').extend({
        id: 'applications',
        index: INDEX += 100,
        draw: extensions.applications
    });

    ext.point(POINT + '/facets').extend({
        id: 'facets',
        index: INDEX += 100,
        draw: extensions.facets
    });

    ext.point(POINT + '/options-handler').extend({
        id: 'options-handler',
        index: INDEX += 100,
        draw: extensions.optionsHandler
    });


    //static folder facet

    ext.point(POINT + '/folder-facet').extend({
        id: 'folder-facet',
        index: INDEX += 100,
        draw: extensions.folderFacet
    });

    //server side facets

    ext.point(POINT + '/facet-type').extend({
        id: 'facet-type',
        index: INDEX += 100,
        draw: extensions.facetType
    });

    ext.point(POINT + '/facet-name').extend({
        id: 'facet-name',
        index: INDEX += 100,
        draw: extensions.facetName
    });

    ext.point(POINT + '/facet-remove').extend({
        id: 'facet-remove',
        index: INDEX += 100,
        draw: extensions.facetRemove
    });

    ext.point(POINT + '/facet-dropdown').extend({
        id: 'facet-dropdown',
        index: INDEX += 100,
        draw: extensions.facetDropdown
    });


});
