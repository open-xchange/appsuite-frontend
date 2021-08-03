/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define([
    'io.ox/files/upload/main'
], function (upload) {

    'use strict';

    describe('Files upload api', function () {
        it('has no inital estimation time', function () {
            expect(upload.getEstimatedTime()).to.equal('0 Sekunden');
        });

        describe('time estimation', function () {
            var clock,
                file = { file: { name: 'some name', size: 1000000 } },
                xhr,
                requests;

            function uploadProgress(obj) {
                requests[0].uploadProgress(obj);
            }

            beforeEach(function () {
                //use fake timers to manipulate progress
                clock = sinon.useFakeTimers();

                //clear requests
                requests = [];

                this.server.autoRespond = false;

                //setup fake html request
                xhr = sinon.useFakeXMLHttpRequest();
                xhr.onCreate = function (xhr) {
                    requests.push(xhr);
                };

                //appends a file to the queue
                upload.changed(file, 0, [file]);
            });
            afterEach(function () {
                xhr.restore();
                this.server.autoRespond = true;
                clock.restore();
                upload.stop();
            });
            it('calculates nothing without progress', function () {
                expect(upload.getEstimatedTime()).to.equal('0 Sekunden');
            });
            it('returns pending deffered object', function () {
                var request = upload.progress(file, 0, [file]);

                expect(request).to.be.an('object');
                expect(request.state()).to.equal('pending');
            });
            it('calculates weeks', function () {
                upload.progress(file, 0, [file]);

                clock.tick(1000);
                uploadProgress({ loaded: 1, total: 1000000 });

                expect(upload.getEstimatedTime()).to.equal('2 Wochen');
            });
            it('calculates 1 week', function () {
                upload.progress(file, 0, [file]);

                clock.tick(800);
                uploadProgress({ loaded: 1, total: 1000000 });

                expect(upload.getEstimatedTime()).to.equal('1 Woche');
            });
            it('calculates days', function () {
                upload.progress(file, 0, [file]);

                clock.tick(1100);
                uploadProgress({ loaded: 2, total: 1000000 });

                expect(upload.getEstimatedTime()).to.equal('6 Tage');
            });
            it('calculates 1 day', function () {
                upload.progress(file, 0, [file]);

                clock.tick(450);
                uploadProgress({ loaded: 5, total: 1000000 });

                expect(upload.getEstimatedTime()).to.equal('1 Tag');
            });
            it('calculates hours', function () {
                upload.progress(file, 0, [file]);

                clock.tick(450);
                uploadProgress({ loaded: 20, total: 1000000 });

                expect(upload.getEstimatedTime()).to.equal('6 Stunden');
            });
            it('calculates 1 hour', function () {
                upload.progress(file, 0, [file]);

                clock.tick(120);
                uploadProgress({ loaded: 30, total: 1000000 });

                expect(upload.getEstimatedTime()).to.equal('1 Stunde');
            });
            it('calculates minutes', function () {
                upload.progress(file, 0, [file]);

                clock.tick(100);
                uploadProgress({ loaded: 83, total: 1000000 });

                expect(upload.getEstimatedTime()).to.equal('20 Minuten');
            });
            it('calculates 1 minute', function () {
                upload.progress(file, 0, [file]);

                clock.tick(25);
                uploadProgress({ loaded: 350, total: 1000000 });

                expect(upload.getEstimatedTime()).to.equal('1 Minute');
            });
            it('calculates seconds', function () {
                upload.progress(file, 0, [file]);

                clock.tick(20);
                uploadProgress({ loaded: 350, total: 1000000 });

                expect(upload.getEstimatedTime()).to.equal('57 Sekunden');
            });
            it('calculates 1 second', function () {
                upload.progress(file, 0, [file]);

                clock.tick(1);
                uploadProgress({ loaded: 1000, total: 1000000 });

                expect(upload.getEstimatedTime()).to.equal('1 Sekunde');
            });
            it('calculates progress', function () {
                upload.progress(file, 0, [file]);

                clock.tick(20);
                uploadProgress({ loaded: 350, total: 1000000 });

                expect(upload.getEstimatedTime()).to.equal('57 Sekunden');

                clock.tick(28000);
                uploadProgress({ loaded: 500000, total: 1000000 });

                expect(upload.getEstimatedTime()).to.equal('28 Sekunden');
            });
        });
    });
});
