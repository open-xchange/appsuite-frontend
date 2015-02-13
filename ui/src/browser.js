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

    var us = {},
        ua,
        isOpera,
        webkit,
        chrome,
        phantom,
        MacOS,
        Windows,
        Windows8,
        Blackberry,
        WindowsPhone,
        Android,
        iOS,
        standalone,
        uiwebview,
        chromeIOS,
        browserLC = {},
        slice = Array.prototype.slice;

    // supported browsers
    us.browserSupport = {
        'Chrome'  :   37,
        'Safari'  :    7,
        'Firefox' :   32,
        'IE'      :   10,
        'Android' :  4.1,
        'iOS'     :  6.0
    };

    // helpers
    function allFalsy(d) {
        var allfalse = true;
        for (var i in d) {
            if (!!d[i]) {
                allfalse = false;
            }
        }
        return allfalse;
    }

    function extend() {
        var source = slice.call(arguments, 1);
        for (var i = 0; i < source.length; i++) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        }
        return obj;
    }
    /*
     * matchMedia() polyfill - test whether a CSS media type or media query applies
     * primary author: Scott Jehl
     * Copyright (c) 2010 Filament Group, Inc
     * MIT license
     * adapted by Paul Irish to use the matchMedia API
     * http://dev.w3.org/csswg/cssom-view/#dom-window-matchmedia
     * which webkit now supports: http://trac.webkit.org/changeset/72552
     *
     * Doesn't implement media.type as there's no way for crossbrowser property
     * getters. instead of media.type == 'tv' just use media.matchMedium('tv')
     */
    if (!(window.matchMedia)) {

        window.matchMedia = (function (doc, undefined) {

            var cache = {},
                docElem = doc.documentElement,
                fakeBody = doc.createElement('body'),
                testDiv = doc.createElement('div');

            testDiv.setAttribute('id', 'ejs-qtest');
            fakeBody.appendChild(testDiv);

            return function (q) {
                if (cache[q] === undefined) {
                    var styleBlock = doc.createElement('style'),
                        cssrule = '@media ' + q + ' { #ejs-qtest { position: absolute; } }';
                    //must set type for IE!
                    styleBlock.type = 'text/css';
                        if (styleBlock.styleSheet) {
                            styleBlock.styleSheet.cssText = cssrule;
                        }
                        else {
                            styleBlock.appendChild(doc.createTextNode(cssrule));
                        }
                    docElem.insertBefore(fakeBody, docElem.firstChild);
                    docElem.insertBefore(styleBlock, docElem.firstChild);
                    cache[q] = ((window.getComputedStyle ? window.getComputedStyle(testDiv,null) : testDiv.currentStyle).position == 'absolute');
                    docElem.removeChild(fakeBody);
                    docElem.removeChild(styleBlock);
                }
                return cache[q];
            };

        })(document);
    }

    function detectBrowser(nav) {
        var error = false;
        try {
            // browser detection - adopted from prototype.js
            ua = nav.userAgent;
            isOpera = Object.prototype.toString.call(window.opera) === '[object Opera]';
            webkit = ua.indexOf('AppleWebKit/') > -1;
            chrome = ua.indexOf('Chrome/') > -1;
            phantom = ua.indexOf('PhantomJS/') > -1;
            MacOS = ua.indexOf('Macintosh') > -1;
            Windows = ua.indexOf('Windows') > -1;
            Windows8 = ua.indexOf('Windows NT 6.3') > -1;
            Blackberry = (ua.indexOf('BB10') > -1 || ua.indexOf('RIM Tablet') > 1 || ua.indexOf('BlackBerry') > 1);
            WindowsPhone = ua.indexOf('Windows Phone') > -1;
            Android = (ua.indexOf('Android') > -1) ? ua.split('Android')[1].split(';')[0].trim() : undefined;
            iOS = (ua.match(/(iPad|iPhone|iPod)/i)) ? ua.split('like')[0].split('OS')[1].trim().replace(/_/g, '.') : undefined;
            standalone = ('standalone' in nav) && nav.standalone;
            uiwebview = ua.indexOf('AppleWebKit/') > -1 && ua.indexOf('Mobile/11B508') > -1;
            chromeIOS = ua.indexOf('CriOS/') > -1;

            // add namespaces, just sugar
            us.browser = {
                /** is IE? */
                IE: nav.appName === 'Microsoft Internet Explorer' ?
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
                WindowsPhone: (WindowsPhone && (ua.indexOf('IEMobile/10.0') > -1)) ? true : undefined, // no version here yet
                iOS: iOS,
                MacOS: MacOS,
                Android : Android,
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
            if (typeof(value) === 'string') {
                value = value === '' ? true : parseFloat(value, 10);
                us.browser[key] = value;
            }
            key = key.toLowerCase();
            us.browser[key] = browserLC[key] = value;

        }

        // fixes for Windows 8 Chrome
        // Windows 8 Chrome does report touch events which leads to
        // a wrong feature set (disabled stuff) as AppSuite thinks
        // this is a Smartphone or tablet without a mouse.
        if (us.browser.chrome && us.browser.windows8 && Modernizr.touch) {
            // overwrite Modernizr's touch property and remove html class
            Modernizr.touch = false;
            document.getElementsByTagName('html')[0].className = document.getElementsByTagName('html')[0].className.replace(/\btouch\b/,'');
        }
    }

    // first detection
    detectBrowser(navigator);

    // do media queries here
    // TODO define sizes to match pads and phones
    var queries = {
        small: '(max-width: 480px) and (orientation: portrait), (max-height: 480px) and (orientation: landscape)',
        medium: '(min-width: 481px) and (max-width: 1024px) and (orientation: portrait), (min-height: 481px) and (max-height: 1024px) and (orientation: landscape)',
        large: '(min-width: 1025px)',
        landscape: '(orientation: landscape)',
        portrait: '(orientation: portrait)',
        retina: 'only screen and (-webkit-min-device-pixel-ratio: 1.5), only screen and (-moz-min-device-pixel-ratio: 1.5), only screen and (min-device-pixel-ratio: 1.5), only screen and (min-resolution: 240dppx)'
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
        return Math.min(screen.width, screen.height) < 480 && mobileOS;
    }

    var mobileOS = !!(us.browser.ios || us.browser.android || us.browser.blackberry || us.browser.windowsphone);
    // define devices as combination of screensize and OS
    display.smartphone = isSmartphone();
    display.tablet = display.medium && mobileOS; // maybe to fuzzy...
    display.desktop = !mobileOS;
    us.displayInfo = display;
    // extend underscore utilities
    var underscoreExtends = {

        // make this public so that it can be patched by UI plugins
        hasNativeEmoji: function () {
            var support = us.browser.ios > 5 || us.browser.Android > 4.1 || (us.browser.MacOS && us.browser.Safari);
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
        device: function (condition, debug) {
            // add support for language checks
            var misc = {}, lang = (ox.language || 'en_US').toLowerCase();
            misc[lang] = true;
            misc[lang.split('_')[0] + '_*'] = true;
            misc.touch = (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
            misc.standalone = standalone;
            misc.emoji = underscoreExtends.hasNativeEmoji();
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
    };
    underscoreExtends.device.loadUA = function (nav) {
        detectBrowser(nav);
        underscoreExtends.recheckDevice();
        _.browser = us.browser;
    };

    // check for supported browser
    function isBrowserSupported() {
        var supp = false;
        for (var b in us.browserSupport) {
            if (us.browser[b] >= us.browserSupport[b]) {
                supp = true;
            }
        }
        return supp;
    }
    // global function
    window.isBrowserSupported = isBrowserSupported;

    // check if appsuite is present, otherwise use global scope
    if (window.ox !== undefined) {
        window._.extend(_, us);
        window._.mixin(underscoreExtends);
        $(window).on('resize.recheckDevice', _.recheckDevice);
    } else {
        window.browser = us;
    }
}());
