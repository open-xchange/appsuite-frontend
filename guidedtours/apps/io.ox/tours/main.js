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
    'gettext!io.ox/tours'
], function (ext, notifications, Stage, gt) {

    'use strict';

    /* New stage: Starts a tour upon login (unless it was already seen in that particular version) */
    new Stage('io.ox/core/stages', {
        id: 'tours',
        index: 1000,
        run: function () {
            if (_.device('smartphone')) {//tablets are fine just disable phones
                return $.when();
            }

            ox.load(['settings!io.ox/tours']).done(function (tourSettings) {
                var disableTour = tourSettings.get('server/disableTours'),
                    startOnFirstLogin = tourSettings.get('server/startOnFirstLogin'),
                    tourVersion = tourSettings.get('server/version', 0),
                    tourVersionSeen = tourSettings.get('user/alreadySeenVersion', -1);

                if (!disableTour && startOnFirstLogin && tourVersion > tourVersionSeen) {
                    tourSettings.set('user/alreadySeenVersion', tourVersion).save();
                    require(['io.ox/core/tk/wizard', 'io.ox/tours/intro'], function (Tour) {
                        Tour.registry.run('default/io.ox/intro');
                    });
                }
            });
            return $.when();
        }
    });

    /* Link: Intro tour in settings toolbar */
    ext.point('io.ox/core/topbar/right/dropdown').extend({
        id: 'intro-tour',
        index: 210, /* close to the help link */
        draw: function () {
            var node = this,
                link = $('<li>', { 'class': 'io-ox-specificHelp' }).appendTo(node);

            if (_.device('smartphone')) {//tablets are fine just disable phones
                return;
            }

            require(['settings!io.ox/tours', 'io.ox/core/capabilities'], function (tourSettings, capabilities) {
                if (tourSettings.get('disableTours', false) || capabilities.has('!webmail || guest')) {
                    link.remove();
                    return;
                }

                link.append(
                    $('<a target="_blank" href="" role="menuitem">').text(
                        //#. Tour name; general introduction
                        gt('Getting started')
                    )
                    .on('click', function (e) {
                        e.preventDefault();
                        require(['io.ox/core/tk/wizard', 'io.ox/tours/intro'], function (Tour) {
                            Tour.registry.run('default/io.ox/intro');
                        });
                    })
                );
            });
        }
    });

    ext.point('io.ox/core/topbar/right/dropdown').sort();

    return {
        //DEPRECATED: legacy method. Don't use it in new code. Use the WTF instead.
        runTour: function (tourname) {
            require([
                'io.ox/tours/utils',
                'css!3rd.party/hopscotch/hopscotch.css',
                'apps/3rd.party/hopscotch/hopscotch-0.1.js'
            ]).done(function (utils) {
                var tour = utils.get(tourname),
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
