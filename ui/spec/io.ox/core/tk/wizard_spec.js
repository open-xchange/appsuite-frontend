/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define(['io.ox/core/tk/wizard'], function (Wizard) {

    'use strict';

    describe('The Wizard.', function () {

        beforeEach(function () {
            this.wizard = new Wizard();
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
                this.wizard = new Wizard().step().end().step().end();
            });

            afterEach(function () {
                this.wizard.close();
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
        });

        describe('Execution.', function () {

            beforeEach(function () {
                this.wizard = new Wizard().step().end().step().end();
            });

            afterEach(function () {
                this.wizard.close();
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
                expect($('.wizard-step .content').text()).to.equal('Lorem ipsum');
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
