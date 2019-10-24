/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define(['io.ox/settings/personalData/settings/pane'], function (pane) {
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
        });
    });
});
