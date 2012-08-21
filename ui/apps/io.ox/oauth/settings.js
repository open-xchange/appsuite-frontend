/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define("io.ox/oauth/settings", ["io.ox/core/extensions", "io.ox/oauth/keychain", "io.ox/keychain/api"], function (ext, oauthKeychain, keychainApi) {
    "use strict";
    
    function OAuthAccountDetailExtension(keychain, serviceId) {
        var self = this;
        
        this.draw = function (args) {
            var $node = this,
                account = keychain.get(args.data.id);
            
            
        };
    }
    
    _(oauthKeychain.serviceIDs).each(function (serviceId) {
        var keychain = keychainApi[serviceId];
        
        ext.point('io.ox/settings/accounts/' + serviceId + '/settings/detail').extend(new OAuthAccountDetailExtension(keychain, serviceId));
    });
    
    return {};
});