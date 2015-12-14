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
    'gettext!io.ox/tasks',
    'io.ox/tasks/settings/pane'
], function (ext, gt) {

    describe.skip('Tasks Settings', function () {
        beforeEach(function () {

            $('body', document).append(this.node = $('<div id="tasksettingsNode">'));
            ext.point('io.ox/tasks/settings/detail').invoke('draw', this.node);

        });

        afterEach(function () {
            $('#tasksettingsNode', document).remove();
        });

        it('should draw the form', function () {
            this.node.find('h1').length.should.be.equal(1);
            this.node.find('h1').text().should.be.equal(gt.pgettext('app', 'Tasks'));

            this.node.find('input[name="notifyNewModifiedDeleted"]').length.should.be.equal(1);
            this.node.find('input[name="notifyNewModifiedDeleted"]').parent().text().should.be.equal(gt('Email notification for New, Changed, Deleted?'));

            this.node.find('input[name="notifyAcceptedDeclinedAsCreator"]').length.should.be.equal(1);
            this.node.find('input[name="notifyAcceptedDeclinedAsCreator"]').parent().text().should.be.equal(gt('Email notification for task creator?'));

            this.node.find('input[name="notifyAcceptedDeclinedAsParticipant"]').length.should.be.equal(1);
            this.node.find('input[name="notifyAcceptedDeclinedAsParticipant"]').parent().text().should.be.equal(gt('Email notification for task participant?'));

        });

    });

});
