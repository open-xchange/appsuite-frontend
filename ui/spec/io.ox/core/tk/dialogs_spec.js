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
 * @author David Bauer <david.bauer@open-xchange.com>
 */
define(['io.ox/core/tk/dialogs'], function (dialogs) {

    var dialogTitle = 'This is a dialog title that is completly useless.';

    describe('Modal Dialog', function () {

        beforeEach(function () {
            $('body', document).append(this.node = $('<div id="testNode">'));
            this.dialog = new dialogs.ModalDialog({ container: this.node })
                .text(dialogTitle)
                .addButton('cancel', 'Cancel', 'cancel', {tabIndex: '1'})
                .addPrimaryButton('delete', 'Delete', 'delete', {tabIndex: '1'})
                .show();
        });

        afterEach(function () {
            $('#testNode', document).remove();
        });

        it('should initialize', function () {
            expect(this.node.find('.io-ox-dialog-popup')).to.have.length.above(0);
        });

        it('should have a body', function () {
            expect(this.node.find('.modal-body')).to.have.length.above(0);
        });

        it('should have a footer', function () {
            expect(this.node.find('.modal-footer')).to.have.length.above(0);
        });

        it('should have a title', function () {
            expect(this.node.find('.modal-body .plain-text').text()).to.equal(dialogTitle);
        });

        it('should have a cancel button', function () {
            expect(this.node.find('[data-action="cancel"]')).to.have.length.above(0);
        });

        it('should have a delete button', function () {
            expect(this.node.find('[data-action="delete"]')).to.have.length.above(0);
        });

        it('should close when cancel button is clicked', function () {
            expect(this.node.find('.io-ox-dialog-popup')).to.have.length.above(0);
            this.node.find('[data-action="cancel"]').click();
            expect(this.node.find('.io-ox-dialog-popup')).to.have.length(0);
        });

        it('should close on escape keydown', function () {
            var e = $.Event('keydown', { keyCode: 27});
            this.node.find('.io-ox-dialog-popup').trigger(e);
            expect(this.node.find('.io-ox-dialog-popup')).to.have.length(0);
        });

        it('should trap focus on tab keydown', function () {
            var deleteButton = this.node.find('button[data-action="delete"]');
            expect($(document.activeElement)[0]).to.equal(deleteButton[0]);

            var e = $.Event('keydown', { keyCode: 9});
            for (var i = 0; i < 4; i++) {
                $(document.activeElement).trigger(e);
            }

            expect($(document.activeElement)[0]).to.equal(deleteButton[0]);
        });

        it('primary button should have focus', function () {
            var deleteButton = this.node.find('button[data-action="delete"]');
            expect($(document.activeElement)[0]).to.equal(deleteButton[0]);
        });

        it('should remove blockscroll class on container when closed', function () {
            this.dialog.done(function (dialog) { dialog.close(); });
            expect(this.node.find('.io-ox-dialog-popup').hasClass('blockscroll')).to.be.false;
        });

    });

    describe('Modal Dialog (Busy)', function () {

        beforeEach(function () {
            $('body', document).append(this.node = $('<div id="testNode">'));
            this.dialog = new dialogs.ModalDialog({ container: this.node })
                .text(dialogTitle)
                .addButton('cancel', 'Cancel')
                .addPrimaryButton('delete', 'Delete');
        });

        afterEach(function () {
            $('#testNode', document).remove();
        });

        it('primary button should be disabled', function () {
            expect(this.node.find('[data-action="delete"]')).to.be.disabled;
        });

        it('cancel button should be disabled', function () {
            expect(this.node.find('[data-action="cancel"]')).to.be.disabled;
        });

        it('primary button should not be disabled when set to idle', function () {
            this.dialog.busy().idle();
            expect(this.node.find('[data-action="cancel"]')).not.to.be.disabled;
        });

    });

    // Todo testing of sidepopup should be done, yet for some reason it is does not get drawn in the dom.
    /*describe('Sidepopup (Dialog)', function () {

    });
    */
});
