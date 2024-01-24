/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

/* global DocumentTouch */

/**
 * This lib is dependency free, do not use underscore or some
 * other lib here
 */

(function () {

    var us = {},
        ua,
        opera,
        webkit,
        chrome,
        firefox,
        edge,
        edgeChromium,
        phantom,
        safari,
        MacOS,
        Linux,
        Windows,
        Windows8,
        Blackberry,
        WindowsPhone,
        Android,
        iOS,
        standalone,
        uiwebview,
        chromeIOS,
        firefoxIOS,
        browserLC = {},
        isTouch,
        nativeNoopener,
        mainTab;

    // supported browsers
    us.browserSupport = {
        'Chrome':    74,
        'Safari':    11,
        'Firefox':   66,
        'IE':        11,
        'Edge':      12
    };

    us.platformSupport = {
        'Android':  4.4,
        'iOS':      11.0,
        'WindowsPhone': 99.0 // special case to exclude WindowsPhone as a mobile platform
    };

    // helpers
    function allFalsy(d) {
        for (var i in d) if (d[i]) return false;
        return true;
    }

    function memoize(func, hasher) {
        var memoize = function (key) {
            var cache = memoize.cache;
            var address = '' + (hasher ? hasher.apply(this, arguments) : key);
            if (!hasOwnProperty.call(cache || {}, address)) cache[address] = func.apply(this, arguments);
            return cache[address];
        };
        memoize.cache = {};
        return memoize;
    }

    function detectBrowser(nav) {
        var error = false;
        try {
            // browser detection - adopted from prototype.js
            ua = nav.userAgent;
            opera = ua.indexOf('OPR/') > -1;
            webkit = ua.indexOf('AppleWebKit/') > -1;
            chrome = ua.indexOf('Chrome/') > -1 && ua.indexOf('Edg/') === -1;
            firefox = ua.indexOf('Gecko') > -1 && ua.indexOf('Firefox') > -1 && ua.indexOf('KHTML') === -1;
            // TODO: This needs to be updated, if better user agent is available
            // http://dev.modern.ie/platform/faq/what-is-the-microsoft-edge-user-agent-st
            edge = ua.indexOf('Edge/') > -1;
            edgeChromium = ua.indexOf('Edg/') > -1;
            phantom = ua.indexOf('PhantomJS/') > -1;
            MacOS = ua.indexOf('Macintosh') > -1;
            Linux = ua.indexOf('Linux') > -1;
            Windows = ua.indexOf('Windows') > -1;
            Windows8 = ua.indexOf('Windows NT 6.3') > -1;
            Blackberry = (ua.indexOf('BB10') > -1 || ua.indexOf('RIM Tablet') > 1 || ua.indexOf('BlackBerry') > 1);
            WindowsPhone = ua.indexOf('Windows Phone') > -1;
            Android = (ua.indexOf('Android') > -1) ? ua.split('Android')[1].split(';')[0].trim() : undefined;

            iOS = (ua.match(/(iPad|iPhone|iPod)/i)) ? ua.split('like')[0].split('OS')[1].trim().replace(/_/g, '.') : undefined;
            // ios vs. chrome
            standalone = (('standalone' in nav) && nav.standalone) || (window.matchMedia('(display-mode: standalone)').matches);
            uiwebview = ua.indexOf('AppleWebKit/') > -1 && ua.indexOf('Mobile/11B508') > -1;
            chromeIOS = ua.indexOf('CriOS/') > -1;
            firefoxIOS = ua.indexOf('FxiOS/') > -1;

            safari = webkit && !Android && !chrome && !phantom && !uiwebview && !Blackberry && !chromeIOS && !firefoxIOS && !opera ?
                (standalone ? iOS : (ua.split('Version/')[1] ? ua.split('Version/')[1].split(' Safari')[0] : undefined)) : undefined;

            // special case for iPad on iOS 12.2+ due to the same user agent as macos. Checks for MacOS + Safari + !iPhone + touch
            if (MacOS && safari && !iOS && nav.maxTouchPoints === 5) {
                iOS = 12.2;
                MacOS = false;
            }

            // TODO: This needs to be updated, if better user agent is available
            // Edge is no Chrome, Webkit or Android.
            if (edge) {
                chrome = false;
                webkit = false;
                Android = false;
            }
            /*eslint no-nested-ternary: 0*/
            // add namespaces, just sugar
            us.browser = {
                /** is IE? */
                IE: edge
                    ? Number(ua.match(/Edge\/(\d+.\d)\d+$/)[1])
                    : (
                        nav.appName === 'Microsoft Internet Explorer'
                            ? Number(nav.appVersion.match(/MSIE (\d+\.\d+)/)[1])
                            : (!!nav.userAgent.match(/Trident/)
                                ? Number(nav.userAgent.match(/rv(:| )(\d+.\d+)/)[2])
                                : undefined)
                    ),
                /** is Edge browser? */
                Edge: edgeChromium ?
                    ua.split('Edg/')[1].split(' ')[0].split('.')[0]
                    : (edge ? Number(ua.match(/Edge\/(\d+.\d+)$/)[1]) : undefined),
                /** is Opera? */
                Opera: opera ? ua.split('OPR/')[1].split(' ')[0].split('.')[0] : undefined,
                /** is WebKit? */
                WebKit: webkit,
                /** Safari */
                Safari: safari,
                /** PhantomJS (needed for headless spec runner) */
                PhantomJS: webkit && phantom ?
                    ua.split('PhantomJS/')[1].split(' ')[0] : undefined,
                /** Chrome */
                Chrome: webkit && chrome && !iOS && !opera && !edgeChromium ?
                    ua.split('Chrome/')[1].split(' ')[0].split('.')[0] : undefined,
                /** is Edge chromium browser? */
                EdgeChromium: edgeChromium && webkit && !chrome && !iOS && !opera ?
                    ua.split('Edg/')[1].split(' ')[0].split('.')[0] : undefined,
                /** is Firefox? */
                Firefox: (firefox && !iOS && !Android) ? ua.split(/Firefox(\/| )/)[2].split('.')[0] : undefined,
                ChromeiOS: chromeIOS ? ua.split('CriOS/')[1].split(' ')[0].split('.')[0] : undefined,
                FirefoxiOS: firefoxIOS ? ua.split('FxiOS/')[1].split(' ')[0].split('.')[0] : undefined,
                FirefoxAndroid: (Android && firefox) ? ua.split(/Firefox(\/| )/)[2].split('.')[0] : undefined,
                UIWebView: uiwebview,
                /** OS **/
                Blackberry: Blackberry ?
                    ua.split('Version/')[1].split(' ')[0] : undefined,
                WindowsPhone: (WindowsPhone && (ua.indexOf('IEMobile') > -1 || ua.indexOf('Edge/') > -1)) ? ua.split('Windows Phone ')[1].split(';')[0] : undefined,
                iOS: iOS,
                MacOS: MacOS,
                Android: Android,
                Linux: Linux && !Android,
                Windows: Windows,
                Windows8: Windows8
            };

        } catch (e) {
            error = true;
            console.warn('Could not detect browser, using fallback');
            var browsers = 'IE Opera WebKit Safari PhantomJS Karma Chrome Firefox ChromeiOS UIWebView Blackberry WindowsPhone iOS MacOS Android Windows Windows8'.split(' ');
            // set to unknown browser
            us.browser = {
                unknown: true
            };
            // reset all other browsers
            for (var i = 0; i < browsers.length; i++) {
                us.browser[browsers[i]] = undefined;
            }
        } finally {
            // second fallback if all detecions were falsy
            if (!error && allFalsy(us.browser)) {
                console.warn('Could not detect browser, using fallback');
                us.browser.unknown = true;
            }
        }
        if (error) return;
        // fixes for testrunner
        us.browser.karma = !!window.__karma__;
        for (var key in us.browser) {
            var value = us.browser[key];
            // ensure version is a number, not a string
            // Only major versions will be kept
            // '7.2.3' will be 7.2
            // '6.0.1' will be 6
            if (typeof value === 'string') {
                value = value === '' ? true : parseFloat(value, 10);
                us.browser[key] = value;
            }
            key = key.toLowerCase();
            us.browser[key] = browserLC[key] = value;

        }

        return us.browser;

    }

    // first detection
    detectBrowser(navigator);

    function checkTouch() {
        var reportsTouch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
        // fix for Firefox and Chrome on Windows convertibles with touchscreen to keep features like d&d alive
        if ((us.browser.chrome || us.browser.firefox) && (us.browser.windows || us.browser.linux) && reportsTouch) {
            if (!us.browser.karma && window.console && window.console.info) console.info('Detected a desktop device with touchscreen. Touchevents will be disabled due to compatibility reasons.');
            return false;
        }
        return reportsTouch;
    }

    isTouch = checkTouch();

    // https://mathiasbynens.github.io/rel-noopener/
    nativeNoopener = us.browser.chrome >= 72 || us.browser.safari >= 13 || us.browser.EdgeChromium >= 72 || us.browser.firefox >= 66;

    // do media queries here
    // TODO define sizes to match pads and phones
    var queries = {
        small: '(max-width: 480px) and (orientation: portrait), (max-height: 480px) and (orientation: landscape)',
        medium: '(min-width: 481px) and (max-width: 1024px) and (orientation: portrait), (min-height: 481px) and (max-height: 1024px) and (orientation: landscape)',
        large: '(min-width: 1025px)',
        landscape: '(orientation: landscape)',
        portrait: '(orientation: portrait)',
        retina: 'only screen and (-webkit-min-device-pixel-ratio: 1.5), only screen and (min--moz-device-pixel-ratio: 1.5), only screen and (min-device-pixel-ratio: 1.5), only screen and (min-resolution: 2dppx)'
    };

    var display = {};

    function queryScreen() {
        for (var q in queries) {
            display[q] = matchMedia(queries[q]).matches;
        }
        if (display.large) {
            display.small = display.medium = false;
        } else if (display.medium) {
            display.small = false;
        }
    }

    queryScreen();

    function isSmartphone() {
        var android = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/),
            stockBrowser = android && android[1] < 537,
            ratio = stockBrowser ? (window.devicePixelRatio || 1) : 1,
            size = Math.min(screen.width / ratio, screen.height / ratio) < 540,
            razrHD = navigator.userAgent.indexOf('RAZR 4G') >= 0;

        return (size && isTouch && mobileOS) || razrHD;
    }

    var mobileOS = !!(us.browser.ios || us.browser.android || us.browser.blackberry || us.browser.windowsphone);
    // define devices as combination of screensize and OS
    display.smartphone = isSmartphone();
    display.tablet = display.medium && mobileOS; // maybe to fuzzy...
    // as there is no android desktop yet, this must be a tablet
    if (us.browser.android && display.large) display.tablet = true;
    display.desktop = !mobileOS;
    us.displayInfo = display;

    // main tab? (currently just detecting the opposite case)
    mainTab = location.href.indexOf('office?app') === -1;

    // extend underscore utilities
    var underscoreExtends = {

        detectBrowser: detectBrowser,

        // make this public so that it can be patched by UI plugins
        hasNativeEmoji: function () {
            var support = us.browser.ios > 5 || us.browser.Android > 4.1 || us.browser.Safari || window.cordova !== undefined;
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

            mobileOS = !!(us.browser.ios || us.browser.android || us.browser.blackberry || us.browser.windowsphone);
            // define devices as combination of screensize and OS
            display.smartphone = isSmartphone();
            display.tablet = display.medium && mobileOS; // maybe to fuzzy...
            display.desktop = !mobileOS;
            us.displayInfo = display;
        },

        // combination of browser & display
        device: memoize(function (condition) {
            // add support for language checks
            var misc = {}, locale = (ox.locale || 'en_US').toLowerCase();
            misc[locale] = true;
            misc[locale.split('_')[0] + '_*'] = true;
            misc.touch = isTouch;
            misc.noopener = nativeNoopener;
            misc.standalone = standalone;
            misc.emoji = underscoreExtends.hasNativeEmoji();
            misc.reload = (window.performance && window.performance.navigation.type === 1);
            misc.maintab = mainTab;
            // debug
            if (condition === 'debug' || condition === 1337) {
                // fallback to _.extend if Object.assign does not exist
                var assign = Object.assign || _.extend;
                return assign({}, browserLC, display, misc);
            }
            // true for undefined, null, empty string
            if (!condition) return true;
            // check condition
            condition = String(condition).replace(/[a-z_*]+/ig, function (match) {
                match = match.toLowerCase();
                return browserLC[match] || display[match] || misc[match];
            });
            try {
                /*eslint no-new-func: 0*/
                return new Function('return !!(' + condition + ')')();
            } catch (e) {
                console.error('_.device()', condition, e);
                return false;
            }
        })
    };

    underscoreExtends.device.loadUA = function (nav) {
        detectBrowser(nav);
        isTouch = checkTouch();
        underscoreExtends.recheckDevice();
        _.browser = us.browser;
    };

    // helper for browser support
    function isBrowserSupported() {
        var supported = false;
        for (var b in us.browserSupport) {
            if (us.browser[b] >= us.browserSupport[b]) {
                supported = true;
            }
        }
        return supported ||
            //support safari on ios if platform is supported
            !!(us.browser.iOS && us.browser.Safari && isPlatformSupported());
    }
    // helper for platform support
    function isPlatformSupported() {
        // be graceful and return true here as default
        var supported = true, checked = [];
        for (var b in us.platformSupport) {
            if (us.browser[b] && (us.browser[b] < us.platformSupport[b])) {
                supported = false;
                checked.push(b);
            }
        }
        // graceful degradation
        if (checked.length > 1) {
            console.info('Possible mismatch in platform check, using fallback', checked);
            supported = true;
        }
        return supported;
    }

    // global function
    window.isBrowserSupported = isBrowserSupported;
    window.isPlatformSupported = isPlatformSupported;

    // check if appsuite is present, otherwise use global scope
    if (window.ox !== undefined) {
        window._.extend(_, us);
        window._.mixin(underscoreExtends);
        $(window).on('resize.recheckDevice', _.recheckDevice);
    } else {
        window.browser = us;
    }
}());
