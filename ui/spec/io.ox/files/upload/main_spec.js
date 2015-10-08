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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define([
    'io.ox/files/upload/main',
    'gettext!io.ox/files'
], function (upload, gt) {

    'use strict';

    describe('upload api', function () {
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
