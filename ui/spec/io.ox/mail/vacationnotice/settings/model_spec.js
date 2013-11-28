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

    describe('Vacationnotice with one active mail', function () {

        it('should draw the form', function () {

            dataPrepared.should.be.deep.equal(model.protectedMethods.providePreparedData(dataViaModel));

        });

    });

});
