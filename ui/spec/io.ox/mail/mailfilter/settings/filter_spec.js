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

define(['io.ox/mail/mailfilter/settings/filter', 'gettext!io.ox/mail'], function (filters, gt) {

    'use strict';

    var resultWithFilter = {timestamp: 1378223251586, data: [{
            'position': 0,
            'id': 0,
            'flags': [],
            'test': {
                'headers': ['To', 'Cc'],
                'id': 'header',
                'values': [''],
                'comparison': 'matches'
            },
            'actioncmds': [{
                'id': 'addflags',
                'flags': ['$cl_1']
            }],
            'rulename': 'New rule',
            'active': true
        },
        {
            'position': 1,
            'id': 1,
            'flags': ['vacation'],
            'test': {'id': 'true'},
            'actioncmds': [{
                'id': 'vacation',
                'text': 'text',
                'days': '7',
                'subject': 'subject',
                'addresses': ['tester@open-xchange.com']
            }],
            'rulename': 'Abwesenheitsnotiz',
            'active': false
        }, {
            'position': 2,
            'id': 2,
            'flags': [],
            'test': {
                'headers': ['To', 'Cc'],
                'id': 'header',
                'values': [''],
                'comparison': 'matches'
            },
            'actioncmds': [{
                'id': 'addflags',
                'flags': ['$cl_1']
            }],
            'rulename': 'New rule 2',
            'active': false
        }]
    },

        resultWithoutFilter = { data: [] };

    describe('Mailfilter filter with rules', function () {

        beforeEach(function () {
            this.server = ox.fakeServer.create();
            // this.server.autoRespond = true;
            this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(resultWithFilter));
            });

        });

        afterEach(function () {
            this.server.restore();
        });

        it('should draw the list of tests', function () {
            var $container = $('<div>');
            filters.editMailfilter($container);
            this.server.respond();

            expect($container.find('h1').length).toBe(1);
            expect($container.find('.btn-primary[data-action="add"]').length).toBe(1);
            expect($container.find('li[data-id="0"]').length).toBe(1);
            expect($container.find('li[data-id="0"]').hasClass('editable')).toBe(true);
            expect($container.find('li[data-id="1"]').length).toBe(1);
            expect($container.find('li[data-id="1"]').hasClass('editable')).toBe(false);
            expect($container.find('li[data-id="2"]').hasClass('disabled')).toBe(true);
            expect($container.find('li a.drag-handle').length).toBe(3);
            expect($container.find('li .list-title').length).toBe(3);
            expect($container.find('li [data-action="edit"]').length).toBe(2);
            expect($container.find('li [data-action="toggle"]').length).toBe(2);
            expect($container.find('li [data-action="delete"]').length).toBe(2);

        });

    });

    describe('Mailfilter filter without rules', function () {

        beforeEach(function () {
            this.server = ox.fakeServer.create();
            // this.server.autoRespond = true;
            this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(resultWithoutFilter));
            });

        });

        afterEach(function () {
            this.server.restore();
        });

        it('should draw the empty list', function () {
            var $container = $('<div>');
            filters.editMailfilter($container);
            this.server.respond();

            expect($container.find('h1').length).toBe(1);
            expect($container.find('.btn-primary[data-action="add"]').length).toBe(1);
            expect($container.find('h1').length).toBe(1);
            expect($container.find('ol div').text()).toBe(gt('There is no rule defined'));

        });

        it('should trigger the create new rule dialog', function () {
            var $container = $('<div>'),
                addButton,
                $popup;
            filters.editMailfilter($container);
            this.server.respond();

            addButton = $container.find('.btn-primary[data-action="add"]');
            addButton.trigger('click');

            $popup = $('body').find('h4:contains("' + gt('Create new rule') + '")').closest('.io-ox-dialog-popup');
            expect($popup.length).toBe(1);

        });

    });

});
