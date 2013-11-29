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

define(['io.ox/tasks/edit/main'], function (edit) {

    //launch app
    var app = edit.getApp();
    app.launch({ folderid: 555123456 });

    var view = app.view,
        node = view.$el,
        model = view.model;

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
                this.after(function () {//remove node
                    var editnode = $.find('.task-edit-wrapper');
                    if(editnode.length === 1) {
                        $(editnode[0]).remove();
                    }
                });
            });
        });
    });
});