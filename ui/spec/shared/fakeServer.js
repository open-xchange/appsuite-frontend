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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

(function () {

    beforeEach(function () {
        this.server = ox.fakeServer.create();
        this.server.respondUntilResolved = function (def) {
            while (def.state() !== 'resolved') {
                this.respond();
            }
        };
        this.server.autoRespond = true;

        this.server.respondWith('PUT', /api\/multiple\?/, function (xhr) {
            var actions = JSON.parse(xhr.requestBody),
                result = new Array(actions.length);

            actions.forEach(function (action, index) {
                result[index] = {
                    data: {}
                };
            });
            xhr.respond(200,  { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(result));
        });
    });

}());
