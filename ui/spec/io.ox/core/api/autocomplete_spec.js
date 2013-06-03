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

        //existance
        describe('has some methods', function () {
            it('should define a search method', function () {
                expect(instance.search).toBeFunction();
            });
            it('should define a processItem method', function () {
                expect(instance.processItem).toBeFunction();
            });
            it('should define a processContactItem method', function () {
                expect(instance.processContactItem).toBeFunction();
            });
            it('should define a processContactResults method', function () {
                expect(instance.processContactResults).toBeFunction();
            });
        });

        //retured deferreds
        describe('has some methods that return deferreds', function () {
            it('should return a deferred promise object for search', function () {
                expect(instance.search('foo')).toBePromise();
            });
        });

        //server calls
        describe('has some methods calling ser', function () {
            it('with all needed parameters for search', function () {
                var spy = sinon.spy($, 'ajax'),
                    query = 'foo',
                    param;
                //call search
                instance.search(query);
                // spy if $.ajax was called
                expect(spy).toHaveBeenCalledOnce();
                // get params
                param = JSON.parse(spy.getCall(0).args[0].data);
                expect(param[0].data.display_name).toEqual(query + '*');
                // Restore $.ajax to normal
                $.ajax.restore();

                return true;
            });
        });

        //results
        describe('has some parsing functionality', function () {
            it('should return an array for processItem', function () {
                var args = [
                       "contact",
                       {
                          "data":[
                             {
                                "id":486089,
                                "folder_id":14830,
                                "private_flag":false,
                                "display_name":"Hawthorne, Pierce",
                                "first_name":"Pierce",
                                "last_name":"Hawthorne",
                                "title":null,
                                "position":null,
                                "internal_userid":0,
                                "email1":"pierce.hawthorne@greendalecommunitycollege.com",
                                "email2":null,
                                "email3":null,
                                "company":null,
                                "distribution_list":null,
                                "mark_as_distributionlist":false,
                                "image1_url":"/ajax/image/contact/picture?folder=14830&id=486089&timestamp=1370252041765",
                                "sort_name":"HawthornePierce"
                             }
                          ],
                          "timestamp":1370252041765
                       }
                    ],

                    result =
                    [
                       {
                          "data":{
                             "id":486089,
                             "folder_id":14830,
                             "private_flag":false,
                             "display_name":"Hawthorne, Pierce",
                             "first_name":"Pierce",
                             "last_name":"Hawthorne",
                             "title":null,
                             "position":null,
                             "internal_userid":0,
                             "email1":"pierce.hawthorne@greendalecommunitycollege.com",
                             "email2":null,
                             "email3":null,
                             "company":null,
                             "distribution_list":null,
                             "mark_as_distributionlist":false,
                             "image1_url":"/ajax/image/contact/picture?folder=14830&id=486089&timestamp=1370252041765",
                             "sort_name":"HawthornePierce"
                          },
                          "type":"contact"
                       }
                    ];
                expect(instance.processItem.apply(this, args)).toEqual(result);
            });
            it('should return an array for processContactResults', function () {
                var args = [
                       "contact",
                       [
                          {
                             "data":{
                                "id":486089,
                                "folder_id":14830,
                                "private_flag":false,
                                "display_name":"Hawthorne, Pierce",
                                "first_name":"Pierce",
                                "last_name":"Hawthorne",
                                "title":null,
                                "position":null,
                                "internal_userid":0,
                                "email1":"pierce.hawthorne@greendalecommunitycollege.com",
                                "email2":null,
                                "email3":null,
                                "company":null,
                                "distribution_list":null,
                                "mark_as_distributionlist":false,
                                "image1_url":"/ajax/image/contact/picture?folder=14830&id=486089&timestamp=1370252041765",
                                "sort_name":"HawthornePierce"
                             },
                             "type":"contact"
                          }
                       ],
                       "hawthorn",
                       {
                          "emailAutoComplete":false
                       }
                    ],

                    result =
                        [
                           {
                              "type":"contact",
                              "display_name":"Hawthorne, Pierce",
                              "data":{
                                 "id":486089,
                                 "folder_id":14830,
                                 "private_flag":false,
                                 "display_name":"Hawthorne, Pierce",
                                 "first_name":"Pierce",
                                 "last_name":"Hawthorne",
                                 "title":null,
                                 "position":null,
                                 "internal_userid":0,
                                 "email1":"pierce.hawthorne@greendalecommunitycollege.com",
                                 "email2":null,
                                 "email3":null,
                                 "company":null,
                                 "distribution_list":null,
                                 "mark_as_distributionlist":false,
                                 "image1_url":"/ajax/image/contact/picture?folder=14830&id=486089&timestamp=1370252041765",
                                 "sort_name":"HawthornePierce"
                              },
                              "field":"email1",
                              "email":"pierce.hawthorne@greendalecommunitycollege.com",
                              "phone":""
                           }
                        ];
                expect(instance.processContactResults(args[0], args[1], args[2], args[3])).toEqual(result);
            });
            it('should add elements to submitted array', function () {
                var args = [
                       'contact',
                       [],
                       {
                          'data':{
                             'id':486089,
                             'folder_id':14830,
                             'private_flag':false,
                             'display_name':'Hawthorne, Pierce',
                             'first_name':'Pierce',
                             'last_name':'Hawthorne',
                             'title':null,
                             'position':null,
                             'internal_userid':0,
                             'email1':'pierce.hawthorne@greendalecommunitycollege.com',
                             'email2':null,
                             'email3':null,
                             'company':null,
                             'distribution_list':null,
                             'mark_as_distributionlist':false,
                             'image1_url':'/ajax/image/contact/picture?folder=14830&id=486089&timestamp=1370252041765',
                             'sort_name':'HawthornePierce'
                          },
                          'type':'contact'
                       },
                       'email',
                       [
                          'email1',
                          'email2',
                          'email3'
                       ]
                    ],
                    //expected result
                    result = [{
                      "type": "contact",
                      "display_name": "Hawthorne, Pierce",
                      "data": {
                        "id": 486089,
                        "folder_id": 14830,
                        "private_flag": false,
                        "display_name": "Hawthorne, Pierce",
                        "first_name": "Pierce",
                        "last_name": "Hawthorne",
                        "title": null,
                        "position": null,
                        "internal_userid": 0,
                        "email1": "pierce.hawthorne@greendalecommunitycollege.com",
                        "email2": null,
                        "email3": null,
                        "company": null,
                        "distribution_list": null,
                        "mark_as_distributionlist": false,
                        "image1_url": "\/ajax\/image\/contact\/picture?folder=14830&id=486089&timestamp=1370252041765",
                        "sort_name": "HawthornePierce"
                      },
                      "field": "email1",
                      "email": "pierce.hawthorne@greendalecommunitycollege.com",
                      "phone": ""
                    }];
                instance.processContactItem.apply(this, args);
                expect(args[1]).toEqual(result);
            });
        });
    });
});
