/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define(['io.ox/calendar/api'], function (api) {
    var inputData = {
            folder_id: '123',
            id: '456',
            start_date: '1412154498372',
            end_date: '1412158137977'
        },
        responseData = [{
            folder_id: '123',
            id: '456',
            start_date: '1412154498372',
            end_date: '1412158137977',
            users: [{ confirmation: 1,
            id: 1337 }]
        },
    {
        folder_id: '123',
        id: '457',
        start_date: '1412153604659',
        end_date: '1412157193355',
        users: [{ confirmation: 2, id: 111 },
        { confirmation: 1, id: 1337 }]
    }];

    return describe('Calendar API', function () {
        beforeEach(function () {
            this.server.autoRespond = true;
            this.server.respondWith('GET', /api\/calendar\?action=all/, function (xhr) {
                xhr.respond(200, {
                    'Content-Type': 'text/javascript;charset=UTF-8'
                },
                    JSON.stringify({
                        timestamp: 1368791630910,
                        data: responseData
                    })
                );
            });
        });

        describe('checkConflicts', function () {

            it('should return conflicts', function () {
                return api.checkConflicts(inputData).done(function (conflicts) {
                    expect(conflicts).not.to.be.empty;
                });
            });

            it('should not return own appointment', function () {
                return api.checkConflicts(inputData).done(function (conflicts) {
                    _(conflicts).each(function (conflict) {
                        expect(conflict.id).not.to.equal('456');
                    });
                });
            });
        });
    });
});
