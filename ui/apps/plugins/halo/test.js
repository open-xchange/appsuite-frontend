/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('plugins/halo/test', [
    'io.ox/core/extensions',
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
