/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */
/* global blankshield */
define('io.ox/core/boot/fixes', [], function () {

    //
    // add fake console (esp. for IE)
    //

    if (typeof window.console === 'undefined') {
        window.console = { log: $.noop, debug: $.noop, error: $.noop, warn: $.noop, info: $.noop };
    }

    //
    // Suppress context menu
    //

    var contextmenu_blacklist = [
        '.vgrid',
        '.foldertree-sidepanel',
        '.window-toolbar',
        '.io-ox-notifications',
        '.io-ox-inline-links',
        '.io-ox-action-link',
        '.widgets',
        'select',
        'button',
        'input[type=radio]',
        'input[type=checkbox]',
        '.btn',
        '.fa-search',
        '.contact-grid-index',
        '.file-icon .wrap',
        '.carousel'
    ];

    $(document).on('contextmenu', contextmenu_blacklist.join(', '), function (e) {
        if (ox.debug) { console.log('io.ox/core/boot/fixes prevent contextmenu!'); }
        e.preventDefault();
        return false;
    });

    // Prevent Content Spoofing
    // See: https://mathiasbynens.github.io/rel-noopener/
    // and: https://github.com/danielstjules/blankshield
    $(document).on('click', 'a[rel="noopener"], area[target="_blank"]', function (e) {
        if (_.device('noopener')) return;
        e.preventDefault();
        blankshield.open($(this).attr('href'));
    });

    // Prevent XSS due to quotes and backslashes in URLs
    var blankshield_open = blankshield.open;
    blankshield.open = function (url, name, features) {
        // url might already contain %-escapes, so can't just encode everything
        url = url.replace(/["\\]/g, encodeURI);
        return blankshield_open.call(blankshield, url, name, features);
    };

    //
    // Desktop fixes
    //

    if (_.device('firefox && windows')) {
        $('html').addClass('fix-spin');
    }

    //
    // Mobile fixes
    //

    // Orientation

    $(window).on('orientationchange', function () {
        // dismiss dropdown on rotation change due to positioning issues
        if (_.device('tablet')) $('body').trigger('click');
        // ios scroll fix; only fix if scrollTop is below 64 pixel
        // some apps like portal really scroll <body>
        if ($(window).scrollTop() > 64) return;
        _.defer(function () { $(window).scrollTop(0); });
    });

    // Touch

    if (_.device('touch')) {
        // disable tooltips for touch devices
        $.fn.tooltip = function () {
            return this;
        };
        Modernizr.touch = true;
    } else {
        Modernizr.touch = false;
        // make sure tooltips vanish if the reference node gets removed
        // same for popovers
        ['tooltip', 'popover'].forEach(function (name) {
            var original = $.fn[name];
            $.fn[name] = function () {
                $(this).on('dispose', onDispose(name));
                return original.apply($(this), arguments);
            };
        });
    }

    function onDispose(name) {
        // we use "hide" here; "destroy" sometimes provoke exceptions
        return function () { $(this)[name]('hide'); };
    }

    // add some device properties to <html>
    ['windows', 'macos', 'ios', 'android', 'touch', 'smartphone', 'retina', 'standalone'].forEach(function (property) {
        if (_.device(property)) $('html').addClass(property);
    });

    // ios8 ipad standalone fix (see bug 35087)
    if (_.device('standalone && ios >= 8') && navigator.userAgent.indexOf('iPad') > -1) {
        $('html').addClass('ios8-standalone-ipad-fix');
    }

    // Legacy chrome -> a) still relevant? b) can't we use device() for all checks?
    if (_.device('Android') && (_.browser.chrome === 18 || !_.browser.chrome)) {
        $('html').addClass('legacy-chrome');
    }

    // IE
    // so we can add browser specific css (currently only needed for IE)
    if (_.device('ie')) {
        $('html').addClass('internet-explorer');
        if (_.device('ie <= 11')) {
            $('html').addClass('ie11');
        }
    }

    //
    // Connection / Window State
    //

    $(window).on('online offline', function (e) {
        ox.trigger('connection:' + e.type);
    });

    // handle document visiblity
    $(window).on('blur focus', function (e) {
        ox.windowState = e.type === 'blur' ? 'background' : 'foreground';
    });

});
