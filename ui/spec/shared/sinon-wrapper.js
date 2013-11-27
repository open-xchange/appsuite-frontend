/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

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
                        id = counter = counter + 1;
                    spy.restore = function () {
                        delete spies[id];
                        restore.apply(spy, arguments);
                    };
                } else {
                    obj[property].reset();
                }
                spies[id] = spy;
                return obj[property];
            },
            stub: function (obj, method, fn) {
                var stub = sinon.stub(obj, method, fn),
                    restore = stub.restore,
                    id = counter = counter + 1;
                    stub.restore = function () {
                        delete stubs[id];
                        restore.apply(stub, arguments);
                    };
                return stubs[id] = stub;
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
                return  {
                    spies: spies,
                    stubs: stubs
                }
            }
        };
    }
});
