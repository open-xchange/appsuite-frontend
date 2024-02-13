/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define(['io.ox/core/manifests'], function (manifests) {
    'use strict';

    describe('Core manifests', function () {

        it('should define global ox.manifests object', function () {
            expect(ox.manifests).to.exist;
        });

        it('should provide a reset method', function () {
            expect(manifests.reset).to.be.a('function');
        });

        it('should provide a manifest manager object', function () {
            expect(manifests.manager).to.exist;
        });

        describe('provides the manifest manager which', function () {
            it('should be exported globally as ox.manifests', function () {
                expect(ox.manifests).to.equal(manifests.manager);
            });

            describe('has a "pluginsFor" method that', function () {
                it('should return an empty list if no extension point is given', function () {
                    expect(manifests.manager.pluginsFor()).to.be.empty;
                });

                it('should return a list of plugins for a given extension point name', function () {
                    manifests.manager.pluginPoints.testPoint = [{
                        path: 'path/to/plugin2'
                    }, {
                        path: 'path/to/plugin1'
                    }];

                    expect(manifests.manager.pluginsFor('testPoint')).to.deep.equal(['path/to/plugin2', 'path/to/plugin1']);

                    delete manifests.manager.pluginPoints.testPoint;
                });
            });
        });
    });
});
