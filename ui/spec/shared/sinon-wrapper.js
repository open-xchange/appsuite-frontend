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

/* eslint requirejs/no-object-define: 0 */
define('sinon-wrapper', {

    //wrapper for sinon spy/stub
    create: function () {

        var spies = {},
            stubs = {},
            counter = 0;

        return {
            //add spy or reset existing
            spy: function (obj, property) {
                if (!obj[property].restore) {
                    var spy = sinon.spy(obj, property),
                        restore = spy.restore,
                        id = counter + 1;
                    counter = id;
                    spy.restore = function () {
                        delete spies[id];
                        restore.apply(spy, arguments);
                    };
                    spies[id] = spy;
                } else {
                    obj[property].reset();
                }
                return obj[property];
            },
            stub: function (obj, method, fn) {
                var stub = sinon.stub(obj, method).callsFake(fn),
                    restore = stub.restore,
                    id = counter + 1;
                counter = id;
                stub.restore = function () {
                    delete stubs[id];
                    restore.apply(stub, arguments);
                };
                stubs[id] = stub;
                return stub;
            },
            restore: function () {
                //restore all
                _.each(spies, function (spy) {
                    spy.restore();
                });
                _.each(stubs, function (stub) {
                    stub.restore();
                });
            },
            reset: function () {
                //reset all
                _.each(spies, function (spy) {
                    spy.reset();
                });
            },
            list: function () {
                return {
                    spies: spies,
                    stubs: stubs
                };
            }
        };
    }
});
