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
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/tours/utils',
    'gettext!io.ox/tours'
], function (ext, notifications, utils, gt) {

    'use strict';

    /* Tour: portal */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/portal',
        app: 'io.ox/portal',
        priority: 1,
        tour: {
            id: 'Portal',
            steps: [{
                onShowDeferred: utils.switchToAppFunc('io.ox/portal/main'),
                title: gt('The Portal'),
                placement: 'bottom',
                target: function () { return $('.launcher[data-app-name="io.ox/portal"]')[0]; },
                content: gt('The Portal informs you about current E-Mails, appointments or social network news.')
            },
            {
                title: gt('Reading the details'),
                placement: 'bottom',
                target: function () { return $('.widget .item:visible')[0]; },
                content: gt('To read the details, click on an entry in a square.')
            },
            {
                title: gt('Drag and drop'),
                placement: 'right',
                target: function () {
                    if (_.device('desktop')) {//skip this step on tablets (no target does the trick)
                        return $('.widget:visible')[0];
                    } else {
                        return null;
                    }
                },
                content: gt('To change the layout, drag a square\'s title to another position and drop it there.')
            },
            {
                title: gt('Closing a square'),
                placement: 'bottom',
                target: function () { return $('.widget .disable-widget .fa-times:visible')[0]; },
                content: gt('If you no longer want to display a square, click the cross on the upper right side.'),
                xOffset: -10,
                arrowOffset: 1
            },
            {
                title: gt('Customizing the Portal'),
                placement: 'left',
                target: function () { return $('.header [data-action="customize"]')[0]; },
                content: gt('To display a square again or to display further information sources, click on Customize this page.'),
                yOffset: -10,
                arrowOffset: 1
            }]
        }
    });
});
