/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/edit/view-template',
    ['gettext!io.ox/tasks/edit',
     'io.ox/backbone/views',
     'io.ox/core/date',
     'io.ox/core/notifications',
     'io.ox/backbone/forms',
     'io.ox/calendar/util',
     'io.ox/tasks/edit/util',
     'io.ox/calendar/edit/recurrence-view',
     'io.ox/participants/views',
     'io.ox/core/tk/attachments',
     'io.ox/tasks/api',
     'io.ox/core/extensions',
     'io.ox/tasks/util'
    ], function (gt, views, date, notifications, forms, calendarUtil, util, RecurrenceView, pViews, attachments, api, ext, reminderUtil) {

    'use strict';

    var point = views.point('io.ox/tasks/edit/view');

    //headline
    point.basicExtend({
        id: 'headline',
        index: 100,
        row: '0',
        draw: function (baton) {
            var saveBtnText = gt('Create'),
                headlineText = gt('Create task'),
                headline,
                saveBtn,
                app = baton.app;
            if (baton.model.attributes.id) {
                saveBtnText = gt('Save');
                headlineText = gt('Edit task');
            }
            this.append($('<div>').addClass('task-edit-headline row-fluid').append(
                    headline = $('<h1>').addClass('clear-title title').text(headlineText),//title
                    saveBtn = $('<button type="button" data-action="save" class="btn btn-primary task-edit-save">')//save button
                        .text(saveBtnText)
                        .on('click', function (e) {
                            e.stopPropagation();
                            app.getWindow().busy();

                            // check if waiting for attachmenthandling is needed
                            var list = baton.attachmentList;
                            if (list && (list.attachmentsToAdd.length + list.attachmentsToDelete.length) > 0) {
                                baton.model.attributes.tempAttachmentIndicator = true; //temporary indicator so the api knows that attachments needs to be handled even if nothing else changes
                            }

                            baton.model.save().done(function () {
                                app.markClean();
                                app.quit();
                            }).fail(function (response) {
                                setTimeout(function () {
                                    app.getWindow().idle();
                                    notifications.yell('error', response.error);
                                }, 300);
                            });

                        }),
                    $('<button type="button" data-action="discard" class="btn cancel task-edit-cancel">')//cancel button
                        .text(gt('Discard'))
                        .on('click', function () { app.quit(); })
                    ));

            baton.parentView.on('changeMode', function (e, mode) {
                if (mode === 'edit') {
                    headline.text(gt('Edit task'));
                    saveBtn.text(gt('Save'));
                } else {
                    headline.text(gt('Create task'));
                    saveBtn.text(gt('Create'));
                }
            });
        }
    });

    // title
    point.extend(new forms.InputField({
        id: 'title',
        index: 200,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="title-field span12" id="task-edit-title" tabindex="1">',
        attribute: 'title',
        label: gt('Subject')
    }), {
        row: '1'
    });

    // note
    point.extend(new forms.InputField({
        id: 'note',
        index: 300,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<textarea class="note-field span12" id="task-edit-note" tabindex="1">',
        attribute: 'note',
        label: gt('Description')
    }), {
        row: '2'
    });

    //expand link
    point.basicExtend({
        id: 'expand_link',
        index: 400,
        row: '3',
        draw: function (baton) {
            var text = gt('Collapse form');
            if (baton.parentView.collapsed) {
                text = gt('Expand form');
            }
            this.append($('<a tabindex="1">').addClass('expand-link').text(text).attr('href', '#')
                .on('click', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    baton.parentView.$el.find('.collapsed').toggle();
                    baton.parentView.collapsed = !baton.parentView.collapsed;
                    if (baton.parentView.collapsed) {
                        $(this).text(gt('Expand form'));
                    } else {
                        $(this).text(gt('Collapse form'));
                    }
                })
            );
        }
    });

    // recurrence
    point.extend(new RecurrenceView({
        id: 'recurrence',
        className: 'span12 collapsed',
        tabindex: 1,
        index: 700
    }), {
        row: '5'
    });

    //reminder selection
    point.basicExtend({
        id: 'alarm_select',
        index: 800,
        row: '6',
        draw: function (baton) {
            var selector;
            this.append($('<div class="span5 collapsed">').append(
                    $('<label>').text(gt('Remind me')).addClass('task-edit-label').attr('for', 'task-edit-reminder-select'), selector = $('<select tabindex="1">').attr('id', 'task-edit-reminder-select').addClass('span12')
                    .append($('<option>')
                    .text(''), reminderUtil.buildDropdownMenu())
                    .on('change', function () {
                        if (selector.prop('selectedIndex') === 0) {
                            baton.model.set('alarm', null, {validate: true});
                        } else {
                            var dates = reminderUtil.computePopupTime(new Date(),
                                    selector.val());
                            baton.model.set('alarm', dates.alarmDate.getTime(), {validate: true});
                        }
                    })
                )
            );
        }
    });

    // reminder date
    point.extend(new forms.DatePicker({
        id: 'alarm',
        index: 900,
        className: 'span6 offset1 collapsed',
        labelClassName: 'task-edit-label',
        display: 'DATETIME',
        attribute: 'alarm',
        label: gt('Date'),
        required: false,
        clearButton: _.device('small')//add clearbutton on mobile devices
    }), {
        row: '6'
    });

    // status
    point.extend(new forms.SelectBoxField({
        id: 'status',
        index: 1000,
        className: 'span3 collapsed',
        labelClassName: 'task-edit-label',
        render: function () {
            var self = this;
            this.nodes = {};
            this.nodes.select = $('<select tabindex="1">').addClass('status-selector span12').attr('id', 'task-edit-status-select');
            _(this.selectOptions).each(function (label, value) {
                self.nodes.select.append(
                    $('<option>', {value: value}).text(label)
                );
            });
            this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
            this.updateChoice();
            this.nodes.select.on('change', function () {
                if (self.nodes.select.prop('selectedIndex') === 0) {
                    self.model.set('percent_completed', 0, {validate: true});
                } else if (self.nodes.select.prop('selectedIndex') === 2) {
                    self.model.set('percent_completed', 100, {validate: true});
                } else if (self.nodes.select.prop('selectedIndex') === 1 && (self.model.get('percent_completed') === 0 || self.model.get('percent_completed') === 100)) {
                    self.model.set('percent_completed', 25, {validate: true});
                }

                self.model.set(self.attribute, parseInt(self.nodes.select.val(), 10), {validate: true});
            });
        },
        attribute: 'status',
        selectOptions: {
            1: gt('Not started'),
            2: gt('In progress'),
            3: gt('Done'),
            4: gt('Waiting'),
            5: gt('Deferred')
        },
        label: gt('Status')
    }), {
        row: '7'
    });

    point.basicExtend({
        id: 'progress',
        index: 1100,
        row: '7',
        draw: function (baton) {
            var progressField = util.buildProgress(baton.model.get('percent_completed'));
            this.append($('<div class="span3 collapsed">')
                .append(
                     $('<label>').text(gt('Progress in %')).addClass('task-edit-label').attr('for', 'task-edit-progress-field'), $(progressField.wrapper)
                    .val(baton.model.get('percent_completed'))
                    .on('change', function () {
                        var value = parseInt(progressField.progress.val(), 10);
                        if (value !== 'NaN' && value >= 0 && value <= 100) {
                            if (progressField.progress.val() === '') {
                                progressField.progress.val(0);
                                baton.model.set('status', 1, {validate: true});
                            } else if (progressField.progress.val() === '0' && baton.model.get('status') === 2) {
                                baton.model.set('status', 1, {validate: true});
                            } else if (progressField.progress.val() === '100' && baton.model.get('status') !== 3) {
                                baton.model.set('status', 3, {validate: true});
                            } else if (baton.model.get('status') === 3) {
                                baton.model.set('status', 2, {validate: true});
                            } else if (baton.model.get('status') === 1) {
                                baton.model.set('status', 2, {validate: true});
                            }
                            baton.model.set('percent_completed', value, {validate: true});
                        } else {
                            notifications.yell('error', gt('Please enter value between 0 and 100.'));
                            baton.model.trigger('change:percent_completed');
                        }
                    })
                )
            );
            baton.model.on('change:percent_completed', function () {
                progressField.progress.val(baton.model.get('percent_completed'));
            });
        }
    });

    // priority
    point.extend(new forms.SelectBoxField({
        id: 'priority',
        index: 1200,
        className: 'span3 collapsed',
        labelClassName: 'task-edit-label',
        render: function () {
            var self = this;
            this.nodes = {};
            this.nodes.select = $('<select tabindex="1">').addClass('priority-selector span12').attr('id', 'task-edit-priority-select');
            _(this.selectOptions).each(function (label, value) {
                self.nodes.select.append(
                    $('<option>', {value: value}).text(label)
                );
            });
            this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
            this.updateChoice();
            this.nodes.select.on('change', function () {
                self.model.set(self.attribute, self.nodes.select.val(), {validate: true});
            });
        },
        attribute: 'priority',
        selectOptions: {
            1: gt('Low'),
            2: gt('Medium'),
            3: gt('High')
        },
        label: gt('Priority')
    }), {
        row: '7'
    });

    //privateflag
    point.extend(new forms.CheckBoxField({
        id: 'private_flag',
        index: 1300,
        labelClassName: 'private-flag',
        className: 'span3 collapsed',
        label: gt('Private'),
        attribute: 'private_flag'
    }), {
        row: '7'
    });

    //tabs section
    point.basicExtend({
        id: 'tab_section',
        index: 1400,
        row: '8',
        draw: function (baton) {
            var table,
                temp,
                content = {},
                contentNode,
                tabs = ext.point('io.ox/tasks/edit/view/tabs').list();
            //fill content object
            _(tabs).each(function (tab) {
                content[tab.id] = [];
            });
            _(ext.point('io.ox/tasks/edit/view').list()).each(function (extension) {
                if (extension.tab && _.contains(_(content).keys(), extension.tab)) {
                    content[extension.tab].push(extension);
                }
            });
            this.append(table = $('<ul>').addClass('nav nav-tabs collapsed'), contentNode = $('<div>').addClass('row-fluid tab-content collapsed'));

            for (var i = 0; i < tabs.length; i++) {
                temp = $('<li>').css('width', 100 / tabs.length + '%').appendTo(table);
                tabs[i].invoke('draw', temp, baton, contentNode, content[tabs[i].id], i);
            }
            table.find('li:first').addClass('active');
            contentNode.find('div:first').addClass('active');

            if (tabs.length === 1) {//hide if only one tab is available
                table.replaceWith($('<legend class="sectiontitle collapsed">' + tabs[0].title + '</legend>'));
            }
        }
    });

    //tabs
    ext.point('io.ox/tasks/edit/view/tabs').extend({
        id: 'participants_tab',
        index: 100,
        title: gt('Participants'),
        draw: function (baton, contentNode, content, tabindex) {
            var tabContent,
                rows = {};

            //tab
            this.append($('<a>').addClass('tab-link').css('text-align', 'center')
                .attr({tabindex: tabindex, href: '#edit-task-tab' + tabindex + '-' + baton.parentView.cid, 'data-toggle': 'tab'}).text(gt('Participants')));
            //content
            contentNode.append(tabContent = $('<div>').attr('id', 'edit-task-tab' + tabindex + '-' + baton.parentView.cid).addClass('tab-pane'));
            util.splitExtensionsByRow(content, rows, false);
            //draw the rows
            _(rows).each(function (row, key) {
                if (key !== 'rest') {//leave out all the rest, for now
                    util.buildExtensionRow(tabContent, row, baton);
                }
            });
            //now draw the rest
            _(rows.rest).each(function (extension) {
                extension.invoke('draw', tabContent, baton);
            });
        }
    });

    ext.point('io.ox/tasks/edit/view/tabs').extend({
        id: 'attachments_tab',
        index: 200,
        title: gt('Attachments'),
        draw: function (baton, contentNode, content, tabindex) {
            var tabContent,
                temp,
                rows = {};
            //tab
            this.append(temp = $('<a>').addClass('tab-link').css('text-align', 'center')
                .attr({tabindex: tabindex, href: '#edit-task-tab' + tabindex + '-' + baton.parentView.cid, 'data-toggle': 'tab'}).text(
                        //#. %1$s is the number of currently attached attachments
                        //#, c-format
                        gt('Attachments (%1$s)', gt.noI18n(0))));
            baton.parentView.on('attachmentCounterRefresh', function (e, number) {
                e.stopPropagation();
                temp.text(
                    //#. %1$s is the number of currently attached attachments
                    //#, c-format
                    gt('(%1$s) Attachments', gt.noI18n(number)));
            });
            //content
            contentNode.append(tabContent = $('<div>').attr('id', 'edit-task-tab' + tabindex + '-' + baton.parentView.cid).addClass('tab-pane'));
            util.splitExtensionsByRow(content, rows, false);
            //draw the rows
            _(rows).each(function (row, key) {
                if (key !== 'rest') {//leave out all the rest, for now
                    util.buildExtensionRow(tabContent, row, baton);
                }
            });
            //now draw the rest
            _(rows.rest).each(function (extension) {
                extension.invoke('draw', tabContent, baton);
            });
        }
    });

    ext.point('io.ox/tasks/edit/view/tabs').extend({
        id: 'details_tab',
        index: 300,
        title: gt('Details'),
        draw: function (baton, contentNode, content, tabindex) {
            var tabContent,
                rows = {};
            //tab
            this.append($('<a>').addClass('tab-link').css('text-align', 'center')
                .attr({tabindex: tabindex, href: '#edit-task-tab' + tabindex + '-' + baton.parentView.cid, 'data-toggle': 'tab'}).text(gt('Details')));
            //content
            contentNode.append(tabContent = $('<div>').attr('id', 'edit-task-tab' + tabindex + '-' + baton.parentView.cid).addClass('tab-pane'));
            util.splitExtensionsByRow(content, rows, false);
            //draw the rows
            _(rows).each(function (row, key) {
                if (key !== 'rest') {//leave out all the rest, for now
                    util.buildExtensionRow(tabContent, row, baton);
                }
            });
            //now draw the rest
            _(rows.rest).each(function (extension) {
                extension.invoke('draw', tabContent, baton);
            });
        }
    });

    //estimated duration
    point.extend(new forms.InputField({
        id: 'target_duration',
        index: 1500,
        className: 'span6',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="target_duration span12" id="task-edit-target-duration" tabindex="1">',
        attribute: 'target_duration',
        label: gt('Estimated duration in minutes'),
        updateModel: function () {
            var value = this.nodes.inputField.val();
            if (!isNaN(parseFloat(value, 10)) || value === '') {
                if (value === '') {
                    value = null;
                }
                this.model.set(this.attribute, value, {validate: true});
            } else {
                setTimeout(function () {notifications.yell('error', gt('Please enter a correct number.')); }, 300);
                this.nodes.inputField.val(this.model.get(this.attribute));
            }
        }
    }), {
        tab: 'details_tab',
        row: '0'
    });

    //actual duration
    point.extend(new forms.InputField({
        id: 'actual_duration',
        index: 1600,
        className: 'span6',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="actual_duration span12" id="task-edit-actual-duration" tabindex="1">',
        attribute: 'actual_duration',
        label: gt('Actual duration in minutes'),
        updateModel: function () {
            var value = this.nodes.inputField.val();
            if (!isNaN(parseFloat(value, 10)) || value === '') {
                if (value === '') {
                    value = null;
                }
                this.model.set(this.attribute, value, {validate: true});
            } else {
                setTimeout(function () {notifications.yell('error', gt('Please enter a correct number.')); }, 300);
                this.nodes.inputField.val(this.model.get(this.attribute));
            }
        }
    }), {
        tab: 'details_tab',
        row: '0'
    });

    //estimated costs
    point.extend(new forms.InputField({
        id: 'target_costs',
        index: 1700,
        className: 'span6',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="target_costs span12" id="task-edit-target-costs" tabindex="1">',
        attribute: 'target_costs',
        label: gt('Estimated costs')
    }), {
        tab: 'details_tab',
        row: '1'
    });

    //actual costs
    point.extend(new forms.InputField({
        id: 'actual_costs',
        index: 1800,
        className: 'span4',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="actual_costs span12" id="task-edit-actual-costs" tabindex="1">',
        attribute: 'actual_costs',
        label: gt('Actual costs')
    }), {
        tab: 'details_tab',
        row: '1'
    });

    //currency
    point.extend(new forms.SelectBoxField({
        id: 'currency',
        index: 1900,
        className: 'span2',
        labelClassName: 'task-edit-label',
        render: function () {
            var self = this;
            this.nodes = {};
            this.nodes.select = $('<select tabindex="1">').addClass('currency span12').attr('id', 'task-edit-currency');
            _(this.selectOptions).each(function (label, value) {
                self.nodes.select.append(
                    $('<option>', {value: value}).text(label)
                );
            });
            this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
            this.updateChoice();
            this.nodes.select.on('change', function () {
                self.model.set(self.attribute, self.nodes.select.val(), {validate: true});
            });
        },
        attribute: 'currency',
        selectOptions: {
            '': undefined,
            CAD: _.noI18n('CAD'),
            CHF: _.noI18n('CHF'),
            DKK: _.noI18n('DKK'),
            EUR: _.noI18n('EUR'),
            GBP: _.noI18n('GBP'),
            PLN: _.noI18n('PLN'),
            RUB: _.noI18n('RUB'),
            SEK: _.noI18n('SEK'),
            USD: _.noI18n('USD'),
            JPY: _.noI18n('JPY'),
            RMB: _.noI18n('RMB')
        },
        label: gt('Currency')
    }), {
        tab: 'details_tab',
        row: '1'
    });

    // distance
    point.extend(new forms.InputField({
        id: 'trip_meter',
        index: 2000,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="trip-meter span12" id="task-edit-trip-meter" tabindex="1">',
        attribute: 'trip_meter',
        label: gt('Distance')
    }), {
        tab: 'details_tab',
        row: '2'
    });

    // billing information
    point.extend(new forms.InputField({
        id: 'billing_information',
        index: 2100,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="billing-information span12" id="task-edit-billing-information" tabindex="1">',
        attribute: 'billing_information',
        label: gt('Billing information')
    }), {
        tab: 'details_tab',
        row: '3'
    });

    // companies
    point.extend(new forms.InputField({
        id: 'companies',
        index: 2200,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="companies span12" id="task-edit-companies" tabindex="1">',
        attribute: 'companies',
        label: gt('Companies')
    }), {
        tab: 'details_tab',
        row: '4'
    });

    // participants
    point.basicExtend({
        id: 'participants_list',
        index: 2300,
        tab: 'participants_tab',
        row: '0',
        draw: function (baton) {
            this.append(
                new pViews.UserContainer({
                    collection: baton.model.getParticipants(),
                    baton: baton
                }).render().$el
            );
        }
    });

    // add participants
    point.basicExtend({
        id: 'add_participant',
        index: 2400,
        tab: 'participants_tab',
        row: '1',
        draw: function (options) {
            var node = this,
            input;
            require(['io.ox/calendar/edit/view-addparticipants'], function (AddParticipantsView) {

                var collection = options.model.getParticipants();

                node.append(
                    input = $('<div class="input-append span6">').append(
                        $('<input type="text" class="add-participant task-participant-input-field" tabindex="1">').attr('placeholder', gt('Add participant/resource')),
                        $('<button type="button" class="btn" data-action="add" tabindex="1">')
                            .append($('<i class="icon-plus">'))
                    ),
                    $('<div>').css('height', '220px') // default height of autocomplete popup, we do need expand the page to a height which can show the autocomplete popup
                );
                if (!_.browser.Firefox) { input.addClass('input-append-fix'); }

                var autocomplete = new AddParticipantsView({el: node});
                autocomplete.render({
                    parentSelector: '.io-ox-tasks-edit'
                });

                //add recipents to baton-data-node; used to filter sugestions list in view
                autocomplete.on('update', function () {
                    var baton = {list: []};
                    collection.any(function (item) {
                        //participant vs. organizer
                        var email = item.get('email1') || item.get('email2');
                        if (email !== null)
                            baton.list.push({email: email, id: item.get('user_id') || item.get('internal_userid') || item.get('id'), type: item.get('type')});
                    });
                    $.data(node, 'baton', baton);
                });

                autocomplete.on('select', function (data) {
                    var alreadyParticipant = false, obj,
                    userId;
                    alreadyParticipant = collection.any(function (item) {
                        if (data.type === 5) {
                            return (item.get('mail') === data.mail && item.get('type') === data.type) || (item.get('mail') === data.email1 && item.get('type') === data.type);
                        } else if (data.type === 1) {
                            return item.get('id') ===  data.internal_userid;
                        } else {
                            return (item.id === data.id && item.get('type') === data.type);
                        }
                    });
                    if (!alreadyParticipant) {
                        if (data.type !== 5) {

                            if (data.mark_as_distributionlist) {
                                _.each(data.distribution_list, function (val) {
                                    if (val.folder_id === 6) {
                                        calendarUtil.getUserIdByInternalId(val.id).done(function (id) {
                                            userId = id;
                                            obj = {id: userId, type: 1 };
                                            collection.add(obj);
                                        });
                                    } else {
                                        obj = {type: 5, mail: val.mail, display_name: val.display_name};
                                        collection.add(obj);
                                    }
                                });
                            } else {
                                collection.add(data);
                            }

                        } else {
                            obj = {type: data.type, mail: data.mail || data.email1, display_name: data.display_name, image1_url: data.image1_url || ''};
                            collection.add(obj);
                        }
                    }
                });
            });
        }
    });

    // Attachments

    point.extend(new attachments.EditableAttachmentList({
        id: 'attachment_list',
        registerAs: 'attachmentList',
        className: 'div',
        index: 2500,
        module: 4,
        finishedCallback: function (model, id) {
            var obj = {};
            obj.id = model.attributes.id || id;
            obj.folder_id = model.attributes.folder_id || model.attributes.folder;
            api.removeFromCache(_.cid(obj)).done(function () {
                api.removeFromUploadList(_.ecid(obj));
            });
        }
    }), {
        tab: 'attachments_tab',
        row: '0'
    });

    point.basicExtend({
        id: 'attachment_upload',
        index: 2600,
        tab: 'attachments_tab',
        row: '1',
        draw: function (baton) {
            var $node = $('<form>').appendTo(this).attr('id', 'attachmentsForm').addClass('span12'),
                $inputWrap = attachments.fileUploadWidget({displayButton: false, multi: true}),
                $input = $inputWrap.find('input[type="file"]'),
                changeHandler = function (e) {
                    e.preventDefault();
                    if (_.browser.IE !== 9) {
                        _($input[0].files).each(function (fileData) {
                            baton.attachmentList.addFile(fileData);
                        });
                        $input.trigger('reset.fileupload');
                    } else {
                        //IE
                        if ($input.val()) {
                            var fileData = {
                                name: $input.val().match(/[^\/\\]+$/),
                                size: 0,
                                hiddenField: $input
                            };
                            baton.attachmentList.addFile(fileData);
                            //hide input field with file
                            $input.addClass('add-attachment').hide();
                            //create new input field
                            $input = $('<input>', { type: 'file', name: 'file', tabindex: 1 })
                                    .on('change', changeHandler)
                                    .appendTo($input.parent());
                        }
                    }
                };
            $input.on('change', changeHandler);
            $inputWrap.on('change.fileupload', function () {
                //use bubbled event to add fileupload-new again (workaround to add multiple files with IE)
                $(this).find('div[data-provides="fileupload"]').addClass('fileupload-new').removeClass('fileupload-exists');
            });
            $node.append($('<div>').addClass('span12').append($inputWrap));
        }
    });

    //DatePickers

    // start date
    point.extend(new forms.DatePicker({
        id: 'start_date',
        index: 500,
        className: 'span6 collapsed',
        labelClassName: 'task-edit-label',
        display: 'DATE',
        attribute: 'start_date',
        required: false,
        utc: true,
        label: gt('Starts on'),
        clearButton: _.device('small')//add clearbutton on mobile devices
    }), {
        row: '4'
    });

    // due date
    point.extend(new forms.DatePicker({
        id: 'end_date',
        index: 600,
        className: 'span6 collapsed',
        labelClassName: 'task-edit-label',
        display: 'DATE',
        attribute: 'end_date',
        required: false,
        utc: true,
        label: gt('Due date'),
        clearButton: _.device('small')//add clearbutton on mobile devices
    }), {
        row: '4'
    });

    ext.point('io.ox/tasks/edit/dnd/actions').extend({
        id: 'attachment',
        index: 100,
        label: gt('Drop here to upload a <b class="dndignore">new attachment</b>'),
        multiple: function (files, view) {
            _(files).each(function (fileData) {
                view.baton.attachmentList.addFile(fileData);
            });

        }
    });

    // bottom toolbar for mobile only
    ext.point('io.ox/tasks/edit/bottomToolbar').extend({
        id: 'toolbar',
        index: 2500,
        draw: function (baton) {
            // must be on a non overflow container to work with position:fixed
            var node = $(baton.app.attributes.window.nodes.body),
                save = baton.parentView.$el.find('.task-edit-save'),
                cancel = baton.parentView.$el.find('.task-edit-cancel');
            node.append($('<div class="app-bottom-toolbar">').append(cancel, save));
        }
    });

    return null; //just used to clean up the view class
});
