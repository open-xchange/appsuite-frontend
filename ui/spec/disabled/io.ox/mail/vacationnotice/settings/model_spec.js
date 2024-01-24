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
