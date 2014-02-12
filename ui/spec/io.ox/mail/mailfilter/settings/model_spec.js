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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define(['io.ox/mail/mailfilter/settings/model', 'gettext!io.ox/mail'], function (model, gt) {

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
    returnedModel = model.protectedMethods.provideEmptyModel();

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
});
