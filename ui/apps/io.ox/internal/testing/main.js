/**
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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

// TODO: Add Convenience and niceties
define("io.ox/internal/testing/main",
    ["io.ox/internal/testing/jasmine",
     "io.ox/core/extensions"], function (jasmine, ext) {

    "use strict";

    var app = ox.ui.createApp({
        title: "Unit Tests"
    }),
    // app window
    win;

    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            title: "Jasmine Tests",
            search: true
        }));

        function report() {

            var env = jasmine.jasmine.getEnv();
            var suiteNodes = {};
            var specNodes = {};

            env.addReporter({
                reportRunnerStarting: function (runner) {
                    win.nodes.main.busy();
                    _(runner.suites()).each(function (suite) {
                        var $node = $("<div/>").appendTo(win.nodes.main);
                        $node.append($("<h1/>").text(suite.description));
                        suiteNodes[suite.id] = $node;
                        var $listContainer = $("<div />").appendTo($node);
                        var $list = $("<ul/>").appendTo($listContainer);
                        _(suite.specs()).each(function (spec) {
                            specNodes[spec.id] = $("<li/>").appendTo($list).text(spec.description);
                        });
                    });
                },
                reportRunnerResults: function (runner) {
                    //console.debug("Runner result", runner.results());
                    win.nodes.main.idle();
                },
                reportSuiteResults: function (suite) {
                    //console.debug("Suite result", suite);
                    win.show();
                },
                reportSpecStarting: function (spec) {
                    //console.debug("spec starting", spec);
                },
                reportSpecResults: function (spec) {
                    var $node = specNodes[spec.id];
                    $node.idle();
                    var result = spec.results();
                    if (result.failedCount === 0) {
                        $node.css("color", "green");
                    } else {
                        $node.css({color: "red", "font-weight" : "bold"});
                        _(result.items_).each(function (item) {
                            if (!item.passed()) {
                                $("<div/>").appendTo($node).text(item.toString());
                            }
                        });
                    }
                    //console.debug("spec results", spec);
                }
            });
            // go!
            env.execute();
        }

        win.show(function () {
            // load all tests
            ext.loadPlugins({ name: 'tests', prefix: '', suffix: 'test' })
                .done(function () {
                    // loop over all extensions
                    ext.point("test/suite").each(function (e) {
                        e.test(jasmine);
                    });
                    report();
                });
        });

//        ext.point("io.ox/testing/suite").each(function (ext) {
//            if (ext.file) {
//                require([ext.file], function (t) {
//                    t(jasmine);
//                    go(); //TODO: Multiple Files
//                });
//            }
//        });

    });

    return {
        getApp: app.getInstance
    };

});