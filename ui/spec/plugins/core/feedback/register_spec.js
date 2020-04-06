/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define([
    'plugins/core/feedback/register',
    'settings!io.ox/core'
], function (feedback, settings) {
    'use strict';

    describe('Feedback Plugin', function () {

        var clock;
        beforeEach(function () {
            // Thu Jan 16 2020 11:00:00 GMT+0100
            clock = sinon.useFakeTimers({ now: 1579168800000, toFake: ['Date'] });
        });
        afterEach(function () {
            clock.restore();
        });

        it('should work without settings', function () {
            settings.set('feedback/timeLimit', undefined);
            settings.set('feedback/maxFeedbacks', undefined);
            settings.set('feedback/usedFeedbacks', undefined);
            settings.set('feedback/firstFeedbackTime', undefined);

            expect(feedback.allowedToGiveFeedback()).to.be.true;
        });

        it('should honor maxFeedbacks setting', function () {
            settings.set('feedback/timeLimit', undefined);
            settings.set('feedback/maxFeedbacks', 3);
            settings.set('feedback/usedFeedbacks', 3);
            settings.set('feedback/firstFeedbackTime', undefined);

            expect(feedback.allowedToGiveFeedback()).to.be.false;
        });

        it('should work with relative time', function () {
            settings.set('feedback/timeLimit', '3m');
            settings.set('feedback/maxFeedbacks', 3);
            settings.set('feedback/usedFeedbacks', undefined);
            settings.set('feedback/firstFeedbackTime', undefined);

            // no feedback given yet
            expect(feedback.allowedToGiveFeedback()).to.be.true;
            expect(settings.get('feedback/usedFeedbacks')).to.equal(undefined);

            // one feedback given already
            settings.set('feedback/usedFeedbacks', 1);
            settings.set('feedback/firstFeedbackTime', 1579168680000);
            expect(feedback.allowedToGiveFeedback()).to.be.true;
            expect(settings.get('feedback/usedFeedbacks')).to.equal(1);

            // max feedbacks given already
            settings.set('feedback/usedFeedbacks', 3);
            expect(feedback.allowedToGiveFeedback()).to.be.false;
            expect(settings.get('feedback/usedFeedbacks')).to.equal(3);

            // max feedbacks given already but time is up so the used feedbacks should be resetted
            settings.set('feedback/firstFeedbackTime', 1579168500000);
            expect(feedback.allowedToGiveFeedback()).to.be.true;
            expect(settings.get('feedback/usedFeedbacks')).to.equal(0);
        });

        it('should work with absolute time', function () {
            settings.set('feedback/timeLimit', '2020-01-16T12:00');
            settings.set('feedback/maxFeedbacks', 3);
            settings.set('feedback/usedFeedbacks', undefined);
            settings.set('feedback/firstFeedbackTime', undefined);

            // no feedback given yet
            expect(feedback.allowedToGiveFeedback()).to.be.true;
            expect(settings.get('feedback/usedFeedbacks')).to.equal(undefined);

            // one feedback given already
            settings.set('feedback/usedFeedbacks', 1);
            settings.set('feedback/firstFeedbackTime', 1579158000000);
            expect(feedback.allowedToGiveFeedback()).to.be.true;
            expect(settings.get('feedback/usedFeedbacks')).to.equal(1);

            // max feedbacks given already
            settings.set('feedback/usedFeedbacks', 3);
            expect(feedback.allowedToGiveFeedback()).to.be.false;
            expect(settings.get('feedback/usedFeedbacks')).to.equal(3);

            // max feedbacks given already but time is up so the used feedbacks should be resetted
            settings.set('feedback/timeLimit', '2020-01-16T10:00');
            expect(feedback.allowedToGiveFeedback()).to.be.true;
            expect(settings.get('feedback/usedFeedbacks')).to.equal(0);

            // max feedbacks given already but time is up but the feedback was given after the absolute time (no reset of used feedbacks)
            settings.set('feedback/timeLimit', '2020-01-16T10:00');
            settings.set('feedback/firstFeedbackTime', 1579167000000);
            settings.set('feedback/usedFeedbacks', 3);
            expect(feedback.allowedToGiveFeedback()).to.be.false;
            expect(settings.get('feedback/usedFeedbacks')).to.equal(3);
        });

        it('startDate should work with absolute time', function () {
            settings.set('feedback/timeLimit', undefined);
            settings.set('feedback/maxFeedbacks', undefined);
            settings.set('feedback/usedFeedbacks', undefined);
            settings.set('feedback/firstFeedbackTime', undefined);

            // true without startTime
            expect(feedback.allowedToGiveFeedback()).to.be.true;

            settings.set('feedback/startTime', '2020-01-16T12:00');

            // false with starttime in the future
            expect(feedback.allowedToGiveFeedback()).to.be.false;

            // true with startTime in the past
            settings.set('feedback/startTime', '2020-01-16T10:00');
            expect(feedback.allowedToGiveFeedback()).to.be.true;
        });

        it('startDate should work with relative time', function () {
            settings.set('feedback/timeLimit', undefined);
            settings.set('feedback/maxFeedbacks', undefined);
            settings.set('feedback/usedFeedbacks', undefined);
            settings.set('feedback/firstFeedbackTime', undefined);
            settings.set('feedback/startTime', undefined);

            // true without startTime
            expect(feedback.allowedToGiveFeedback()).to.be.true;

            // set to 3 days old since first login
            settings.set('feedback/startTime', '3d');
            settings.set('firstLogin', _.now());


            // false because user didn't use appsuite long enough
            expect(feedback.allowedToGiveFeedback()).to.be.false;

            // first login five days ago 5 * 24 * 60 * 60 * 1000
            settings.set('firstLogin', _.now() - 432000000);

            // true because user used appsuite long enough
            expect(feedback.allowedToGiveFeedback()).to.be.true;
        });
    });
});
