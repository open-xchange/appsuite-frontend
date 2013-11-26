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

define(['io.ox/mail/mailfilter/settings/filter', 'gettext!io.ox/settings/settings'], function (filters, gt) {

    'use strict';

    var resultWithoutFilter = { data: [] };

    describe('Mailfilter filter without rules', function () {

        var $container = $('<div>'),
            addButton,
            $popup;

        beforeEach(function () {
            this.server = ox.fakeServer.create();
            // this.server.autoRespond = true;
            this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(resultWithoutFilter));
            });

        });

        afterEach(function () {
            this.server.restore();
            $popup.remove();
        });

        it('should open the new rule dialog', function () {
           
            filters.editMailfilter($container);
            this.server.respond();

            addButton = $container.find('.btn-primary[data-action="add"]');
            addButton.click();
            $popup = $('body').find('.io-ox-mailfilter-edit').closest('.io-ox-dialog-popup');

            expect($popup.length).toBe(1);

        });

        it('should draw all initial ui componets', function () {

            expect($popup.find('[name="rulename"]').length).toBe(1);
            expect($popup.find('.alert.alert-block').length).toBe(1);
            expect($popup.find('a[data-toggle="dropdown"]:contains(' + gt('Add condition') + ')').length).toBe(1);
            expect($popup.find('a[data-toggle="dropdown"]:contains(' + gt('Add action') + ')').length).toBe(1);
            expect($popup.find('[data-action="check-for-stop"]').length).toBe(1);

        });

        it('should fill the dropdowns with all available conditions and actions', function () {
            // conditions
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Sender/From') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Any recipient') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Subject') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mailing list') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('To') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('CC') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Header') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Envelope') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Size (bytes)') +')').length).toBe(1);

            // actions
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Keep') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Discard') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Redirect to') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Move to folder') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Reject with reason') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mark mail as') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Tag mail with') +')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Flag mail with') +')').length).toBe(1);
            
        });

        it('should draw the Sender/From condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Sender/From') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Any recipient condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Any recipient') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Subject condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Subject') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Mailing list condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mailing list') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the To condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('To') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the CC condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('CC') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Header condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Header') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test-second"]').length).toBe(1);
            
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Envelope condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Envelope') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Size (bytes) condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Size (bytes)') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="over"]').length).toBe(1);
            expect($popup.find('li li a[data-value="under"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Keep action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Keep') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Discard action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Discard') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li.filter-settings-view').hasClass('warning')).toBe(true);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Redirect to action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Redirect to') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-action"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Move to folder action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Move to folder') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li a.folderselect').length).toBe(1);
            expect($popup.find('li input[disabled="disabled"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Reject with reason action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Reject with reason') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-action"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Mark mail as action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mark mail as') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-action="change-value-actions"]').length).toBe(2);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Tag mail with action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Tag mail with') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-action"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Flag mail with action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Flag mail with') +')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li div.flag-dropdown').length).toBe(1);
            expect($popup.find('li li a[data-action="change-color"]').length).toBe(11);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

    });

});
