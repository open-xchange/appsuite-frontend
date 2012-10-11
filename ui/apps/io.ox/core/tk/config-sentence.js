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
define("io.ox/core/tk/config-sentence", function () {
    "use strict";
    
    function ConfigSentence() {
        var self = this;
        this.model = new Backbone.Model();
        
        
        _(["get", "set", "on", "off"]).each(function (method) {
            self[method] = _.bind(self.model[method], self.model);
        });
        
    }
    
    
    return ConfigSentence;
});