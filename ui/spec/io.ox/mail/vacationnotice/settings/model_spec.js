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

define(['io.ox/mail/vacationnotice/settings/model'], function (model) {

    'use strict';

    var dataViaModel = {
        'activateTimeFrame': false,
        'addresses': ['tester@open-xchange.com'],
        'dateFrom': 1385655152016,
        'dateUntil': 1386259952016,
        'days': '7',
        'id': 1,
        'internal_id': 'vacation',
        'primaryMail': 'tester@open-xchange.com',
        'subject': 'subject',
        'text': 'text',
        'tester@open-xchange.com': true
    },
    dataPrepared = {
        'actioncmds': [{
            'addresses': ['tester@open-xchange.com'],
            'days': '7',
            'id': 'vacation',
            'subject': 'subject',
            'text': 'text'
        }],
        'active': true,
        'id': 1,
        'test': {
            'id': 'true'
        }
    };

    describe('Mailfilter Vacationnotice', function () {

        it('should prepare the data', function () {

            dataPrepared.should.be.deep.equal(model.protectedMethods.providePreparedData(dataViaModel));

        });

        it('should prepare the data for two active mails', function () {
            dataViaModel['tester2@open-xchange.com'] = true;
            dataPrepared.actioncmds[0].addresses = ['tester@open-xchange.com', 'tester2@open-xchange.com'];

            dataPrepared.should.be.deep.equal(model.protectedMethods.providePreparedData(dataViaModel));

        });

        it('should prepare the data for no active mail', function () {
            dataViaModel['tester2@open-xchange.com'] = false;
            dataViaModel['tester@open-xchange.com'] = false;

            dataPrepared.actioncmds[0].addresses = ['tester@open-xchange.com'];
            dataPrepared.active = false;

            dataPrepared.should.be.deep.equal(model.protectedMethods.providePreparedData(dataViaModel));

        });

    });

});
