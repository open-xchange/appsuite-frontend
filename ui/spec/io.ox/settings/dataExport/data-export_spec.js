/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define([
    'io.ox/settings/personalData/settings/pane',
    'gettext!io.ox/core'
], function (pane, gt) {
    'use strict';

    var availableModules = {
        infostore: {
            enabled: true,
            includePublic: false,
            includeShared: false,
            includeTrash: true,
            includeAllVersions: false
        },
        calendar: {
            enabled: true,
            includePublic: false,
            includeShared: true,
            includeUnsubscribed: false
        },
        mail: {
            enabled: true,
            includeTrash: true,
            includePublic: false,
            includeShared: true,
            includeUnsubscribed: false
        },
        tasks: {
            enabled: false,
            includePublic: false,
            includeShared: false
        },
        contacts: {
            enabled: false,
            includePublic: true,
            includeShared: true
        },
        maxFileSize: 2147483648
    };

    describe('Data export (GDPR)', function () {

        describe('should', function () {
            beforeEach(function () {
                this.node = $('<div>');
                this.status = new Backbone.Model({ status: 'NONE' });
            });

            afterEach(function () {
                delete this.availableModulesModel;
                delete this.node;
                delete this.status;
                delete this.view;
            });

            it('draw all nodes and options', function () {
                this.availableModulesModel = new Backbone.Model(availableModules);
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });

                this.node.append(this.view.render().$el);

                // header and containers
                expect(this.node.find('h1').length).to.equal(1);
                expect(this.node.find('.form-group').length).to.equal(2);

                // main and sub options
                expect(this.node.find('.main-option').length).to.equal(5);
                expect(this.node.find('.dropdown').length).to.equal(5);
                expect(this.node.find('li>a').length).to.equal(15);

                // filesize selector
                expect(this.node.find('select').length).to.equal(1);
                expect(this.node.find('select option').length).to.equal(3);

                // request button
                expect(this.node.find('button').length).to.equal(1);
            });

            // options may not be available due to server config, test this
            it('draw available main options', function () {
                this.availableModulesModel = new Backbone.Model(_(availableModules).pick('mail', 'contacts', 'maxFileSize'));
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });

                this.node.append(this.view.render().$el);

                expect(this.node.find('.main-option').length).to.equal(2);
            });

            // options may not be available due to server config, test this
            it('draw available sub options', function () {
                this.availableModulesModel = new Backbone.Model(availableModules);
                this.availableModulesModel.set('infostore', {
                    enabled: true,
                    includePublic: false,
                    includeShared: false
                });
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });

                this.node.append(this.view.render().$el);

                expect(this.node.find('li>a').length).to.equal(13);
            });

            // options may not be available due to server config, test this
            it('draw available max sizes', function () {
                this.availableModulesModel = new Backbone.Model(availableModules);
                this.availableModulesModel.set('maxFileSize', 1073741824);
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });

                this.node.append(this.view.render().$el);

                expect(this.node.find('select option').length).to.equal(2);
            });

            it('preselect available options', function () {
                this.availableModulesModel = new Backbone.Model(availableModules);
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });

                this.node.append(this.view.render().$el);

                expect(this.node.find('input:checkbox:checked').length).to.equal(3);
                expect(this.node.find('input:checkbox:not(:checked)').length).to.equal(2);

                expect(this.node.find('li>a>i.fa-check').length).to.equal(6);
                expect(this.node.find('li>a>i.fa-none').length).to.equal(9);
            });

            it('should create proper data for api request', function () {
                this.availableModulesModel = new Backbone.Model(availableModules);
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });

                this.node.append(this.view.render().$el);
                $(this.node.find('li>a')[4]).trigger('click');

                expect(JSON.stringify(this.view.getDownloadConfig())).to.equal(JSON.stringify({
                    infostore: {
                        enabled: true,
                        includePublic: false,
                        includeShared: false,
                        includeTrash: true,
                        includeAllVersions: false
                    },
                    calendar: {
                        enabled: true,
                        includePublic: true,
                        includeShared: true,
                        includeUnsubscribed: false
                    },
                    mail: {
                        enabled: true,
                        includeTrash: true,
                        includePublic: false,
                        includeShared: true,
                        includeUnsubscribed: false
                    },
                    tasks: {
                        enabled: false,
                        includePublic: false,
                        includeShared: false
                    },
                    contacts: {
                        enabled: false,
                        includePublic: true,
                        includeShared: true
                    },
                    maxFileSize: 2147483648
                }));
            });
        });

        it('should prepare api response correctly', function () {
            // strip timestamps
            expect(JSON.stringify(pane.handleApiResult([{ status: 'DONE' }, 1337]))).to.equal(JSON.stringify({ status: 'DONE' }));

            // failed, aborted status or possible errors should be treated the same as status none
            expect(JSON.stringify(pane.handleApiResult({ status: 'FAILED' }))).to.equal(JSON.stringify({ status: 'NONE' }));
            expect(JSON.stringify(pane.handleApiResult({ status: 'ABORTED' }))).to.equal(JSON.stringify({ status: 'NONE' }));
            expect(JSON.stringify(pane.handleApiResult({ code: '123', error: 'abc' }))).to.equal(JSON.stringify({ status: 'NONE' }));
        });

        describe('should correctly show status', function () {
            beforeEach(function () {
                this.node = $('<div>');
                this.availableModulesModel = new Backbone.Model(availableModules);
            });

            afterEach(function () {
                delete this.availableModulesModel;
                delete this.node;
                delete this.status;
                delete this.view;
                delete this.dlView;
            });

            it('NONE', function () {
                this.status = new Backbone.Model(pane.handleApiResult({ status: 'NONE' }));
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });
                this.dlView = new pane.downloadView({ model: this.status });

                this.node.append(this.dlView.render().$el,
                    this.view.render().$el
                );

                //download view
                expect(this.node.find('.personal-data-download-view').length).to.equal(1);
                expect(this.node.find('.personal-data-download-view:visible').length).to.equal(0);

                // header and containers
                expect(this.node.find('h1').length).to.equal(2);
                expect(this.node.find('.form-group').length).to.equal(2);

                // main and sub options
                expect(this.node.find('.main-option').length).to.equal(5);
                expect(this.node.find('.dropdown').length).to.equal(5);
                expect(this.node.find('li>a').length).to.equal(15);

                // filesize selector
                expect(this.node.find('select').length).to.equal(1);
                expect(this.node.find('select option').length).to.equal(3);

                // request button
                expect(this.node.find('button:first').text()).to.equal(gt('Request download'));
            });

            it('PENDING', function () {
                this.status = new Backbone.Model(pane.handleApiResult({ status: 'PENDING' }));
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });
                this.dlView = new pane.downloadView({ model: this.status });

                this.node.append(
                    this.dlView.render().$el,
                    this.view.render().$el
                );

                //download view
                expect(this.node.find('.personal-data-download-view div.col-xs-12').text()).to.equal(gt('Your requested archive is currently being created. Depending on the size of the requested data this may take hours or days. You will be informed via email when your download is ready.'));
                expect(this.node.find('button:first').text()).to.equal(gt('Cancel download request'));

                // header and containers
                expect(this.node.find('h1').length).to.equal(2);
                expect(this.node.find('.form-group').length).to.equal(2);
                // main and sub options
                expect(this.node.find('.main-option.disabled').length).to.equal(5);
                expect(this.node.find('.dropdown>a.disabled').length).to.equal(5);
                expect(this.node.find('li>a.disabled').length).to.equal(15);

                // filesize selector
                expect(this.node.find('select:disabled').length).to.equal(1);
                expect(this.node.find('select option').length).to.equal(3);

                // request button
                expect(this.node.find('button:disabled:last').text()).to.equal(gt('Request download'));
            });

            it('PAUSED', function () {
                this.status = new Backbone.Model(pane.handleApiResult({ status: 'PAUSED' }));
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });
                this.dlView = new pane.downloadView({ model: this.status });

                this.node.append(
                    this.dlView.render().$el,
                    this.view.render().$el
                );

                //download view
                expect(this.node.find('.personal-data-download-view div.col-xs-12').text()).to.equal(gt('Your requested archive is currently being created. Depending on the size of the requested data this may take hours or days. You will be informed via email when your download is ready.'));
                expect(this.node.find('button:first').text()).to.equal(gt('Cancel download request'));

                // header and containers
                expect(this.node.find('h1').length).to.equal(2);
                expect(this.node.find('.form-group').length).to.equal(2);
                // main and sub options
                expect(this.node.find('.main-option.disabled').length).to.equal(5);
                expect(this.node.find('.dropdown>a.disabled').length).to.equal(5);
                expect(this.node.find('li>a.disabled').length).to.equal(15);

                // filesize selector
                expect(this.node.find('select:disabled').length).to.equal(1);
                expect(this.node.find('select option').length).to.equal(3);

                // request button
                expect(this.node.find('button:disabled:last').text()).to.equal(gt('Request download'));
            });

            it('RUNNING', function () {
                this.status = new Backbone.Model(pane.handleApiResult({ status: 'RUNNING' }));
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });
                this.dlView = new pane.downloadView({ model: this.status });

                this.node.append(
                    this.dlView.render().$el,
                    this.view.render().$el
                );

                //download view
                expect(this.node.find('.personal-data-download-view div.col-xs-12').text()).to.equal(gt('Your requested archive is currently being created. Depending on the size of the requested data this may take hours or days. You will be informed via email when your download is ready.'));
                expect(this.node.find('button:first').text()).to.equal(gt('Cancel download request'));

                // header and containers
                expect(this.node.find('h1').length).to.equal(2);
                expect(this.node.find('.form-group').length).to.equal(2);
                // main and sub options
                expect(this.node.find('.main-option.disabled').length).to.equal(5);
                expect(this.node.find('.dropdown>a.disabled').length).to.equal(5);
                expect(this.node.find('li>a.disabled').length).to.equal(15);

                // filesize selector
                expect(this.node.find('select:disabled').length).to.equal(1);
                expect(this.node.find('select option').length).to.equal(3);

                // request button
                expect(this.node.find('button:disabled:last').text()).to.equal(gt('Request download'));
            });

            it('DONE', function () {
                this.status = new Backbone.Model(pane.handleApiResult({
                    status: 'DONE',
                    availableUntil: 1573202539498,
                    creationTime: 1571992609115,
                    id: 123,
                    results: [{
                        contentType: 'application/zip',
                        fileInfo: 'archive-2019-10-25.zip',
                        number: 1,
                        taskId: '123'
                    }]
                }));
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });
                this.dlView = new pane.downloadView({ model: this.status });

                this.node.append(this.dlView.render().$el,
                    this.view.render().$el
                );

                // header and containers
                expect(this.node.find('h1').length).to.equal(2);
                expect(this.node.find('.form-group').length).to.equal(2);

                //downloads
                expect(this.node.find('ul.downloads').length).to.equal(1);
                expect(this.node.find('ul.downloads li').length).to.equal(1);
                expect(this.node.find('ul.downloads li span').length).to.equal(1);
                expect(this.node.find('.personal-data-download-view label').text()).to.equal(gt('Your data archive from %2$s is ready for download. The download is available until %1$s.', moment(this.status.get('availableUntil')).format('L'), moment(this.status.get('creationTime')).format('L')));
                expect(this.node.find('ul.downloads li span').text()).to.equal('archive-2019-10-25.zip');
                expect(this.node.find('button.fa-download').length).to.equal(1);

                // main and sub options
                expect(this.node.find('.main-option').length).to.equal(5);
                expect(this.node.find('.main-option.disabled').length).to.equal(0);
                expect(this.node.find('.dropdown').length).to.equal(5);
                expect(this.node.find('.dropdown>a.disabled').length).to.equal(0);
                expect(this.node.find('li>a').length).to.equal(15);
                expect(this.node.find('li>a.disabled').length).to.equal(0);

                // filesize selector
                expect(this.node.find('select:enabled').length).to.equal(1);
                expect(this.node.find('select option').length).to.equal(3);

                // request button
                expect(this.node.find('button:last').text()).to.equal(gt('Request new download'));
            });

            it('FAILED', function () {
                this.status = new Backbone.Model(pane.handleApiResult({ status: 'FAILED' }));
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });
                this.dlView = new pane.downloadView({ model: this.status });

                this.node.append(
                    this.dlView.render().$el,
                    this.view.render().$el
                );

                //download view
                expect(this.node.find('.personal-data-download-view').length).to.equal(1);
                expect(this.node.find('.personal-data-download-view:visible').length).to.equal(0);

                // header and containers
                expect(this.node.find('h1').length).to.equal(2);
                expect(this.node.find('.form-group').length).to.equal(2);

                // main and sub options
                expect(this.node.find('.main-option').length).to.equal(5);
                expect(this.node.find('.dropdown').length).to.equal(5);
                expect(this.node.find('li>a').length).to.equal(15);

                // filesize selector
                expect(this.node.find('select').length).to.equal(1);
                expect(this.node.find('select option').length).to.equal(3);

                // request button
                expect(this.node.find('button:first').text()).to.equal(gt('Request download'));
            });

            it('ABORTED', function () {
                this.status = new Backbone.Model(pane.handleApiResult({ status: 'ABORTED' }));
                this.view = new pane.selectDataView({ model: this.availableModulesModel, status: this.status });
                this.dlView = new pane.downloadView({ model: this.status });

                this.node.append(
                    this.dlView.render().$el,
                    this.view.render().$el
                );

                //download view
                expect(this.node.find('.personal-data-download-view').length).to.equal(1);
                expect(this.node.find('.personal-data-download-view:visible').length).to.equal(0);

                // header and containers
                expect(this.node.find('h1').length).to.equal(2);
                expect(this.node.find('.form-group').length).to.equal(2);

                // main and sub options
                expect(this.node.find('.main-option').length).to.equal(5);
                expect(this.node.find('.dropdown').length).to.equal(5);
                expect(this.node.find('li>a').length).to.equal(15);

                // filesize selector
                expect(this.node.find('select').length).to.equal(1);
                expect(this.node.find('select option').length).to.equal(3);

                // request button
                expect(this.node.find('button:first').text()).to.equal(gt('Request download'));
            });
        });
    });
});
