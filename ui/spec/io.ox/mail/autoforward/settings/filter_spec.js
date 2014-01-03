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

define(['io.ox/mail/autoforward/settings/filter', 'gettext!io.ox/mail'], function (filter, gt) {

    'use strict';

    var resultWithFlag = { timestamp: 1378223251586,
        'data': [{
            'position': 1,
            'id': 1,
            'flags': ['autoforward'],
            'test': {
                'id': 'true'
            },
            'actioncmds': [{
                'to': 'tester@open-xchange.com',
                'id': 'redirect'
            },
            {
                'id': 'keep'
            }],
            'rulename': 'autoforward',
            'active': false
        }]
    },
    multiValues = {};
    
    describe('Vacationnotice', function () {

        beforeEach(function () {
            this.server.autoRespond = false;
            this.server.respondWith('GET', /api\/mailfilter\?action=list&flag=autoforward/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(resultWithFlag));
            });
            $('body', document).append(this.node = $('<div id="autoforwardtestNode">'));

        });

        afterEach(function () {
            $('#autoforwardtestNode', document).remove();
        });

        it('should draw the form', function () {
            filter.editAutoForward(this.node, multiValues, 'tester@open-xchange.com');
            this.server.respond();
            expect(this.node.find('input[name="forwardmail"]').length).toBe(1);
            expect(this.node.find('input[name="forwardmail"]').val()).toBe('tester@open-xchange.com');
            expect(this.node.find('input[type="checkbox"]').length).toBe(1);
            expect(this.node.find('input[type="checkbox"]').prop('checked')).toBe(false);
        });

    });

});
