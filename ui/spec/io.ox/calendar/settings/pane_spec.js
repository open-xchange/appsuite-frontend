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
 define(['io.ox/core/extensions',
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
            this.node.find('h1').length.should.be.equal(1);
            this.node.find('h1').text().should.be.equal(gt.pgettext('app', 'Calendar'));

            this.node.find('select[id="interval"]').length.should.be.equal(1);
            this.node.find('select[id="interval"]').children().length.should.be.equal(6);

            this.node.find('select[id="startTime"]').length.should.be.equal(1);
            this.node.find('select[id="startTime"]').children().length.should.be.equal(24);

            this.node.find('select[id="endTime"]').length.should.be.equal(1);
            this.node.find('select[id="endTime"]').children().length.should.be.equal(24);

            this.node.find('input[name="showDeclinedAppointments"]').length.should.be.equal(1);
            this.node.find('input[name="showDeclinedAppointments"]').prev().text(gt('Show declined appointments'));

            this.node.find('select[id="defaultReminder"]').length.should.be.equal(1);
            this.node.find('select[id="defaultReminder"]').children().length.should.be.equal(21);

            this.node.find('input[name="markFulltimeAppointmentsAsFree"]').length.should.be.equal(1);
            this.node.find('input[name="markFulltimeAppointmentsAsFree"]').prev().text(gt('Mark all day appointments as free'));

            this.node.find('input[name="notifyNewModifiedDeleted"]').length.should.be.equal(1);
            this.node.find('input[name="notifyNewModifiedDeleted"]').prev().text(gt('Email notification for New, Changed, Deleted?'));

            this.node.find('input[name="notifyAcceptedDeclinedAsCreator"]').length.should.be.equal(1);
            this.node.find('input[name="notifyAcceptedDeclinedAsCreator"]').prev().text(gt('Email notification for appointment creator?'));

            this.node.find('input[name="notifyAcceptedDeclinedAsParticipant"]').length.should.be.equal(1);
            this.node.find('input[name="notifyAcceptedDeclinedAsParticipant"]').prev().text(gt('Email notification for appointment participant?'));

            this.node.find('input[name="deleteInvitationMailAfterAction"]').length.should.be.equal(1);
            this.node.find('input[name="deleteInvitationMailAfterAction"]').prev().text(gt('Automatically delete a notification mail after it has been accepted or declined?'));
            
        });

    });

});
