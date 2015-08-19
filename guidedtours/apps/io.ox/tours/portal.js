/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/tours/portal', [
    'io.ox/core/tk/wizard',
    'gettext!io.ox/tours'
], function (Tour, gt) {

    'use strict';

    /* Tour: portal */
    Tour.registry.add({
        id: 'default/io.ox/portal',
        app: 'io.ox/portal',
        priority: 1
    }, function () {
        new Tour()
        .step()
            .title(gt('The Portal'))
            .content(gt('The Portal informs you about current E-Mails, appointments or social network news.'))
            .hotspot('.launcher[data-app-name="io.ox/portal"]')
            .end()
        .step()
            .title(gt('Reading the details'))
            .content(gt('To read the details, click on an entry in a square.'))
            .spotlight('.widget .item')
            .end()
        .step()
            .title(gt('Drag and drop'))
            .content(gt('To change the layout, drag a square\'s title to another position and drop it there.'))
            .spotlight('.widget:first')
            .end()
        .step()
            .title(gt('Closing a square'))
            .content(gt('If you no longer want to display a square, click the cross on the upper right side.'))
            .hotspot('.widget .disable-widget .fa-times:visible')
            .spotlight('.widget .disable-widget .fa-times:visible')
            .end()
        .step()
            .title(gt('Customizing the Portal'))
            .content(gt('To display a square again or to display further information sources, click on Customize this page.'))
            .spotlight('.header [data-action="customize"]')
            .hotspot('.header [data-action="customize"]')
            .end()
        .start();
    });
});
