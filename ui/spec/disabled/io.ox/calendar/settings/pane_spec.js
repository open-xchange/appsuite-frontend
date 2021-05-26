/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define([
    'io.ox/core/extensions',
    'gettext!io.ox/calendar',
    'io.ox/calendar/settings/pane'
], function (ext, gt) {

    describe('Calendar settings', function () {
        beforeEach(function () {

            $('body', document).append(this.node = $('<div id="calendarsettingsNode">'));
            ext.point('io.ox/calendar/settings/detail').invoke('draw', this.node);

        });

        afterEach(function () {
            this.node.remove();
        });

        it('should draw the form', function () {
            this.node.find('h1').should.have.length(1);
            this.node.find('h1').text().should.be.equal(gt.pgettext('app', 'Calendar'));

            this.node.find('select[id="interval"]').should.have.length(1);
            this.node.find('select[id="interval"]').children().should.have.length(6);

            this.node.find('select[id="startTime"]').should.have.length(1);
            this.node.find('select[id="startTime"]').children().should.have.length(24);

            this.node.find('select[id="endTime"]').should.have.length(1);
            this.node.find('select[id="endTime"]').children().should.have.length(24);

            this.node.find('input[name="showDeclinedAppointments"]').should.have.length(1);
            this.node.find('input[name="showDeclinedAppointments"]').parent().text().should.be.equal(gt('Show declined appointments'));

            this.node.find('input[name="markFulltimeAppointmentsAsFree"]').should.have.length(1);
            this.node.find('input[name="markFulltimeAppointmentsAsFree"]').parent().text().should.be.equal(gt('Mark all day appointments as free'));

            this.node.find('input[name="notifyNewModifiedDeleted"]').should.have.length(1);
            this.node.find('input[name="notifyNewModifiedDeleted"]').parent().text().should.be.equal(gt('Receive notification for appointment changes'));

            this.node.find('input[name="notifyAcceptedDeclinedAsCreator"]').should.have.length(1);
            this.node.find('input[name="notifyAcceptedDeclinedAsCreator"]').parent().text().should.be.equal(gt('Receive notification as appointment creator when participants accept or decline'));

            this.node.find('input[name="notifyAcceptedDeclinedAsParticipant"]').should.have.length(1);
            this.node.find('input[name="notifyAcceptedDeclinedAsParticipant"]').parent().text().should.be.equal(gt('Receive notification as appointment participant when other participants accept or decline'));

            this.node.find('input[name="deleteInvitationMailAfterAction"]').should.have.length(1);
            this.node.find('input[name="deleteInvitationMailAfterAction"]').parent().text().should.be.equal(gt('Automatically delete the invitation email after the appointment has been accepted or declined'));
        });

    });

});
