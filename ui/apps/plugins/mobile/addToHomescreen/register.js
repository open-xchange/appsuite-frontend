/*!
 * Add to Homescreen v2.0.7 ~ Copyright (c) 2013 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 *
 * This version was patched by OX to work with require and the App Suite context
 *
 */

define('plugins/mobile/addToHomescreen/register', [
    'io.ox/core/extensions',
    'gettext!plugins/mobile/addToHomescreen/i18n',
    'css!plugins/mobile/addToHomescreen/style.css'
], function (ext, gt) {

    'use strict';

    if (ox.debug || _.browser.ios >= 7) return;

    var nav = window.navigator,
        isIDevice = _.device('iOS'),
        isIPad = false,
        isRetina = false,
        isSafari,
        isStandalone,
        OSVersion = 6,
        startX = 0,
        startY = 0,
        balloon,
        overrideChecks,

        positionInterval,
        closeTimeout,
        // data saved in cookie
        meta = {
            d: Date.now(),
            n: 0
        },

        // most options need to be fixed, removed some of them
        options = {
            cookieName: 'ath',          // Name for the cookie, keep short to keep size small
            cookieLifetime: 30,         // Lifetime for the cookie
            daysUntilNextReminder: 30,  // days after userwill be reminded regardless if you had dismissed the dialog before
            numberOfTimesDimissed: 2,   // Dismiss the dialog this often to avoid poping it up again
            animationIn: 'drop',        // drop || bubble || fade
            animationOut: 'fade',       // drop || bubble || fade
            startDelay: 2000,           // seconds from page load before the balloon appears
            lifespan: 10000,            // milliseconds before it is automatically destroyed
            bottomOffset: 14,           // Distance of the balloon from bottom
            expire: 0,                  // Minutes to wait before showing the popup again (0 = always displayed)
            message: '',                // Customize your message
            touchIcon: true,            // Display the touch icon
            arrow: true,                // Display the balloon arrow
            closeButton: true,          // Let the user close the balloon
            iterations: 100             // Internal/debug use
        };

    // needed to tell if iPhone or iPad
    function getPlatform() {
        return nav.platform.split(' ')[0];
    }

    function init() {
        // no iDevice? go away!
        if (!isIDevice) return;

        // message for bubble, inject icon and html
        options.message = function () {
            return (
                //#. %1$s is the name of the platform
                //#. %2$s is an the "add to home" icon
                //#. %3$s and %4$s are markers for bold text.
                //#. The words "Home Screen" may not be translated or should match the
                //#. string used on an iPhone using the "add to homescreen" function for weblinks
                gt('Install this web app on your %1$s: Tap %2$s and then %3$s\'Add to Home Screen\'%4$s',
                    getPlatform(), '<span class="addToHomeShare"></span>', '<strong>', '</strong>'));
        };

        var c = _.getCookie(options.cookieName);
        if (c) {
            meta = JSON.parse(c);
        }
        isIPad = _.device('ios && medium');
        isRetina = _.device('retina');
        isSafari = _.device('safari');
        OSVersion = _.browser.ios;
        isStandalone = nav.standalone || false;
        // test for cookie presence
        if (!isStandalone) {
            if (c) {
                if ((Date.now() - meta.d) > (24 * 60 * 60 * 1000) || meta.n < options.numberOfTimesDimissed) {
                    loaded();
                }
            } else {
                // no cookie, first run
                loaded();
            }
        }

    }

    function loaded() {

        var touchIcon = '';

        balloon = document.createElement('div');
        balloon.id = 'addToHomeScreen';
        balloon.style.cssText += 'left:-9999px;-webkit-transition-property:-webkit-transform,opacity;-webkit-transition-duration:0;-webkit-transform:translate3d(0,0,0);position:' + (OSVersion < 5 ? 'absolute' : 'fixed');

        if (options.touchIcon) {
            touchIcon = isRetina ?
                document.querySelector('head link[rel^=apple-touch-icon][sizes="114x114"],head link[rel^=apple-touch-icon][sizes="144x144"]') :
                document.querySelector('head link[rel^=apple-touch-icon][sizes="57x57"],head link[rel^=apple-touch-icon]');
            if (touchIcon) {
                touchIcon = '<span style="background-image:url(' + touchIcon.href + ')" class="addToHomeTouchIcon"></span>';
            }
        }
        balloon.className = (isIPad ? 'addToHomeIpad' : 'addToHomeIphone') + (touchIcon ? ' addToHomeWide' : '');
        updateLanguage();
        function updateLanguage() {
            balloon.innerHTML = touchIcon +
                options.message() + (options.arrow ? '<span class="addToHomeArrow"></span>' : '') + (options.closeButton ? '<span class="addToHomeClose">\u00D7</span>' : '');
        }
        ox.on('language', updateLanguage);

        document.body.appendChild(balloon);

        // Add the close action
        if (options.closeButton) {
            balloon.addEventListener('click', clicked, false);
        }
        if (!isIPad && OSVersion >= 6) {
            window.addEventListener('orientationchange', orientationCheck, false);
        }
        _.setCookie(options.cookieName, JSON.stringify(meta), options.cookieLifetime * 24 * 60 * 60 * 1000);

        setTimeout(function () {
            ext.point('io.ox/mobile/addToHomescreen').invoke('draw', this);
        }, options.startDelay);
    }

    ext.point('io.ox/mobile/addToHomescreen').extend({
        index: 200,
        id: 'show',
        draw: function () {
            var duration,
            iPadXShift = 208;

            // Set the initial position
            if (isIPad) {
                if (OSVersion < 5) {
                    startY = window.scrollY;
                    startX = window.scrollX;
                } else if (OSVersion < 6) {
                    iPadXShift = 160;
                }

                balloon.style.top = startY + options.bottomOffset + 'px';
                balloon.style.left = startX + iPadXShift - Math.round(balloon.offsetWidth / 2) + 'px';

                switch (options.animationIn) {

                case 'drop':
                    duration = '0.6s';
                    balloon.style.webkitTransform = 'translate3d(0,' + -(window.scrollY + options.bottomOffset + balloon.offsetHeight) + 'px,0)';
                    break;
                case 'bubble':
                    duration = '0.6s';
                    balloon.style.opacity = '0';
                    balloon.style.webkitTransform = 'translate3d(0,' + (startY + 50) + 'px,0)';
                    break;
                default:
                    duration = '1s';
                    balloon.style.opacity = '0';
                }
            } else {
                startY = window.innerHeight + window.scrollY;

                if (OSVersion < 5) {
                    startX = Math.round((window.innerWidth - balloon.offsetWidth) / 2) + window.scrollX;
                    balloon.style.left = startX + 'px';
                    balloon.style.top = startY - balloon.offsetHeight - options.bottomOffset + 'px';
                } else {
                    balloon.style.left = '50%';
                    balloon.style.marginLeft = -Math.round(balloon.offsetWidth / 2) - (window.orientation % 180 && OSVersion >= 6 ? 40 : 0) + 'px';
                    balloon.style.bottom = options.bottomOffset + 'px';
                }

                switch (options.animationIn) {
                case 'drop':
                    duration = '1s';
                    balloon.style.webkitTransform = 'translate3d(0,' + -(startY + options.bottomOffset) + 'px,0)';
                    break;
                case 'bubble':
                    duration = '0.6s';
                    balloon.style.webkitTransform = 'translate3d(0,' + (balloon.offsetHeight + options.bottomOffset + 50) + 'px,0)';
                    break;
                default:
                    duration = '1s';
                    balloon.style.opacity = '0';
                }
            }

            // repaint trick
            var unused = balloon.offsetHeight;
            unused = null;
            balloon.style.webkitTransitionDuration = duration;
            balloon.style.opacity = '1';
            balloon.style.webkitTransform = 'translate3d(0,0,0)';
            balloon.addEventListener('webkitTransitionEnd', transitionEnd, false);

            closeTimeout = setTimeout(close, options.lifespan);
        }
    });

    function manualShow(override) {
        if (!isIDevice || balloon) return;

        overrideChecks = override;
        loaded();
    }

    function close() {
        clearInterval(positionInterval);
        clearTimeout(closeTimeout);
        closeTimeout = null;

        // check if the popup is displayed and prevent errors
        if (!balloon) return;

        var posY = 0,
            posX = 0,
            opacity = '1',
            duration = '0';

        if (options.closeButton) {
            balloon.removeEventListener('click', clicked, false);
        }
        if (!isIPad && OSVersion >= 6) {
            window.removeEventListener('orientationchange', orientationCheck, false);
        }

        if (OSVersion < 5) {
            posY = isIPad ? window.scrollY - startY : window.scrollY + window.innerHeight - startY;
            posX = isIPad ? window.scrollX - startX : window.scrollX + Math.round((window.innerWidth - balloon.offsetWidth) / 2) - startX;
        }

        balloon.style.webkitTransitionProperty = '-webkit-transform,opacity';

        switch (options.animationOut) {
        case 'drop':
            if (isIPad) {
                duration = '0.4s';
                opacity = '0';
                posY += 50;
            } else {
                duration = '0.6s';
                posY += balloon.offsetHeight + options.bottomOffset + 50;
            }
            break;
        case 'bubble':
            if (isIPad) {
                duration = '0.8s';
                posY -= balloon.offsetHeight + options.bottomOffset + 50;
            } else {
                duration = '0.4s';
                opacity = '0';
                posY -= 50;
            }
            break;
        default:
            duration = '0.8s';
            opacity = '0';
        }

        balloon.addEventListener('webkitTransitionEnd', transitionEnd, false);
        balloon.style.opacity = opacity;
        balloon.style.webkitTransitionDuration = duration;
        balloon.style.webkitTransform = 'translate3d(' + posX + 'px,' + posY + 'px,0)';
    }

    function clicked() {
        // increment dismiss counter and safe it
        meta.n++;
        _.setCookie(options.cookieName, JSON.stringify(meta), options.cookieLifetime * 24 * 60 * 60 * 1000);
        close();
    }

    function transitionEnd() {
        balloon.removeEventListener('webkitTransitionEnd', transitionEnd, false);

        balloon.style.webkitTransitionProperty = '-webkit-transform';
        balloon.style.webkitTransitionDuration = '0.2s';

        // We reached the end!
        if (!closeTimeout) {
            balloon.parentNode.removeChild(balloon);
            balloon = null;
            return;
        }

        // On iOS 4 we start checking the element position
        if (OSVersion < 5 && closeTimeout) {
            positionInterval = setInterval(setPosition, options.iterations);
        }
    }

    function setPosition() {
        var matrix = new window.WebKitCSSMatrix(window.getComputedStyle(balloon, null).webkitTransform),
            posY = isIPad ? window.scrollY - startY : window.scrollY + window.innerHeight - startY,
            posX = isIPad ? window.scrollX - startX : window.scrollX + Math.round((window.innerWidth - balloon.offsetWidth) / 2) - startX;

        // Screen didn't move
        if (posY === matrix.m42 && posX === matrix.m41) return;

        balloon.style.webkitTransform = 'translate3d(' + posX + 'px,' + posY + 'px,0)';
    }

    // Clear local and session storages (this is useful primarily in development)
    function reset() {
        _.setCookie(options.cookieName, '', new Date(0).toGMTString());
    }

    function orientationCheck() {
        balloon.style.marginLeft = -Math.round(balloon.offsetWidth / 2) - (window.orientation % 180 && OSVersion >= 6 ? 40 : 0) + 'px';
    }

    ext.point('io.ox/mobile/addToHomeScreen').extend({
        index: 100,
        id: 'init',
        init: function () {
            init();
        }
    });

    ext.point('io.ox/mobile/addToHomeScreen').invoke('init', this);

    return {
        show: manualShow,
        close: close,
        reset: reset
    };

});
