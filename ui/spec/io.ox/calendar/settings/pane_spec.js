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

            this.node.find('select[id="interval_in_minutes"]').length.should.be.equal(1);
            this.node.find('select[id="working_time_start"]').length.should.be.equal(1);
            this.node.find('select[id="working_time_end"]').length.should.be.equal(1);

            this.node.find('input[name="showDeclinedAppointments"]').length.should.be.equal(2),
            this.node.find('input[name="showDeclinedAppointments"]').first().parent().text().should.be.equal(gt('Yes'));
            this.node.find('input[name="showDeclinedAppointments"]').last().parent().text().should.be.equal(gt('No'));

            this.node.find('select[id="time_for_reminder"]').length.should.be.equal(1);

            this.node.find('input[name="markFulltimeAppointmentsAsFree"]').length.should.be.equal(2),
            this.node.find('input[name="markFulltimeAppointmentsAsFree"]').first().parent().text().should.be.equal(gt('Yes'));
            this.node.find('input[name="markFulltimeAppointmentsAsFree"]').last().parent().text().should.be.equal(gt('No'));

            this.node.find('input[name="notifyNewModifiedDeleted"]').length.should.be.equal(2),
            this.node.find('input[name="notifyNewModifiedDeleted"]').first().parent().text().should.be.equal(gt('Yes'));
            this.node.find('input[name="notifyNewModifiedDeleted"]').last().parent().text().should.be.equal(gt('No'));
            
            this.node.find('input[name="notifyAcceptedDeclinedAsCreator"]').length.should.be.equal(2),
            this.node.find('input[name="notifyAcceptedDeclinedAsCreator"]').first().parent().text().should.be.equal(gt('Yes'));
            this.node.find('input[name="notifyAcceptedDeclinedAsCreator"]').last().parent().text().should.be.equal(gt('No'));

            this.node.find('input[name="notifyAcceptedDeclinedAsParticipant"]').length.should.be.equal(2),
            this.node.find('input[name="notifyAcceptedDeclinedAsParticipant"]').first().parent().text().should.be.equal(gt('Yes'));
            this.node.find('input[name="notifyAcceptedDeclinedAsParticipant"]').last().parent().text().should.be.equal(gt('No'));

            this.node.find('input[name="deleteInvitationMailAfterAction"]').length.should.be.equal(2),
            this.node.find('input[name="deleteInvitationMailAfterAction"]').first().parent().text().should.be.equal(gt('Yes'));
            this.node.find('input[name="deleteInvitationMailAfterAction"]').last().parent().text().should.be.equal(gt('No'));
            
        });

    });

});
