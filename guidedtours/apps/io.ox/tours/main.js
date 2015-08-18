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

define('io.ox/tours/main', [
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/core/extPatterns/stage',
    'io.ox/tours/utils',
    'gettext!io.ox/tours'
], function (ext, notifications, Stage, utils, gt) {

    'use strict';

    /* New stage: Starts a tour upon login (unless it was already seen in that particular version) */
    new Stage('io.ox/core/stages', {
        id: 'tours',
        index: 1000,
        run: function () {
            if (_.device('smartphone')) {//tablets are fine just disable phones
                return $.when();
            }

            ox.load(['io.ox/tours/main', 'settings!io.ox/tours']).done(function (tours, tourSettings) {
                var disableTour = tourSettings.get('server/disableTours'),
                    startOnFirstLogin = tourSettings.get('server/startOnFirstLogin'),
                    tourVersion = tourSettings.get('server/version', 0),
                    tourVersionSeen = tourSettings.get('user/alreadySeenVersion', -1);

                if (!disableTour && startOnFirstLogin && tourVersion > tourVersionSeen) {
                    tourSettings.set('user/alreadySeenVersion', tourVersion).save();
                    tours.runTour('io.ox/intro');
                }
            });
            return $.when();
        }
    });

    /* Link: Tour specifically for this app in settings toolbar */
    ext.point('io.ox/core/topbar/right/dropdown').extend({
        id: 'app-specific-tour',
        index: 220, /* close to the intro tour and the help link */
        draw: function () {
            var node = this,
                tourLink = $('<li>', { 'class': 'io-ox-specificHelp' }).appendTo(node);

            if (_.device('smartphone')) {
                tourLink.remove();
                return;
            }

            require(['settings!io.ox/tours', 'io.ox/tours/main'], function (tourSettings, thisIsStupid) {

                function toggleVisibility() {
                    var currentApp = ox.ui.App.getCurrentApp(),
                        currentType = currentApp ? currentApp.attributes.name : null,
                        isAvailable = currentType && thisIsStupid.isAvailable(currentType);

                    if (!isAvailable || tourSettings.get('disableTours', false) || tourSettings.get('disable/' + currentType, false)) {
                        tourLink.hide();
                    } else {
                        tourLink.show();
                    }
                }

                tourLink.append(
                    $('<a target="_blank" href="" role="menuitem">').text(gt('Guided tour for this app'))
                    .on('click', function (e) {
                        var currentApp = ox.ui.App.getCurrentApp(),
                            currentType = currentApp.attributes.name;

                        thisIsStupid.runTour(currentType);
                        e.preventDefault();
                    })
                );

                ox.ui.windowManager.on('window.show', toggleVisibility);
                toggleVisibility();
            });
        }
    });

    ext.point('io.ox/core/topbar/right/dropdown').sort();

    return {
        availableTours: function () {
            return _(utils.tours()).keys();
        },

        isAvailable: function (tourname) {
            return _(_(utils.tours()).keys()).contains(tourname);
        },

        get: function (tourname) {
            return utils.tours()[tourname];
        },

        getAll: function () {
            return utils.tours();
        },

        runTour: function (tourname) {
            require(['css!3rd.party/hopscotch/hopscotch.css', 'apps/3rd.party/hopscotch/hopscotch-0.1.js']).done(function () {
                var tour = utils.tours()[tourname],
                    hs = window.hopscotch;

                if (!tour) {
                    return;
                }
                tour.i18n = {
                    prevBtn: '<i class="fa fa-chevron-left">&nbsp;</i>',
                    nextBtn: '<i class="fa fa-chevron-right">&nbsp;</i>',
                    doneBtn: '<i class="fa fa-check">&nbsp;</i>'
                };

                //RESET
                hs.endTour(true);

                // ERROR HANDLING
                hs.registerHelper('error', function (arg) {
                    console.log('Tour error', arg);
                });

                tour.onEnd = function () { window.hopscotch.endTour(true); };
                tour.showPrevButton = true;
                tour.showNextButton = true;

                //GO!
                hs.startTour(tour);
            });
        }
    };

});
