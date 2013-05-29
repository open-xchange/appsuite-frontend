/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(['shared/examples/for/api',
        'io.ox/core/api/autocomplete'], function (sharedExamplesFor, api) {

    return describe('autocomplete API', function () {
        var instance = new api({id: 'createDistributionList', contacts: true, distributionlists: false }),
            options = {

                //predefined results (ignore shared test)
                markedPending: {
                    'autocomplete API a basic API class has some get methods should define a getAll method.': true,
                    'autocomplete API a basic API class has some get methods should return a deferred object for getAll.': true,
                    'autocomplete API a basic API class has some get methods should define a getList method.': true,
                    'autocomplete API a basic API class has some get methods should return a deferred object for getList.': true,
                    'autocomplete API a basic API class implements an event system should define a trigger method.': true,
                    'autocomplete API a basic API class implements an event system should define an on method.': true,
                    'autocomplete API a basic API class has some get methods should define a get method.': true,
                    'autocomplete API a basic API class has some get methods should return a deferred object for get.': true
                }
            };

        //use shared examples
        sharedExamplesFor(api, options);

        //existance and return type
        describe('has some methods', function () {
            it('should define a search method', function () {
                expect(instance.search).toBeFunction();
            });
            it('should define a processContactItem method', function () {
                expect(instance.processContactItem).toBeFunction();
            });
            it('should define a processContactResults method', function () {
                expect(instance.processContactResults).toBeFunction();
            });
            it('should return a deferred object for search', function () {
                expect(instance.search('')).toBeDeferred();
            });
        });

        //results
        describe('has some parsing functionality', function () {
            it('should return an array for processItem', function () {
                var fakedata = {
                    data: ['a', 'b']
                };
                expect(instance.processItem('some specified api', fakedata)).toBeArrayOfSize(2);
            });
            it('should return an array for processItem', function () {
                var fakedata = [];
                expect(instance.processContactResults([])).toBeArray();
            });
        });


    });
});
