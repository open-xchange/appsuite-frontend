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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('fixture', {
    load: function (name, parentRequire, load, config) {
        if (name.substr(-5, 5) === '.json') {
            return $.getJSON('/base/spec/fixtures/' + name).then(
                load,
                function fail() {
                    // this simple line might save life time
                    console.log('Cannot load/parse fixture', name, arguments);
                    load.error.apply(load, arguments);
                }
            );
        }
        if (name.substr(-4, 4) === '.txt') {
            return $.get('/base/spec/fixtures/' + name).then(load, load.error);
        }
        return require(['/base/spec/fixtures/' + name], load, load.error);
    }
});
