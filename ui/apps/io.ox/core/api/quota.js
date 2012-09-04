/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define("io.ox/core/api/quota", ["io.ox/core/http"], function (http) {
    
    "use strict";
    
    var api = {
        pause: function () {
            return http.pause();
        },
        resume: function () {
            return http.resume().pipe(function (data) {
                //rewrap output
                var quotas = {
                        filequota: data[0].data,
                        mailquota: data[1].data
                    };
                //create fake values for testing
                quotas.filequota.quota = 50 * 1024 * 1024; //50mb limit
                quotas.filequota.use = 26 * 1024 * 1024; //26mb in use
                quotas.mailquota.quota = 100 * 1024 * 1024; //100mb limit
                quotas.mailquota.use = 87 * 1024 * 1024; //87mb in use
                quotas.mailquota.countquota = 200; //200 limit
                quotas.mailquota.countuse = 191;  //191 in use
                
                return quotas;
            });
        },
                
        getFile: function () {
            return http.GET({
                module: "quota",
                params: {action: "filestore"}
            });
        },
        getMail: function () {
            return http.GET({
                module: "quota",
                params: {action: "mail"}
            });
        }
    };
    
    return api;
});