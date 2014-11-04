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
                    if (this.length)
                        this.reset();
                    return collection;
                }
            });

        }
    };

});
