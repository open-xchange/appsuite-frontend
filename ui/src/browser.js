 /**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

(function () {

    // supported browsers
    _.browserSupport = {
        'Chrome'    : 20,
        'Safari'    : 6,
        'Firefox'   : 10,
        'IE'        : 9,
        'Android'   : 4.1,
        'iOS'       : 6.0
    };

    var ua,
        isOpera,
        webkit,
        chrome,
        phantom,
        MacOS,
        Windows,
        Blackberry,
        WindowsPhone,
        Android,
        iOS,
        standalone,
        uiwebview,
        chromeIOS,
        unknown,
        browserLC = {};

    function detectBrowser (nav) {
        var error = false;
        try {
            // browser detection - adopted from prototype.js
            ua = nav.userAgent;
            isOpera = Object.prototype.toString.call(window.opera) === "[object Opera]";
            webkit = ua.indexOf('AppleWebKit/') > -1;
            chrome = ua.indexOf('Chrome/') > -1;
            phantom = ua.indexOf('PhantomJS/') > -1;
            MacOS = ua.indexOf('Macintosh') > -1;
            Windows = ua.indexOf('Windows') > -1;
            Blackberry = (ua.indexOf('BB10') > -1 || ua.indexOf('RIM Tablet') > 1 || ua.indexOf('BlackBerry') > 1);
            WindowsPhone = ua.indexOf('Windows Phone') > -1;
            Android = (ua.indexOf('Android') > -1) ? ua.split('Android')[1].split(';')[0].trim() : undefined;
            iOS = (ua.match(/(iPad|iPhone|iPod)/i)) ? ua.split('like')[0].split('OS')[1].trim().replace(/_/g,'.') : undefined;
            standalone = ("standalone" in nav) && nav.standalone;
            uiwebview = ua.indexOf('AppleWebKit/') > -1 && ua.indexOf('Mobile/11B508') > -1;
            chromeIOS = ua.indexOf('CriOS/') > -1;

            // add namespaces, just sugar
            _.browser = {
                /** is IE? */
                IE: nav.appName === "Microsoft Internet Explorer" ?
                    Number(nav.appVersion.match(/MSIE (\d+\.\d+)/)[1]) : (
                        !!nav.userAgent.match(/Trident/) ? Number(nav.userAgent.match(/rv(:| )(\d+.\d+)/)[2]) : undefined
                    ),
                /** is Opera? */
                Opera: isOpera ?
                    ua.split('Opera/')[1].split(' ')[0].split('.')[0] : undefined,
                /** is WebKit? */
                WebKit: webkit,
                /** Safari */
                Safari: !Android && webkit && !chrome && !phantom && !uiwebview ?
                    (standalone ? iOS : ua.split('Version/')[1].split(' Safari')[0]) : undefined,
                /** PhantomJS (needed for headless spec runner) */
                PhantomJS: webkit && phantom ?
                    ua.split('PhantomJS/')[1].split(' ')[0] : undefined,
                /* Karma runner */
                Karma: !!ox.testUtils,
                /** Chrome */
                Chrome: webkit && chrome ?
                    ua.split('Chrome/')[1].split(' ')[0].split('.')[0] : undefined,
                /** is Firefox? */
                Firefox: (ua.indexOf('Gecko') > -1 && ua.indexOf('Firefox') > -1 && ua.indexOf('KHTML') === -1) ?
                    ua.split(/Firefox(\/| )/)[2].split('.')[0] : undefined,
                ChromeiOS: chromeIOS,
                UIWebView: uiwebview,
                /** OS **/
                Blackberry: Blackberry ?
                    ua.split('Version/')[1].split(' ')[0] : undefined,
                WindowsPhone: (WindowsPhone && (ua.indexOf('IEMobile/10.0') > -1 )) ? true : undefined, // no version here yet
                iOS: iOS,
                MacOS: MacOS,
                Android : Android,
                Windows: Windows
            };

        } catch (e) {
            error = true;

            console.warn('Error while detecting browser, using fallback');
            var browsers = "IE Opera WebKit Safari PhantomJS Karma Chrome Firefox ChromeiOS UIWebView Blackberry WindowsPhone iOS MacOS Android Windows".split(' ');
            // set to unknown browser
            _.browser = {
                unknown: true
            };
            // reset all browsers
            _(browsers).each(function (b) {
                _.browser[b] = undefined;
            });
        } finally {
            // second fallback if all detecions were falsy
            if (!error && _.some(_.browser, function (v) {return !!v})) {
                console.warn('Error while detecting browser, using fallback');
                _.browser.unknown = true;
            }
        }

        _(_.browser).each(function (value, key) {
            // ensure version is a number, not a string
            // Only major versions will be kept
            // '7.2.3' will be 7.2
            // '6.0.1' will be 6
            if (_.isString(value)) {
                value = value === '' ? true : parseFloat(value, 10);
                _.browser[key] = value;
            }
            key = key.toLowerCase();
            _.browser[key] = browserLC[key] = value;
        });
    }

    detectBrowser(navigator);

    // do media queries here
    // TODO define sizes to match pads and phones
    var queries = {
        small: '(max-width: 480px)',
        medium: '(min-width: 481px) and (max-width: 1024px)',
        large: '(min-width: 1025px)',
        landscape: '(orientation: landscape)',
        portrait: '(orientation: portrait)',
        retina: 'only screen and (-webkit-min-device-pixel-ratio: 1.5), only screen and (-moz-min-device-pixel-ratio: 1.5), only screen and (min-device-pixel-ratio: 1.5), only screen and (min-resolution: 240dpi)'
    };

    var display = {};
    function queryScreen() {
        _(queries).each(function (query, key) {
            display[key] = Modernizr.mq(query);
        });
    };

    queryScreen();

    var mobileOS = !!(_.browser.ios || _.browser.android || _.browser.blackberry || _.browser.windowsphone);
    // define devices as combination of screensize and OS
    display.smartphone = display.small && mobileOS;
    display.tablet = display.medium && mobileOS; // maybe to fuzzy...
    display.desktop = !mobileOS;
    _.displayInfo = display;
    // extend underscore utilities
    _.mixin({

        // make this public so that it can be patched by UI plugins
        hasNativeEmoji: function () {
            var support = _.browser.ios > 5 || _.browser.Android > 4.1 || (_.browser.MacOS && _.browser.Safari);
            return support;
        },

        // returns current device size
        display: function () {
            if (display.small) return 'small';
            if (display.medium) return 'medium';
            return 'large';
        },

        /**
         * used to recheck the device properties
         * fix for a bug where device was checked too early (desktop was detected as small)
         * USE WITH CAUTION!
         * if _.device values are changed it might cause sideEffects
         */
        recheckDevice: function () {
            queryScreen();

            mobileOS = !!(_.browser.ios || _.browser.android || _.browser.blackberry || _.browser.windowsphone);
            // define devices as combination of screensize and OS
            display.smartphone = display.small && mobileOS;
            display.tablet = display.medium && mobileOS; // maybe to fuzzy...
            display.desktop = !mobileOS;
            _.displayInfo = display;
        },

        // combination of browser & display
        device: function (condition, debug) {
            // add support for language checks
            var misc = {}, lang = (ox.language || 'en_US').toLowerCase();
            misc[lang] = true;
            misc[lang.split('_')[0] + '_*'] = true;
            misc.touch = Modernizr.touch;
            misc.standalone = standalone;
            misc.emoji = _.hasNativeEmoji();
            // no arguments?s
            if (arguments.length === 0) {
                return _.extend({}, browserLC, display, misc);
            }
            // true for undefined, null, empty string
            if (!condition) return true;
            // check condition
            condition = String(condition || 'true').replace(/[a-z_*]+/ig, function (match) {
                match = match.toLowerCase();
                return browserLC[match] || display[match] || misc[match] || 'false';
            });
            if (debug) {
                console.debug(condition);
            }
            try {
                return new Function('return !!(' + condition + ')')();
            } catch (e) {
                console.error('_.device()', condition, e);
                return false;
            }
        }
    });
    _.device.loadUA = function (nav) {
        detectBrowser(nav);
        _.recheckDevice();
    };

    $(window).on('resize.recheckDevice', _.recheckDevice);

}());
