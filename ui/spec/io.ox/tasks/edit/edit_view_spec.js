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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define([
    'io.ox/tasks/edit/main',
    'io.ox/core/date',
    'gettext!io.ox/tasks/edit',
    'spec/shared/capabilities',
    'waitsFor'
], function (edit, date, gt, caputil, waitsFor) {

    var app,
        view,
        node,
        header,
        model,
        setup = _.memoize(
            function () {
                //launch app
                app = edit.getApp();
                var def = app.launch({ folder_id: 555123456 }).then(function () {
                    view = app.view;
                    node = view.$el;
                    header = app.getWindow().nodes.header;
                    model = view.model;
                });

                return def;
            }),
        capabilities = caputil
            .preset('common')
            .init('io.ox/tasks/edit/main', edit)
            .apply();

    describe('Tasks edit view', function () {
        beforeEach(function () {
            //set capabilities
            return capabilities.then(function () {
                return setup();
            });
        });
        describe('should contain', function () {
            it('a headline', function () {
                expect(header.find('h1.clear-title').length).to.equal(1);
                expect(header.find('button[data-action="save"]').length).to.equal(1);
                expect(header.find('button[data-action="discard"]').length).to.equal(1);
            });
            it('a title inputfield', function () {
                expect(node.find('input.title-field').length).to.equal(1);
                expect(node.find('input.title-field').prev().is('label')).to.be.true;
            });
            it('a description textarea', function () {
                expect(node.find('textarea.note-field').length).to.equal(1);
                expect(node.find('textarea.note-field').prev().is('label')).to.be.true;
            });
            it('an expansion link', function () {
                expect(node.find('.expand-link').length).to.equal(1);
            });
            it('a date inputfields', function () {
                expect(node.find('input.datepicker-day-field').length).to.equal(3);
            });
            it('a recurrence view', function () {
                expect(node.find('[data-extension-id="recurrence"]').length).to.equal(1);
                expect(node.find('.io-ox-recurrence-view').length).to.equal(1);
                expect(node.find('[data-extension-id="recurrence"] input[type="checkbox"]').length).to.equal(1);
            });
            it('reminder controls', function () {
                expect(node.find('#task-edit-reminder-select').length).to.equal(1);
            });
            it('a status controls', function () {
                expect(node.find('[data-extension-id="status"] select').length).to.equal(1);
                expect(node.find('[data-extension-id="status"] select').children().length).to.equal(5);
                expect(node.find('#task-edit-progress-field').length).to.equal(1);
                expect(node.find('[data-action="plus"]').length).to.equal(1);
                expect(node.find('[data-action="minus"]').length).to.equal(1);
                expect(node.find('[data-extension-id="priority"] select').length).to.equal(1);
                expect(node.find('[data-extension-id="priority"] select').children().length).to.equal(4);
                expect(node.find('.private-flag').length).to.equal(1);
                expect(node.find('.private-flag input[type="checkbox"]').length).to.equal(1);
            });
            // it('a correct participants tab', function () {
            //     //wait a little, until everything is painted (paint is async)
            //     return waitsFor(function () {
            //         return node.find('.task-participant-input-field').length;
            //     }).then(function () {
            //         expect(node.find('.task-participant-input-field').length, 'input field elements').to.equal(1);
            //     });
            // });
            it('a correct details tab', function () {
                expect(node.find('[data-extension-id="target_duration"]').length).to.equal(1);
                expect(node.find('[data-extension-id="actual_duration"]').length).to.equal(1);
                expect(node.find('[data-extension-id="target_costs"]').length).to.equal(1);
                expect(node.find('[data-extension-id="actual_costs"]').length).to.equal(1);
                expect(node.find('[data-extension-id="currency"]').length).to.equal(1);
                expect(node.find('[data-extension-id="trip_meter"]').length).to.equal(1);
                expect(node.find('[data-extension-id="companies"]').length).to.equal(1);
            });
        });
        describe('headline', function () {
            it('should have correct text', function () {
                expect(header.find('h1.clear-title').text()).to.equal(gt('Create task'));
                expect(header.find('button[data-action="save"]').text()).to.equal(gt('Create'));
            });
        });
        describe('title', function () {
            it('should change apptitle', function () {
                expect(app.getTitle()).to.equal(gt('Create task'));
                node.find('input.title-field').val('test').trigger('keyup');//simulate keyboard
                expect(app.getTitle()).to.equal('test');
            });
        });
        describe('expansion link', function () {
            it('should toggle collapsed items', function () {
                var link = node.find('.expand-link');
                //FIXME: readability: what is tested, here?
                expect(link.attr('style')).not.to.match(/display:\w*block;/);
                link.click();
                expect(link.attr('style')).to.be.undefined;
                link.click();
                expect(link.attr('style')).not.to.match(/display:\w*block;/);
            });
            it('should change text', function () {
                var link = node.find('.expand-link');
                expect(link.text()).to.equal(gt('Expand form'));
                link.click();
                expect(link.text()).to.equal(gt('Collapse form'));
                link.click();
                expect(link.text()).to.equal(gt('Expand form'));
            });
            it('should be collapsed on init', function () {
                expect(node.find('.collapsed').length).to.be.above(0);
                expect(node.find('.collapsed:visible').length).to.equal(0);
            });
        });
        describe('details expansion link', function () {
            it('should toggle collapsed items', function () {
                node.find('.expand-link').click();
                var link = node.find('.expand-details-link');
                expect(link.attr('style')).not.to.match(/display:\w*block;/);
                link.click();
                expect(link.attr('style')).to.be.undefined;
                link.click();
                expect(link.attr('style')).not.to.match(/display:\w*block;/);
            });
            it('should change text', function () {
                node.find('.expand-link').click();
                var link = node.find('.expand-details-link');
                expect(link.text()).to.equal(gt('Show details'));
                link.click();
                expect(link.text()).to.equal(gt('Hide details'));
                link.click();
                expect(link.text()).to.equal(gt('Show details'));
            });
        });
        describe('reminder selector', function () {
            it('should set alarmtime', function () {
                expect(model.get('alarm')).to.equal(undefined);
                var testtime = new date.Local();
                $(node.find('#task-edit-reminder-select')).val('t').trigger('change');//tomorrow
                expect(model.get('alarm')).to.be.above(testtime.getTime());
            });
            it('should remove alarmtime', function () {
                expect(model.get('alarm')).not.to.be.null;
                node.find('#task-edit-reminder-select').prop('selectedIndex', 0).trigger('change');//tomorrow
                expect(model.get('alarm')).to.be.null;
            });
        });
        describe('status selector', function () {
            it('should set status', function () {
                node.find('select[name="status"]').val('1').trigger('change');//not started
                expect(model.get('status')).to.equal('1');
                node.find('select[name="status"]').val('2').trigger('change');//in progress
                expect(model.get('status')).to.equal('2');
                node.find('select[name="status"]').val('3').trigger('change');//done
                expect(model.get('status')).to.equal('3');
                node.find('select[name="status"]').val('4').trigger('change');//waiting
                expect(model.get('status')).to.equal('4');
                node.find('select[name="status"]').val('5').trigger('change');//later
                expect(model.get('status')).to.equal('5');
            });
            it('should set progress', function () {
                node.find('select[name="status"]').val('1').trigger('change');//not started
                expect(model.get('percent_completed')).to.equal(0);
                node.find('select[name="status"]').val('2').trigger('change');//in progress
                expect(model.get('percent_completed')).to.equal(25);
                node.find('select[name="status"]').val('3').trigger('change');//done
                expect(model.get('percent_completed')).to.equal(100);
            });
        });
        describe('progress input', function () {
            it('should set status', function () {
                node.find('#task-edit-progress-field').val('100').trigger('change');
                node.find('[data-action="minus"]').click();
                expect(model.get('status')).to.equal(2);//in progress
                node.find('[data-action="minus"]').click().click().click();
                expect(model.get('status')).to.equal(1);//not started
                node.find('[data-action="plus"]').click();
                expect(model.get('status')).to.equal(2);//in progress
                node.find('[data-action="plus"]').click().click().click();
                expect(model.get('status')).to.equal(3);//done
            });
        });
        describe('priority selector', function () {
            it('should set priority', function (done) {
                node.find('select[name="priority"]').val('1').trigger('change');//low
                expect(model.get('priority')).to.equal('1');
                node.find('select[name="priority"]').val('2').trigger('change');//medium
                expect(model.get('priority')).to.equal('2');
                node.find('select[name="priority"]').val('3').trigger('change');//high
                expect(model.get('priority')).to.equal('3');
                //remove node because this is the last test

                //TODO: can this be prevented?
                //and don't sync any models (override default destroy method)
                app.destroy = _.noop;
                app.quit(true).done(done);
            });
        });
    });
});
