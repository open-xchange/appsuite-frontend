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

    function Done() {
        var f = function () {
            return f.value;
        };
        f.value = false;
        f.yep = function () {
            f.value = true;
        };
        return f;
    }

    var app = ox.ui.createApp({
            name: 'io.ox/dev/testing',
            title: 'Unit Tests'
        }),
        win,
        env;

    function readable(arg) {
        if (typeof arg === 'string') {
            return arg.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
        } else {
            return arg;
        }
    }

    function consoleError() {
        var args = _(arguments).map(function (arg) {
            return readable(arg);
        });
        if (console && console.error) {
            if (_.browser.IE) {
                console.error(args.join(' '));
            } else {
                console.error.apply(console, args);
            }
        }
    }

    app.setLauncher(function () {

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/dev/testing',
            title: 'Jasmine Tests'
        });

        app.setWindow(win);

        // make jasmine less nervous (use 100 msec instead of 10 msec)
        jasmine.jasmine.WaitsForBlock.TIMEOUT_INCREMENT = 100;

        var suites = _.url.hash('suites'),
            url = '#app=io.ox/dev/testing',
            // handles click to select suite
            fnClick = function (e) {
                e.preventDefault();
                location.href = url + (e.data.id !== 'all' ? '&suites=' + e.data.id : '');
                location.reload();
            },
            // show link to run suite
            addLink = function (node, id) {
                node.append(
                    $('<a>', { href: '#' }).on('click', { id: id }, fnClick).text(id)
                )
                .append($.txt(' '));
            },

            runSuite,
            initializeReporter;

        runSuite = function () {
            // loop over all extensions
            ext.point('test/suite').each(function (e) {
                // run test
                if (_(suites).indexOf('ALL') > -1 || _(suites).indexOf(e.id) > -1) {
                    e.test(jasmine, {
                        Done: Done,
                        // Stick in any number of deferreds, optionally end the arguments list with a message and a timeout
                        // e.g.:
                        //   utils.waitFor(def1, def2, def3)
                        //   utils.waitFor(def1, def2, def3, 5000)
                        //   utils.waitFor(def1, def2, def3, 'Operations timed out', 5000);
                        //   utils.waitFor(def1)
                        waitsFor: function () {
                            // First some arguments magic
                            var timeout, errorMessage;
                            var deferreds = [];
                            var done = new Done();

                            _(arguments).each(function (arg) {
                                if (_.isString(arg)) {
                                    errorMessage = arg;
                                } else if (_.isNumber(arg)) {
                                    timeout = arg;
                                } else {
                                    deferreds.push(arg);
                                }
                            });
                            if (deferreds.length === 0) {
                                return;
                            } else if (deferreds.length === 1) {
                                deferreds = deferreds[0];
                            } else {
                                deferreds = $.when(deferreds);
                            }

                            deferreds.always(done.yep);

                            return jasmine.waitsFor(done, errorMessage || 'timeout', timeout || 5000);
                        }

                    });
                }
            });
            // go!
            env.execute();
        };

        initializeReporter = function () {

            env = jasmine.jasmine.getEnv();

            var green = 0, red = 0;

            env.addReporter({
                /*
                 * Draws suites and their specs. Specs have an attribute
                 * data-spec-<id> that allows updating them once the test result
                 * is available.
                 */
                reportRunnerStarting: function (runner) {
                    // be busy
                    win.nodes.main.busy().find('.results').empty();
                    // reset counters
                    green = red = 0;
                    // add all suites
                    _(runner.suites()).each(function (suite) {
                        win.nodes.main.find('.results')
                        .append(
                            $('<div>')
                            .attr('data-suite-id', suite.id)
                            .append(
                                $('<h1>')
                                .css('margin', '1em 0 0.5em 0')
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
                        );
                    });
                },
                reportRunnerResults: function (runner) {
                    // stop being busy
                    win.nodes.main.idle();
                    win.show();
                    // show summary
                    win.nodes.main.find('.summary').empty()
                        .html('<b>Summary:</b> Total number of tests: <b>' + green + '</b> Failed: <b>' + red + '</b>')
                        .css('color', red > 0 ? '#a00' : '#070');
                    // reset hash
                    location.hash = '#app=io.ox/dev/testing';
                },
                reportSpecResults: function (spec) {
                    // find spec DOM node by id
                    var node = win.nodes.main.find(
                            '[data-suite-id=' + spec.suite.id + '] [data-spec-id=' + spec.id + ']'
                        ),
                        result = spec.results();
                    if (result.failedCount === 0) {
                        // ok!
                        node.css('color', '#070');
                        green++;
                    } else {
                        // fail!
                        node.css({ color: '#a00', fontWeight: 'bold' });
                        _(result.items_).each(function (item) {
                            if (!item.passed()) {
                                $('<div>').text(readable(item + '')).on("click", function () {
                                        $(this).find("pre").remove();
                                        $(this).append($("<pre>").text(item.trace.stack));
                                    }
                                ).appendTo(node);
                                consoleError('Actual', item.actual, "Expected", item.expected);
                            }
                        });
                        red++;
                    }
                }
            });
        };

        win.nodes.main
            .addClass('io-ox-testing selectable-text')
            .css({ overflow: 'auto', padding: '1.5em 13px 1.5em 13px' })
            .append($('<div>').addClass('header'))
            .append($('<div>').addClass('summary').css('lineHeight', '2em').text('\u00A0'))
            .append($('<div>').addClass('results'));

        win.on('open', function () {
            // load all tests
            ext.loadPlugins({ name: 'tests', prefix: '', suffix: 'test' })
                .done(function () {
                    // show ids
                    var ids = $('<div>').append(
                            $('<b>').text('Available suites: ')
                        ).appendTo(win.nodes.main.find('.header'));
                    // split suites string
                    suites = suites ? String(suites).split(/,/) : [];
                    // loop over all extensions
                    _(['ALL'].concat(
                            ext.point('test/suite')
                                .chain()
                                .sortBy(function (e) {
                                    return e.id;
                                })
                                .map(function (e) {
                                    return e.id;
                                })
                                .value()
                            )
                        )
                        .each(function (id, i, list) {
                            // show id
                            addLink(ids, id);
                            if (i < list.length - 1) {
                                ids.append($.txt(' \u2013 ')); // ndash
                            }
                        });
                    // go
                    initializeReporter();
                    runSuite();
                });
        });

        win.show();
    });

    return {
        getApp: app.getInstance
    };

});
