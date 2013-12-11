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

define(['io.ox/tasks/edit/main',
        'io.ox/core/date',
        'gettext!io.ox/tasks/edit'], function (edit, date, gt) {

    var app,
        view ,
        node,
        model,
        setup = _.once(
                function () {
                    //launch app
                    app = edit.getApp();
                    app.launch({ folderid: 555123456 });
        
                    view = app.view,
                    node = view.$el,
                    model = view.model;
                }
            );
    
    describe('', function () {//outer wrapper (needed because the app must not be started before the capabilities are set)
        beforeEach(function () {
            //set capabilities
            ox.testUtils.modules.caps(['delegate_tasks', 'infostore'], 'io.ox/tasks/edit/main', edit);
            
        });
        describe('', function () {//inner wrapper (start app one time before the tests run)
                beforeEach(function () {
                    setup();
                });
            describe('task edit view', function () {
                describe('should contain', function () {
                    it('a headline', function () {
                        expect(node.find('.task-edit-headline').length).toEqual(1);
                        expect(node.find('.task-edit-headline .clear-title').length).toEqual(1);
                        expect(node.find('.task-edit-headline [data-action="save"]').length).toEqual(1);
                        expect(node.find('.task-edit-headline [data-action="discard"]').length).toEqual(1);
                    });
                    it('a title inputfield', function () {
                        expect(node.find('#task-edit-title').length).toEqual(1);
                        expect(node.find('#task-edit-title').parent().is('label')).toBeTruthy();
                    });
                    it('a description textarea', function () {
                        expect(node.find('#task-edit-note').length).toEqual(1);
                        expect(node.find('#task-edit-note').parent().is('label')).toBeTruthy();
                    });
                    it('an expansion link', function () {
                        expect(node.find('.expand-link').length).toEqual(1);
                    });
                    it('a start date inputfield', function () {
                        expect(node.find('[data-extension-id="start_date"]').length).toEqual(1);
                        expect(node.find('[data-extension-id="start_date"] label').length).toEqual(1);
                        expect(node.find('[data-extension-id="start_date"] input').length).toEqual(1);
                    });
                    it('an end date inputfield', function () {
                        expect(node.find('[data-extension-id="end_date"]').length).toEqual(1);
                        expect(node.find('[data-extension-id="end_date"] label').length).toEqual(1);
                        expect(node.find('[data-extension-id="end_date"] input').length).toEqual(1);
                    });
                    it('a recurrence view', function () {
                        expect(node.find('[data-extension-id="recurrence"]').length).toEqual(1);
                        expect(node.find('.io-ox-recurrence-view').length).toEqual(1);
                        expect(node.find('[data-extension-id="recurrence"] input[type="checkbox"]').length).toEqual(1);
                    });
                    it('a reminder selectonbox', function () {
                        expect(node.find('#task-edit-reminder-select').length).toEqual(1);
                    });
                    it('a reminder inputfield', function () {
                        expect(node.find('[data-extension-id="alarm"]').length).toEqual(1);
                        expect(node.find('[data-extension-id="alarm"] label').length).toEqual(1);
                        expect(node.find('[data-extension-id="alarm"] input').length).toEqual(2);//alarm has date and time field
                    });
                    it('a status selectbox', function () {
                        expect(node.find('#task-edit-status-select').length).toEqual(1);
                        expect(node.find('#task-edit-status-select').children().length).toEqual(5);
                    });
                    it('a progress buttongroup', function () {
                        expect(node.find('#task-edit-progress-field').length).toEqual(1);
                        expect(node.find('[data-action="plus"]').length).toEqual(1);
                        expect(node.find('[data-action="minus"]').length).toEqual(1);
                    });
                    it('a priority selectbox', function () {
                        expect(node.find('#task-edit-priority-select').length).toEqual(1);
                        expect(node.find('#task-edit-priority-select').children().length).toEqual(3);
                    });
                    it('a private checkbox', function () {
                        expect(node.find('.private-flag').length).toEqual(1);
                        expect(node.find('.private-flag input[type="checkbox"]').length).toEqual(1);
                    });
                    it('tabs', function () {
                        expect(node.find('.nav-tabs').length).toEqual(1);
                        expect(node.find('.tab-content').length).toEqual(1);
                        expect(node.find('.tab-pane').length).toEqual(3);
                    });
                    it('a correct participants tab', function () {//needs tasks delegate capability
                        expect(node.find('.task-participant-input-field').length).toEqual(1);
                        expect(node.find('.participantsrow').length).toEqual(1);
                    });
                    it('a correct attachments tab', function () {//needs infostore capability
                        expect(node.find('[data-extension-id="attachment_list"]').length).toEqual(1);
                        expect(node.find('#attachmentsForm').length).toEqual(1);
                    });
                    it('a correct details tab', function () {
                        expect(node.find('[data-extension-id="target_duration"]').length).toEqual(1);
                        expect(node.find('[data-extension-id="actual_duration"]').length).toEqual(1);
                        expect(node.find('[data-extension-id="target_costs"]').length).toEqual(1);
                        expect(node.find('[data-extension-id="actual_costs"]').length).toEqual(1);
                        expect(node.find('[data-extension-id="currency"]').length).toEqual(1);
                        expect(node.find('[data-extension-id="trip_meter"]').length).toEqual(1);
                        expect(node.find('[data-extension-id="companies"]').length).toEqual(1);
                    });
                });
                describe('headline', function () {
                    it('should have correct text', function () {
                        expect(node.find('.task-edit-headline .clear-title').text()).toEqual(gt('Create task'));
                        expect(node.find('.task-edit-headline [data-action="save"]').text()).toEqual(gt('Create'));
                    });
                });
                describe('title', function () {
                    it('should change apptitle', function () {
                        expect(app.getTitle()).toEqual(gt('Create task'));
                        node.find('#task-edit-title').val('test').trigger('keyup');//simulate keyboard
                        expect(app.getTitle()).toEqual('test');
                    });
                });
                describe('expansion link', function () {
                    it('should toggle collapsed items', function () {
                        expect(node.find('.collapsed:visible').length).toBeGreaterThan(0);
                        node.find('.expand-link').click();
                        expect(node.find('.collapsed:visible').length).toEqual(0);
                        node.find('.expand-link').click();
                        expect(node.find('.collapsed:visible').length).toBeGreaterThan(0);
                    });
                    it('should change text', function () {
                        expect(node.find('.expand-link').text()).toEqual(gt('Expand form'));
                        node.find('.expand-link').click();
                        expect(node.find('.expand-link').text()).toEqual(gt('Collapse form'));
                        node.find('.expand-link').click();
                        expect(node.find('.expand-link').text()).toEqual(gt('Expand form'));
                    });
                });
                describe('reminder selector', function () {
                    it('should set alarmtime', function () {
                        expect(model.get('alarm')).toEqual(undefined);
                        var testtime = new date.Local();
                        testtime.setHours(0, 0, 0, 0);
                        node.find('#task-edit-reminder-select').val('t').trigger('change');//tomorrow
                        expect(model.get('alarm')).toEqual(testtime.getTime());
                    });
                    it('should remove alarmtime', function () {
                        expect(model.get('alarm')).not.toEqual(null);
                        node.find('#task-edit-reminder-select').prop('selectedIndex', 0).trigger('change');//tomorrow
                        expect(model.get('alarm')).toEqual(null);
                    });
                });
                describe('status selector', function () {
                    it('should set status', function () {
                        node.find('.status-selector').val('1').trigger('change');//not started
                        expect(model.get('status')).toEqual(1);
                        node.find('.status-selector').val('2').trigger('change');//in progress
                        expect(model.get('status')).toEqual(2);
                        node.find('.status-selector').val('3').trigger('change');//done
                        expect(model.get('status')).toEqual(3);
                        node.find('.status-selector').val('4').trigger('change');//waiting
                        expect(model.get('status')).toEqual(4);
                        node.find('.status-selector').val('5').trigger('change');//later
                        expect(model.get('status')).toEqual(5);
                    });
                    it('should set progress', function () {
                        node.find('.status-selector').val('1').trigger('change');//not started
                        expect(model.get('percent_completed')).toEqual(0);
                        node.find('.status-selector').val('2').trigger('change');//in progress
                        expect(model.get('percent_completed')).toEqual(25);
                        node.find('.status-selector').val('3').trigger('change');//done
                        expect(model.get('percent_completed')).toEqual(100);
                    });
                });
                describe('progress input', function () {
                    it('should set status', function () {
                        node.find('#task-edit-progress-field').val('100').trigger('change');
                        node.find('[data-action="minus"]').click();
                        expect(model.get('status')).toEqual(2);//in progress
                        node.find('[data-action="minus"]').click().click().click();
                        expect(model.get('status')).toEqual(1);//not started
                        node.find('[data-action="plus"]').click();
                        expect(model.get('status')).toEqual(2);//in progress
                        node.find('[data-action="plus"]').click().click().click();
                        expect(model.get('status')).toEqual(3);//done
                    });
                });
                describe('priority selector', function () {
                    it('should set priority', function () {
                        node.find('.priority-selector').val('1').trigger('change');//low
                        expect(model.get('priority')).toEqual('1');
                        node.find('.priority-selector').val('2').trigger('change');//medium
                        expect(model.get('priority')).toEqual('2');
                        node.find('.priority-selector').val('3').trigger('change');//high
                        expect(model.get('priority')).toEqual('3');
                        this.after(function () {//remove node because this is the last test
                            var editnode = $.find('.task-edit-wrapper');
                            if(editnode.length === 1) {
                                $(editnode[0]).remove();
                            }
                        });
                    });
                });
            });
        });
    });
});
