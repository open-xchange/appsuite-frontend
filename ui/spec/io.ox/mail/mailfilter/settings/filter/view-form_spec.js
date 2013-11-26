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
            
            // $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Sender/From') +')').click();
            // expect($popup.find('li.filter-settings-view').length).toBe(1);
            
        });

        it('should draw the Sender/From condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Sender/From') +')').click();
            expect($popup.find('li.filter-settings-view').length).toBe(1);
        });

    
    });

});
