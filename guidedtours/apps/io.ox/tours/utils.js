/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
                        that.compose({ subject: '[Guided tours] Example email' });
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
        tours: tours,
        availableTours: function () {
            return _(tours()).keys();
        },
        isAvailable: function (tourname) {
            return _(_(tours()).keys()).contains(tourname);
        },
        get: function (tourname) {
            return tours()[tourname];
        }
    };
});
