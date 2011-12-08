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

define('io.ox/dev/testing/main',
    ['io.ox/dev/testing/jasmine',
     'io.ox/core/extensions'], function (jasmine, ext) {

    'use strict';

    var app = ox.ui.createApp({
            title: 'Unit Tests'
        }),
        win;

    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            title: 'Jasmine Tests'
        }));

        function report() {

            var env = jasmine.jasmine.getEnv();

            env.addReporter({
                /*
                 * Draws suites and their specs. Specs have an attribute
                 * data-spec-<id> that allows updating them once the test result
                 * is available.
                 */
                reportRunnerStarting: function (runner) {
                    // be busy
                    win.nodes.main.busy();
                    // add all suites
                    _(runner.suites()).each(function (suite) {
                        $('<div>')
                            .attr('data-suite-id', suite.id)
                            .append(
                                $('<h1>')
                                .addClass('clear-title')
                                .text(String(suite.description))
                            )
                            .append(
                                $('<ol>').append(
                                    _(suite.specs()).inject(function (set, spec) {
                                        return set.add(
                                            $('<li>')
                                            .attr('data-spec-id', spec.id)
                                            .text(String(spec.description))
                                        );
                                    }, $())
                                )
                            )
                            .appendTo(win.nodes.main);
                    });
                },
                reportRunnerResults: function (runner) {
                    // stop being busy
                    win.nodes.main.idle();
                },
                reportSuiteResults: function (suite) {
                    win.show();
                },
                reportSpecStarting: function (spec) {
                },
                reportSpecResults: function (spec) {
                    // find spec DOM node by id
                    var node = win.nodes.main.find(
                            '[data-suite-id=' + spec.suite.id + '] [data-spec-id=' + spec.id + ']'
                        ),
                        result = spec.results();
                    if (result.failedCount === 0) {
                        // ok!
                        node.css('color', 'green');
                    } else {
                        // fail!
                        node.css({ color: 'red', fontWeight: 'bold' });
                        _(result.items_).each(function (item) {
                            if (!item.passed()) {
                                $('<div>').text(item + '').appendTo(node);
                            }
                        });
                    }
                }
            });
            // go!
            env.execute();
        }

        win.nodes.main.css('overflow', 'auto').addClass('selectable-text');

        win.show(function () {
            // load all tests
            ext.loadPlugins({ name: 'tests', prefix: '', suffix: 'test' })
                .done(function () {
                    // loop over all extensions
                    ext.point('test/suite').each(function (e) {
                        e.test(jasmine);
                    });
                    report();
                });
        });
    });

    return {
        getApp: app.getInstance
    };

});