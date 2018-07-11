/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * @author Greg Hill <greg.hill@open-xchange.com>
 *
 * Copyright (C) 2016-2020 OX Software GmbH
 */
define('io.ox/multifactor/util', [
    'io.ox/core/http'
], function (http) {

    'use strict';

    var util = {
        checkMultifactor: function (themes) {
            var def = $.Deferred();
            http.ping().then(function () {
                def.resolve();
            }, function (response) {
                require(['io.ox/multifactor/auth', 'settings!io.ox/core'], function (auth, coreSettings) {
                    var theme = _.sanitize.option(_.url.hash('theme')) || coreSettings.get('theme') || 'default';
                    $.when(themes.set(theme)).then(function () {
                        if (response && response.code === 'MFA-0001') {
                            ox.idle();
                            auth.doAuthentication().then(def.resolve, def.reject);
                        } else {
                            def.reject();
                        }
                    });
                });
            });
            return def;
        }
    };

    return util;

});
