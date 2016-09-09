/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * author Greg Hill <greg.hill@open-xchange.com>
 *
 * Copyright (C) 2016-2020 OX Software GmbH
 */
define('io.ox/guard/auth/authorizer', ['io.ox/core/capabilities'], function (capabilities) {
    'use strict';

    var auth = {};

    // If Guard enabled, creates prompt with optional prompt
    // If optPrompt undefined, uses standard wording "Enter Guard password"
    auth.authorize = function authorize(optPrompt) {
        var def = $.Deferred();
        if (capabilities.has('guard')) {
            require(['oxguard/auth'], function (auth_core) {
                auth_core.authorize(optPrompt).then(function (auth) {
                    def.resolve(auth);
                }, function (reject) {
                    def.reject(reject);
                });
            });
        } else {
            def.reject();
        }
        return def;
    };

    return auth;

});

