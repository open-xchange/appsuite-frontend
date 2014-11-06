
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
 */

define('plugins/upsell/bubbles/main',
    ['io.ox/core/extPatterns/stage',
     'io.ox/core/extensions',
     'io.ox/core/date',
     'settings!plugins/upsell'
    ], function (Stage, ext, date, settings) {

    'use strict';

    var bubbleInterval,
        bubbleSettings = settings.get('bubbles'),
        bubbles = {},
        stopBubbling,
        startBubbling,
        showBubble,
        initBubbles;

    if (_(bubbleSettings).isEmpty()) {
        console.error('The upsell bubbles app does not work without settings for plugins/upsell//bubbles.');
        return;
    }

    stopBubbling = function () {
        clearInterval(bubbleInterval);
    };

    startBubbling = function () {
        //show on first login ever?
        var skipFirstLogin = bubbleSettings.skipFirstLogin,
            //every how many logins does this appear?
            repeatPerLogins = bubbleSettings.repeatPerLogins,
            //after login in, how often does it appear?
            repeatInMilliseconds = bubbleSettings.repeatInMilliseconds,
            //TODO: determine from user settings
            showBubblesDuringThisLogin = repeatPerLogins === 1 ? true : false || skipFirstLogin;

        if (!showBubblesDuringThisLogin) {
            return;
        }

        initBubbles();

        bubbleInterval = setInterval(showBubble, repeatInMilliseconds);
    };

    showBubble = function () {
        require(['apps/3rd.party/hopscotch/hopscotch-0.1.js', 'css!3rd.party/hopscotch/hopscotch.css']).done(function () {
            var calloutMgr = window.hopscotch.getCalloutManager(),
                currentApp = ox.ui.App.getCurrentApp(),
                currentType = currentApp.attributes.name;

            if (_(bubbles).isEmpty()) {
                calloutMgr.removeAllCallouts();
                initBubbles();
            }

            if (bubbles[currentType]) {
                var callout;
                calloutMgr.removeCallout(currentType);
                //yes, createCallout not only creates but instantly renders this in hopscotch 0.1, as opposed to what the documentation says
                callout = calloutMgr.createCallout(bubbles[currentType]);

                $(callout.containerEl).on('click', function (e) {
                    if ($(e.target).hasClass('hopscotch-bubble-close')) {
                        return;
                    }
                    require(['io.ox/wizards/upsell'], function (wiz) {
                        var def = $.Deferred();
                        wiz.getInstance().start({cssClass: 'upsell-wizard-container'})
                            .done(function () {})
                            .fail(def.reject);
                    });
                });

            } else {
                console.error('Tried loading an upsell bubble for %s, but there was none', currentType);
            }
        });
    };

    initBubbles = function () {
        var languages, foam, bubbleKeys;

        if (!bubbleSettings.bubbles || _(bubbleSettings.bubbles).isEmpty()) {
            console.error('No upsell bubbles present', bubbleSettings);
            return;
        }

        languages = _(bubbleSettings.bubbles).keys();
        foam = _(languages).contains(ox.language) ? bubbleSettings.bubbles[ox.language] : bubbleSettings.bubbles[languages[0]];

        bubbleKeys = _(foam).keys().sort();
        _(bubbleKeys).each(function (key) {
            var bubble = foam[key],
                startDate = bubble.startDate,
                endDate = bubble.endDate,
                now = new Date().getTime();

            if (startDate && Date.parse(startDate) >  now) {
                return;
            }
            if (endDate && Date.parse(endDate) <  now) {
                return;
            }

            bubbles[bubble.app] = {
                target: function () { return $('.launcher[data-app-name="' + bubble.app + '"]')[0]; },
                zIndex: 1024,
                placement: 'bottom',
                id: bubble.app,
                content: bubble.content,
            };
        });
    };

    new Stage('io.ox/core/stages', {
        id: 'upsellbubbles',
        index: 1001,
        run: function (baton) {
            if (!bubbleSettings || _.isEmpty(bubbleSettings)) {
                console.info('Upsell bubbles are not configured. Booh!');
                return;
            }

            startBubbling(baton);
            return $.when();
        }
    });

    return {
        startBubbling: startBubbling,

        stopBubbling: stopBubbling,

        initBubbles: initBubbles,

        showBubble: showBubble
    };
});
