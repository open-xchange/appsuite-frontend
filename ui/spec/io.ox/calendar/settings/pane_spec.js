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
define([
    'io.ox/core/extensions',
    'gettext!io.ox/calendar',
    'io.ox/calendar/settings/pane'
], function (ext, gt) {

    describe('calendarsettings', function () {
        beforeEach(function () {

            $('body', document).append(this.node = $('<div id="calendarsettingsNode">'));
            ext.point('io.ox/calendar/settings/detail').invoke('draw', this.node);

        });

        afterEach(function () {
            $('#calendarsettingsNode', document).remove();
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

            this.node.find('select[id="defaultReminder"]').should.have.length(1);
            this.node.find('select[id="defaultReminder"]').children().should.have.length(21);

            this.node.find('input[name="markFulltimeAppointmentsAsFree"]').should.have.length(1);
            this.node.find('input[name="markFulltimeAppointmentsAsFree"]').parent().text().should.be.equal(gt('Mark all day appointments as free'));

            this.node.find('input[name="notifyNewModifiedDeleted"]').should.have.length(1);
            this.node.find('input[name="notifyNewModifiedDeleted"]').parent().text().should.be.equal(gt('Email notification for New, Changed, Deleted?'));

            this.node.find('input[name="notifyAcceptedDeclinedAsCreator"]').should.have.length(1);
            this.node.find('input[name="notifyAcceptedDeclinedAsCreator"]').parent().text().should.be.equal(gt('Email notification for appointment creator?'));

            this.node.find('input[name="notifyAcceptedDeclinedAsParticipant"]').should.have.length(1);
            this.node.find('input[name="notifyAcceptedDeclinedAsParticipant"]').parent().text().should.be.equal(gt('Email notification for appointment participant?'));

            this.node.find('input[name="deleteInvitationMailAfterAction"]').should.have.length(1);
            this.node.find('input[name="deleteInvitationMailAfterAction"]').parent().text().should.be.equal(gt('Automatically delete a notification mail after it has been accepted or declined?'));

        });

    });

});
