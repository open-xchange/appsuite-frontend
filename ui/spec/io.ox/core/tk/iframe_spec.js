/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define([
    'io.ox/core/tk/iframe'
], function (main) {

    'use strict';

    var appOptions = {
            name: 'com.example',
            title: 'Hallo, World!',
            pageTitle: 'Hallo, World!',
            url: 'https://example.com/index.html?test=test',
            acquireToken: true
        },
        appOptionsWithoutToken = {
            name: 'com.example',
            title: 'Hallo, World!',
            pageTitle: 'Hallo, World!',
            url: 'https://example.com'
        },
        appOptionsWithoutParameter = {
            name: 'com.example',
            title: 'Hallo, World!',
            pageTitle: 'Hallo, World!',
            url: 'https://example.com/index.html',
            acquireToken: true
        },

        response = {
            'timestamp': 1379403021960,
            'data': {
                'token': 1234567890
            }
        },

        app;

    describe('iframe app', function () {

        beforeEach(function () {
            app = main(appOptions).getApp();

            this.server.respondWith('GET', /api\/token\?action=acquireToken/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(response));
            });
            return app.launch();
        });

        afterEach(function () {
            return app.quit();
        });

        it('should provide a getApp function', function () {
            expect(main(appOptions).getApp()).to.exist;
        });

        it('should provide a launch function', function () {
            expect(main(appOptions).getApp().launch).to.be.a('function');
        });

        it('should open the iframe app', function () {
            expect(app.get('state')).to.equal('running');
        });

        it('should render the app name', function () {
            expect(app.getWindow().nodes.outer.attr('data-app-name')).to.equal(appOptions.name);
        });

        it('should render the iframe', function () {
            expect(app.getWindow().nodes.main.find('iframe').length).to.equal(1);
        });

        it('should render the iframe src', function () {
            expect(app.getWindow().nodes.main.find('iframe').attr('src')).to.equal(appOptions.url + '&ox_token=' + response.data.token);
        });

    });

    describe('iframe app without token', function () {

        beforeEach(function () {
            app = main(appOptionsWithoutToken).getApp();
            return app.launch();
        });

        afterEach(function () {
            return app.quit();
        });

        it('should render the iframe', function () {
            expect(app.getWindow().nodes.main.find('iframe').length).to.equal(1);
        });

        it('should render the iframe src without appended token', function () {
            expect(app.getWindow().nodes.main.find('iframe').attr('src')).to.equal(appOptionsWithoutToken.url);
        });

    });

    describe('iframe app without appended parameter', function () {

        beforeEach(function () {
            app = main(appOptionsWithoutParameter).getApp();

            this.server.respondWith('GET', /api\/token\?action=acquireToken/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(response));
            });
            return app.launch();
        });

        afterEach(function () {
            return app.quit();
        });


        it('should render the iframe src', function () {
            expect(app.getWindow().nodes.main.find('iframe').attr('src')).to.equal(appOptionsWithoutParameter.url + '?ox_token=' + response.data.token);
        });

    });

});
