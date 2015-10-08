/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define([
    'io.ox/core/api/mailfilter'
], function (api) {

    'use strict';

    describe('Core', function () {
        describe('Mailfilter Api', function () {

            var listResult = {
                'data': [
                    {
                        'position': 0,
                        'id': 0,
                        'flags': ['vacation'],
                        'test': { 'id': 'true' },
                        'actioncmds': [{
                            'id': 'vacation',
                            'text': 'Testtext',
                            'days': '7',
                            'subject': 'Test',
                            'addresses': ['test@test.open-xchange.com']
                        }],
                        'rulename': 'vacation notice',
                        'active': false
                    },
                    {
                        'position': 1,
                        'id': 1,
                        'flags': ['autoforward'],
                        'test': {
                            'headers': ['To'],
                            'id': 'header',
                            'values': ['test@test.open-xchange.com'],
                            'comparison': 'contains'
                        },
                        'actioncmds': [
                            {
                                'to': 'test2@test.open-xchange.com',
                                'id': 'redirect'
                            },
                            { 'id': 'keep' }
                        ],
                        'rulename': 'autoforward',
                        'active': false
                    }
                ]
            };

            beforeEach(function () {
                this.server.autoRespond = false;

                this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(listResult));
                });

                this.server.respondWith('PUT', /api\/mailfilter\?action=delete/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"data":null}');
                });

                this.server.respondWith('PUT', /api\/mailfilter\?action=new/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"data":1}');
                });

                this.server.respondWith('PUT', /api\/mailfilter\?action=update/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"data":null}');
                });

                this.server.respondWith('PUT', /api\/mailfilter\?action=reorder/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"data":null}');
                });
            });

            it('should return available filters', function () {
                var result = api.getRules();
                expect(result.state()).to.equal('pending');
                this.server.respond();
                expect(result.state()).to.equal('resolved');
            });

            it('should delete a specified rule', function () {
                var result = api.deleteRule();
                expect(result.state()).to.equal('pending');
                this.server.respond();
                expect(result.state()).to.equal('resolved');
            });

            it('should return the id of the created rule', function () {
                var result = api.create();
                expect(result.state()).to.equal('pending');
                this.server.respond();
                expect(result.state()).to.equal('resolved');
            });

            it('should update a specified rule', function () {
                var result = api.update();
                expect(result.state()).to.equal('pending');
                this.server.respond();
                expect(result.state()).to.equal('resolved');
            });

            it('should reorder the rules', function () {
                var result = api.reorder();
                expect(result.state()).to.equal('pending');
                this.server.respond();
                expect(result.state()).to.equal('resolved');
            });

        });
    });
});
