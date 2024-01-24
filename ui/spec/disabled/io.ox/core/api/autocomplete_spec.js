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

define(['io.ox/core/api/autocomplete'], function (api) {

    describe('Core', function () {
        describe('autocomplete API', function () {
            var instance = new api({ id: 'createDistributionList', contacts: true, distributionlists: false });

            //existance
            describe('has some methods', function () {
                it('should define a search method', function () {
                    expect(instance.search).to.be.a('function');
                });
                it.skip('should define a processContactItem method', function () {
                    expect(instance.processContactItem).to.be.a('function');
                });
                it('should define a processContactResults method', function () {
                    expect(instance.processContactResults).to.be.a('function');
                });
            });

            //retured deferreds
            describe('has some methods that return deferreds', function () {
                it('should return a deferred promise object for search', function () {
                    expect(instance.search(this.test.title)).to.be.an('object');//FIXME: check for deferred
                });
            });

            //server calls
            describe.skip('has some methods calling ser', function () {
                it('with all needed parameters for search', function () {
                    var spy = sinon.spy($, 'ajax'),
                        query = this.test.title,
                        param;
                    //call search
                    instance.search(query);
                    // spy if $.ajax was called
                    expect(spy).to.have.been.calledOnce;
                    // get params
                    param = JSON.parse(spy.getCall(0).args[0].data);
                    expect(param[0].data.display_name).to.equal(query + '*');
                    // Restore $.ajax to normal
                    $.ajax.restore();

                    return true;
                });
            });

            //results
            describe.skip('has some parsing functionality', function () {
                it('should return an array for processItem', function () {
                    var args = [
                        'contact',
                        {
                            'data': [{
                                'id': 486089,
                                'folder_id': 14830,
                                'private_flag': false,
                                'display_name': 'Hawthorne, Pierce',
                                'first_name': 'Pierce',
                                'last_name': 'Hawthorne',
                                'title': null,
                                'position': null,
                                'internal_userid': 0,
                                'email1': 'pierce.hawthorne@greendalecommunitycollege.com',
                                'email2': null,
                                'email3': null,
                                'company': null,
                                'distribution_list': null,
                                'mark_as_distributionlist': false,
                                'image1_url': '/ajax/image/contact/picture?folder=14830&id=486089&timestamp=1370252041765',
                                'sort_name': 'HawthornePierce'
                            }],
                            'timestamp': 1370252041765
                        }
                    ];

                    var result = [{
                        'data': {
                            'id': 486089,
                            'folder_id': 14830,
                            'private_flag': false,
                            'display_name': 'Hawthorne, Pierce',
                            'first_name': 'Pierce',
                            'last_name': 'Hawthorne',
                            'title': null,
                            'position': null,
                            'internal_userid': 0,
                            'email1': 'pierce.hawthorne@greendalecommunitycollege.com',
                            'email2': null,
                            'email3': null,
                            'company': null,
                            'distribution_list': null,
                            'mark_as_distributionlist': false,
                            'image1_url': '/ajax/image/contact/picture?folder=14830&id=486089&timestamp=1370252041765',
                            'sort_name': 'HawthornePierce'
                        },
                        'type': 'contact'
                    }];

                    expect(instance.processItem.apply(this, args)).to.deep.equal(result);
                });
                it('should return an array for processContactResults', function () {
                    var args = [
                        'contact',
                        [{
                            'data': {
                                'id': 486089,
                                'folder_id': 14830,
                                'private_flag': false,
                                'display_name': 'Hawthorne, Pierce',
                                'first_name': 'Pierce',
                                'last_name': 'Hawthorne',
                                'title': null,
                                'position': null,
                                'internal_userid': 0,
                                'email1': 'pierce.hawthorne@greendalecommunitycollege.com',
                                'email2': null,
                                'email3': null,
                                'company': null,
                                'distribution_list': null,
                                'mark_as_distributionlist': false,
                                'image1_url': '/ajax/image/contact/picture?folder=14830&id=486089&timestamp=1370252041765',
                                'sort_name': 'HawthornePierce'
                            },
                            'type': 'contact'
                        }],
                        'hawthorn', {
                            'emailAutoComplete': false
                        }
                    ];

                    var result = [{
                        'type': 'contact',
                        'first_name': 'Pierce',
                        'last_name': 'Hawthorne',
                        'display_name': 'Pierce Hawthorne',
                        'data': {
                            'id': 486089,
                            'folder_id': 14830,
                            'private_flag': false,
                            'display_name': 'Hawthorne, Pierce',
                            'first_name': 'Pierce',
                            'last_name': 'Hawthorne',
                            'title': null,
                            'position': null,
                            'internal_userid': 0,
                            'email1': 'pierce.hawthorne@greendalecommunitycollege.com',
                            'email2': null,
                            'email3': null,
                            'company': null,
                            'distribution_list': null,
                            'mark_as_distributionlist': false,
                            'image1_url': '/ajax/image/contact/picture?folder=14830&id=486089&timestamp=1370252041765',
                            'sort_name': 'HawthornePierce'
                        },
                        'field': 'email1',
                        'email': 'pierce.hawthorne@greendalecommunitycollege.com',
                        'phone': ''
                    }];

                    expect(instance.processContactResults(args[0], args[1], args[2], args[3])).to.deep.equal(result);
                });
                it('should add elements to submitted array', function () {
                    var args = [
                        'contact',
                        [],
                        {
                            'data': {
                                'id': 486089,
                                'folder_id': 14830,
                                'private_flag': false,
                                'display_name': 'Hawthorne, Pierce',
                                'first_name': 'Pierce',
                                'last_name': 'Hawthorne',
                                'title': null,
                                'position': null,
                                'internal_userid': 0,
                                'email1': 'pierce.hawthorne@greendalecommunitycollege.com',
                                'email2': null,
                                'email3': null,
                                'company': null,
                                'distribution_list': null,
                                'mark_as_distributionlist': false,
                                'image1_url': '/ajax/image/contact/picture?folder=14830&id=486089&timestamp=1370252041765',
                                'sort_name': 'HawthornePierce'
                            },
                            'type': 'contact'
                        },
                        'email',
                        [
                            'email1',
                            'email2',
                            'email3'
                        ]
                    ];

                    //expected result
                    var result = [{
                        'type':  'contact',
                        'first_name':  'Pierce',
                        'last_name':  'Hawthorne',
                        'display_name':  'Pierce Hawthorne',
                        'data': {
                            'id':  486089,
                            'folder_id':  14830,
                            'private_flag':  false,
                            'display_name':  'Hawthorne, Pierce',
                            'first_name': 'Pierce',
                            'last_name': 'Hawthorne',
                            'title': null,
                            'position': null,
                            'internal_userid': 0,
                            'email1': 'pierce.hawthorne@greendalecommunitycollege.com',
                            'email2': null,
                            'email3': null,
                            'company': null,
                            'distribution_list': null,
                            'mark_as_distributionlist': false,
                            'image1_url': '/ajax/image/contact/picture?folder=14830&id=486089&timestamp=1370252041765',
                            'sort_name': 'HawthornePierce'
                        },
                        'field': 'email1',
                        'email': 'pierce.hawthorne@greendalecommunitycollege.com',
                        'phone': ''
                    }];

                    instance.processContactItem.apply(this, args);
                    expect(args[1]).to.deep.equal(result);
                });
            });
        });
    });
});
