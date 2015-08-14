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

define('io.ox/tours/utils', [
    'io.ox/core/extensions'
], function (ext) {

    'use strict';

    var switchToAppFunc = function (name, yielded) {
            if (typeof yielded === 'undefined') {
                return function (yielded) {
                    switchToApp(name, yielded);
                };
            }
            switchToApp(name, yielded);
        },

        switchToApp = function (name, yielded) {
            ox.load([name]).done(function (m) {
                m.getApp().launch().done(function () {
                    var that = this;
                    if (name === 'io.ox/calendar/edit/main') {
                        $(that).one('finishedCreating', yielded);//calendar needs some time to set up the view
                        that.create({});
                    } else if (name === 'io.ox/mail/write/main') {
                        that.compose({ subject: '[Guided tours] Example e-mail' });
                        yielded();
                    } else {
                        yielded();
                    }
                });
            });
        },

        tours = function () {
            var tours = {};
            ext.point('io.ox/tours/extensions').each(function (tourExtension) {
                var appId = tourExtension.app;
                if (!tours[appId] || tourExtension.priority > tours[appId].priority) {
                    tours[appId] = tourExtension.tour;
                    tours[appId].priority = tourExtension.priority;
                }
            });
            return tours;
        };

    return {
        switchToAppFunc: switchToAppFunc,
        switchToApp: switchToApp,
        tours: tours
    };
});
