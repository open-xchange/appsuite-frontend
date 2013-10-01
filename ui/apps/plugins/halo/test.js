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
 */

define('plugins/halo/test',
    ['io.ox/core/extensions',
     'plugins/halo/config'
    ], function (ext, haloConfig) {

    'use strict';

    /*
     * Suite: HALO config
     */
    ext.point('test/suite').extend({
        id: 'halo-config',
        index: 10000,
        test: function (j) {

            var describe = j.describe, it = j.it, expect = j.expect;

            describe('HALO config', function () {

                it('defaults to all available halo modules', function () {
                    var activeProviders = haloConfig.interpret(null, ['halo1', 'halo2', 'halo3']);
                    expect(activeProviders).toEqual(['halo1', 'halo2', 'halo3']);
                });

                it('filters according to chosenModules', function () {
                    var activeProviders = haloConfig.interpret({
                        halo1: {
                            provider: 'halo1',
                            position: 0,
                            enabled: true
                        },
                        halo2: {
                            provider: 'halo2',
                            position: 1,
                            enabled: false
                        },
                        halo3: {
                            provider: 'halo3',
                            position: 2,
                            enabled: true
                        }
                    }, ['halo1', 'halo2', 'halo3']);

                    expect(activeProviders).toEqual(['halo1', 'halo3']);
                });

                it('discards chosen but unavailable modules', function () {
                    var activeProviders = new haloConfig.interpret({
                        halo1: {
                            provider: 'halo1',
                            position: 0,
                            enabled: true
                        },
                        halo2: {
                            provider: 'halo2',
                            position: 1,
                            enabled: true
                        }
                    }, ['halo1']);

                    expect(activeProviders).toEqual(['halo1']);
                });

                it('respects the order of chosenModules', function () {
                    var activeProviders = new haloConfig.interpret({
                        halo3: {
                            provider: 'halo3',
                            position: 2,
                            enabled: true
                        },
                        halo1: {
                            provider: 'halo1',
                            position: 0,
                            enabled: true
                        },
                        halo2: {
                            provider: 'halo2',
                            position: 1,
                            enabled: true
                        }
                    }, ['halo1', 'halo2', 'halo3']);

                    expect(activeProviders).toEqual(['halo1', 'halo2', 'halo3']);
                });
            });
        }
    });
});