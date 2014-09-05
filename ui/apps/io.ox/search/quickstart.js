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

define('io.ox/search/quickstart',
    ['io.ox/core/extensions',
     'io.ox/search/autocomplete/extensions'
    ], function (ext, extensions) {

    'use strict';


    return {

        run: function (win) {
            // reference ready deferred
            var def = win.facetedsearch.ready;

            require(['io.ox/search/main'], function (search) {
                // overwrite views focus method
                var view = _.extend(
                          search.getView(),
                          { focus: win.facetedsearch.focus }
                    ),
                    baton = view.getBaton();
                // register handler
                view.render();
                // add autocomplete and addional handler
                extensions.searchfieldLogic.call(win.nodes.facetedsearch.toolbar, baton);
                // add reference to window
                win.facetedsearch.view = view;
                // resolve win.facet
                def.resolve(win.facetedsearch.ready);
            });

            return def;
        }

    };
});
