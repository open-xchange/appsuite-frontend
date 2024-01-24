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

define(['io.ox/core/commons', 'io.ox/core/tk/vgrid'], function (commons, VGrid) {

    describe('Core commons:', function () {

        describe('grid property cache', function () {
            var grid = new VGrid(),
                oldprop = grid.prop,
                key = 'some key',
                val = 'value for someKey',
                valfb = 'fallback value for some key',
                valdiff = 'some different value for some key',
                keyprop = 'folder';

            //init
            grid.prop(key, val);
            grid.prop(keyprop, 'folder_one');
            commons.addPropertyCaching(grid, { props: key, keyprop: keyprop });

            it('does not throw an error if called with invalid data', function () {
                commons.addPropertyCaching();
                commons.addPropertyCaching({});
                commons.addPropertyCaching([]);
            });

            describe('fullfills its main task', function () {
                it('by wrapping grid prop function', function () {
                    expect(grid.prop).is.not.equal(oldprop);
                });
                it('by adding propcache function to the grid', function () {
                    expect(grid.propcache).to.be.a('function');
                });
            });

            it('does not wrapps again in case function is called muliple times', function () {
                var obj = { propcache: '' };
                commons.addPropertyCaching(obj);
                expect(obj.propcache).not.to.be.a('function');
            });

            it('returns undefined in case value is not stored yet', function () {
                expect(grid.propcache(key)).is.undefined;
            });

            it('returns a fallback value (if provided) in case value is not stored yet', function () {
                expect(grid.propcache(key, valfb)).to.be.equal(valfb);
            });

            it('returns a fallback value (if provided) in case value is not stored yet', function () {
                expect(grid.propcache(key, valfb)).to.be.equal(valfb);
            });

            it('stores current state of targeting props when specific property changes', function () {
                //switching folder chhange triggers 'add to cache' for folder_one
                grid.prop(keyprop, 'folder_two');
                //let's switch back and get cached values
                grid.prop(keyprop, 'folder_one');
                //set/get different value
                grid.prop(key, valdiff);
                expect(grid.prop(key)).to.be.equal(valdiff);
                //get cached value, not current
                expect(grid.propcache(key)).to.be.equal(val);
            });

        });
    });
});
