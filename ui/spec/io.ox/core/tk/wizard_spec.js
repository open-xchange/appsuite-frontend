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

define(['io.ox/core/tk/wizard'], function (Wizard) {

    'use strict';

    describe('The Wizard.', function () {

        beforeEach(function () {
            this.wizard = new Wizard();
        });

        afterEach(function () {
            this.wizard.close();
        });

        describe('Adding steps.', function () {

            it('has no steps', function () {
                expect(this.wizard.steps).to.be.empty;
            });

            it('starts with first step', function () {
                expect(this.wizard.currentStep).to.equal(0);
            });

            it('allows adding steps', function () {
                this.wizard.step();
                expect(this.wizard.steps.length).to.equal(1);
            });

            it('supports long chains', function () {
                this.wizard.step().end().step().end().step();
                expect(this.wizard.steps.length).to.equal(3);
            });
        });

        describe('Navigation.', function () {

            beforeEach(function () {
                this.wizard.step().end().step().end();
            });

            it('offers "next"', function () {
                expect(this.wizard.hasNext()).to.be.true;
            });

            it('moves to next step', function () {
                this.wizard.next();
                expect(this.wizard.currentStep).to.equal(1);
            });

            it('does not offer "back" if at start', function () {
                expect(this.wizard.hasBack()).to.be.false;
            });

            it('does offer "back" if at second step', function () {
                this.wizard.next();
                expect(this.wizard.hasBack()).to.be.true;
            });

            it('does not move to invalid position', function () {
                this.wizard.setCurrentStep(-1);
                expect(this.wizard.currentStep).to.equal(0);
                this.wizard.setCurrentStep(+1);
                expect(this.wizard.currentStep).to.equal(1);
                this.wizard.setCurrentStep(+2);
                expect(this.wizard.currentStep).to.equal(1);
            });
        });

        describe('Events.', function () {

            it('forwards step-related events', function () {

                var spyNext = sinon.spy(), spyBack = sinon.spy(), spyClose = sinon.spy();

                this.wizard
                    .step()
                    .end()
                    .on({ 'step:next': spyNext, 'step:back': spyBack, 'step:close': spyClose })
                    .withCurrentStep(function (step) {
                        step.trigger('next');
                        step.trigger('back');
                        step.trigger('close');
                    });

                expect(spyNext.called, 'step:next event').to.be.true;
                expect(spyBack.called, 'step:back event').to.be.true;
                expect(spyClose.called, 'step:close event').to.be.true;
            });

            it('should not fail with resize events sent shortly before wizard closed', function () {
                var timer = sinon.useFakeTimers();
                this.wizard
                    .step({ referTo: '#io-ox-core' })
                    .end()
                    .start();
                $(window).trigger('resize.wizard-step');
                this.wizard.close();

                //enough time for all timers to timeout
                timer.tick(60000);
                timer.restore();
            });
        });

        describe('Execution.', function () {

            beforeEach(function () {
                this.wizard.step().end().step().end();
            });

            it('shows up in the DOM', function () {
                this.wizard.start();
                expect($('.wizard-step').length).to.equal(1);
            });

            it('get removed from the DOM', function () {
                this.wizard.start().close();
                expect($('.wizard-step').length).to.equal(0);
            });

            it('shows proper content', function () {
                this.wizard.steps[0].content('Lorem ipsum');
                this.wizard.start();
                expect($('.wizard-step .wizard-content').text()).to.equal('Lorem ipsum');
            });

            it('has proper "start" button', function () {
                this.wizard.start();
                expect($('.wizard-step .btn[data-action="next"]').text()).to.equal('Tour starten');
            });

            it('has proper "back" button', function () {
                this.wizard.start().next();
                expect($('.wizard-step .btn[data-action="back"]').text()).to.equal('Zurück');
            });

            it('has a backdrop if modal', function () {
                this.wizard.steps[1].modal(false);
                this.wizard.start();
                expect($('.wizard-backdrop:visible').length, 'first').to.equal(1);
                this.wizard.next();
                expect($('.wizard-backdrop:visible').length, 'second').to.equal(0);
                this.wizard.back();
                expect($('.wizard-backdrop:visible').length, 'third').to.equal(1);
            });
        });
    });
});
