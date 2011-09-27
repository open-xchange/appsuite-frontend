/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 */

define("io.ox/internal/testing/main", ["io.ox/internal/testing/jasmine", "io.ox/core/extensions"], function (jasmine, ext) {
    
    
    var app = ox.ui.createApp({
        title: "Unit Tests"
    }),
    // app window
    win;
        
    app.setLauncher(function () {

        
        function go() {
            var env = jasmine.jasmine.getEnv();
            env.addReporter({
                reportRunnerStarting: function (runner) {
                    console.log("Runner starting");
                },
                reportRunnerResults: function (runner) {
                    console.log("reportRunnerResults", runner.results());
                },
                reportSuiteResults: function (suite) {
                    console.log("reportSuiteResults", suite);
                },
                reportSpecStarting: function (spec) {
                    console.log("spec starting", spec);
                },
                reportSpecResults: function (spec) {
                    console.log("spec results", spec);
                }
            });
            env.execute();
        }

        var point = ext.point("io.ox/testing/suite").each(function (ext) {
            if (ext.file) {
                require([ext.file], function (t) {
                    t(jasmine);
                    go(); //TODO: Multiple Files
                });
            }
        });
        
        
    });
    
    return {
        getApp: app.getInstance
    };
    
});