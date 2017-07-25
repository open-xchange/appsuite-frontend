/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
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

    describe('Mailfilter model provide empty model', function () {

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

    describe('Mailfilter model title', function () {

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

        it('should change for default values', function () {
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

        it('should change if still titled new rule', function () {
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
