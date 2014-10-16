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
            expect(upload.getEstimatedTime()).to.equal('0 seconds');
        });

        describe('time estimation', function () {
            var clock,
                file = { file: { name: 'some name', size: 1000000 } };

            beforeEach(function () {
                //use fake timers to manipulate progress
                clock = sinon.useFakeTimers();

                this.server.autoRespond = false;

                //appends a file to the queue
                upload.changed(file, 0, [file]);
            });
            afterEach(function () {
                this.server.autoRespond = true;
                clock.restore();
                upload.stop();
            });
            it('calculates nothing without progress', function () {
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s seconds', 0));
            });
            it('returns pending deffered object', function () {
                var request = upload.progress(file, 0, [file]);

                expect(request).to.be.an('object');
                expect(request).to.have.property('notify');
                expect(request.state()).to.equal('pending');
            });
            it('calculates weeks', function () {
                var request = upload.progress(file, 0, [file]);

                request.notify({ loaded: 1, total: 1000000 });
                clock.tick(1000);
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s weeks', 2));
            });
            it('calculates 1 week', function () {
                var request = upload.progress(file, 0, [file]);

                request.notify({ loaded: 1, total: 1000000 });
                clock.tick(800);
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s week', 1));
            });
            it('calculates days', function () {
                var request = upload.progress(file, 0, [file]);

                request.notify({ loaded: 2, total: 1000000 });
                clock.tick(1100);
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s days', 6));
            });
            it('calculates 1 day', function () {
                var request = upload.progress(file, 0, [file]);

                request.notify({ loaded: 5, total: 1000000 });
                clock.tick(450);
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s day', 1));
            });
            it('calculates hours', function () {
                var request = upload.progress(file, 0, [file]);

                request.notify({ loaded: 20, total: 1000000 });
                clock.tick(450);
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s hours', 6));
            });
            it('calculates 1 hour', function () {
                var request = upload.progress(file, 0, [file]);

                request.notify({ loaded: 30, total: 1000000 });
                clock.tick(120);
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s hour', 1));
            });
            it('calculates minutes', function () {
                var request = upload.progress(file, 0, [file]);

                request.notify({ loaded: 83, total: 1000000 });
                clock.tick(100);
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s minutes', 20));
            });
            it('calculates 1 minute', function () {
                var request = upload.progress(file, 0, [file]);

                request.notify({ loaded: 350, total: 1000000 });
                clock.tick(25);
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s minute', 1));
            });
            it('calculates seconds', function () {
                var request = upload.progress(file, 0, [file]);

                request.notify({ loaded: 350, total: 1000000 });
                clock.tick(20);
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s seconds', 57));
            });
            it('calculates 1 second', function () {
                var request = upload.progress(file, 0, [file]);

                request.notify({ loaded: 1000, total: 1000000 });
                clock.tick(1);
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s second', 1));
            });
            it('calculates progress', function () {
                var request = upload.progress(file, 0, [file]);

                request.notify({ loaded: 350, total: 1000000 });
                clock.tick(20);
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s seconds', 57));

                request.notify({ loaded: 500000, total: 1000000 });
                clock.tick(28000);
                expect(upload.getEstimatedTime()).to.equal(gt('%1$s seconds', 28));
            });
        });
    });
});
