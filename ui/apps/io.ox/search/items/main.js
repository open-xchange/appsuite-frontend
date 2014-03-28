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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/search/items/main',
        ['io.ox/search/items/model',
         'io.ox/search/items/collection',
         'io.ox/search/items/view-template',
         'io.ox/search/items/view-detail-template',
         'less!io.ox/search/items/style'], function (Model, Collection) {

    'use strict';

    return {
        Model: Model,
        Collection: Collection
    };

});
