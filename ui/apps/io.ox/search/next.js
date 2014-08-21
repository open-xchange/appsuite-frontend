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

define('io.ox/search/next',
    ['io.ox/core/extensions'], function (ext) {

    'use strict';

    // field facet 'subject' only once
    ext.point('io.ox/search/api/autocomplete').extend({
        id: 'only-once',
        index: 300,
        customize: function (baton) {
            var whitelist = {
                    style: ['simple'],
                    id: ['contacts', 'contact', 'participant', 'participant']
                },
                filtered = [];

            //filter  facet
            _.each(baton.data, function (facet) {
                var style = _.contains(whitelist.style, facet.style),
                    id = _.contains(whitelist.id, facet.id);


                if (style || id)
                    filtered.push(facet);
                else
                    facet.flags.push('advanced');
            });
            //baton.data = filtered;

        }
    });

});
