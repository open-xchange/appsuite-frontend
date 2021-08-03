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
    'io.ox/mail/mailfilter/settings/model',
    'io.ox/core/api/mailfilter',
    'gettext!io.ox/mail',
    'io.ox/core/extensions',
    'io.ox/mail/mailfilter/settings/filter/defaults',
    'fixture!io.ox/mail/mailfilter/config.json'
], function (mailfilterModel, api, gt, ext, defaults, fixtureMailfilterConfig) {

    'use strict';

    var emptyModel = {
            'rulename': gt('New rule'),
            'test': {
                'id': 'true'
            },
            'actioncmds': [],
            'flags': [],
            'active': true
        },
        returnedModel = mailfilterModel.protectedMethods.provideEmptyModel(),
        factory = mailfilterModel.protectedMethods.buildFactory('io.ox/core/mailfilter/model', mailfilterModel.api);

    describe('Mailfilter model', function () {
        describe('should provide empty model', function () {

            it('should return a object', function () {
                returnedModel.should.be.a('object');
            });

            it('should have a property rulename', function () {
                returnedModel.should.have.a.property('rulename');
            });

            it('should be a string', function () {
                returnedModel.rulename.should.be.a('string');
            });

            it('should be equal', function () {
                returnedModel.rulename.should.be.equal(emptyModel.rulename);
            });

            it('should be a object', function () {
                returnedModel.test.should.be.a('object');
            });

            it('should have a property id', function () {
                returnedModel.test.should.have.a.property('id', 'true');
            });

            it('should have a property actioncmds', function () {
                returnedModel.should.have.a.property('actioncmds');
            });

            it('should be a array', function () {
                returnedModel.actioncmds.should.be.a('array');
            });

            it('should be empty', function () {
                returnedModel.actioncmds.should.be.empty;
            });

            it('should have a property flags', function () {
                returnedModel.should.have.a.property('flags');
            });

            it('should be a array', function () {
                returnedModel.flags.should.be.a('array');
            });

            it('should be empty', function () {
                returnedModel.flags.should.be.empty;
            });

            it('should have a property active', function () {
                returnedModel.should.have.a.property('active', true);
            });

        });

        describe('title', function () {

            var model,
                def = $.Deferred().resolve(fixtureMailfilterConfig),
                stub;

            beforeEach(function () {

                stub = sinon.stub(api, 'getConfig').returns(def);
                model = factory.create(mailfilterModel.protectedMethods.provideEmptyModel());

                return require(['io.ox/mail/mailfilter/settings/filter/tests/register', 'io.ox/mail/mailfilter/settings/filter/actions/register']).then(function (conditionsExtensions, actionsExtensions) {
                    conditionsExtensions.processConfig(fixtureMailfilterConfig);
                    actionsExtensions.processConfig(fixtureMailfilterConfig);

                    ext.point('io.ox/mail/mailfilter/tests').invoke('initialize', null, { defaults: defaults, conditionsOrder: [] });
                    ext.point('io.ox/mail/mailfilter/actions').invoke('initialize', null, { defaults: defaults, actionsOrder: [] });
                });

            });

            afterEach(function () {
                stub.restore();
            });

            it.skip('should change for default values', function () {
                model.get('rulename').should.equal(gt('New rule'));
                model.set({
                    test: {
                        'comparison': 'contains',
                        'headers': ['From'],
                        'id': 'from',
                        'values': ['test@open-xchange.com']
                    },
                    actioncmds: [{ 'id': 'keep' }]
                });
                model.get('rulename').should.equal(gt('Keep mails from %1$s', 'test@open-xchange.com'));
                model.set('actioncmds', [{ 'id': 'discard' }]);
                model.get('rulename').should.equal(gt('Discard mails from %1$s', 'test@open-xchange.com'));
            });

            it.skip('should change if still titled new rule', function () {
                model.get('rulename').should.equal(gt('New rule'));
                model.set({
                    test: {
                        'comparison': 'contains',
                        'headers': ['From'],
                        'id': 'from',
                        'values': ['test@open-xchange.com']
                    },
                    actioncmds: [{ 'id': 'keep' }]
                });
                model.set('rulename', gt('New rule'));
                model.set('actioncmds', [{ 'id': 'discard' }]);
                model.get('rulename').should.equal(gt('Discard mails from %1$s', 'test@open-xchange.com'));
            });

            it('should not changed if custom titled', function () {
                model.set('rulename', 'My custom rulename');
                model.set({
                    test: {
                        'comparison': 'contains',
                        'headers': ['From'],
                        'id': 'from',
                        'values': ['test@open-xchange.com']
                    },
                    actioncmds: [{ 'id': 'keep' }]
                });
                model.get('rulename').should.equal('My custom rulename');
            });

        });
    });

});
