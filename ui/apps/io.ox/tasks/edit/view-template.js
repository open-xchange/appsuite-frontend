/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/edit/view-template', ['gettext!io.ox/tasks/edit',
                                          'io.ox/backbone/views',
                                          'io.ox/core/date',
                                          'io.ox/core/notifications',
                                          'io.ox/backbone/forms',
                                          'io.ox/calendar/util',
                                          'io.ox/participants/views',
                                          'io.ox/core/tk/attachments',
                                          'io.ox/core/extensions'],
                                          function (gt, views, date, notifications, forms, util, pViews, attachments, ext) {
    'use strict';

    var point = views.point('io.ox/tasks/edit/view');

    // title
    point.extend(new forms.InputField({
        id: 'title',
        index: 100,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="title-field span12" id="task-edit-title">',
        attribute: 'title',
        label: gt('Subject')
    }));

    // note
    point.extend(new forms.InputField({
        id: 'note',
        index: 200,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<textarea class="note-field span12" id="task-edit-note">',
        attribute: 'note',
        label: gt('Description')
    }));

    // status
    point.extend(new forms.SelectBoxField({
        id: 'status',
        index: 300,
        className: 'span3',
        labelClassName: 'task-edit-label',
        render: function () {
            var self = this;
            this.nodes = {};
            this.nodes.select = $('<select>').addClass('status-selector span12').attr('id', 'task-edit-status-select');
            _(this.selectOptions).each(function (label, value) {
                self.nodes.select.append(
                    $('<option>', {value: value}).text(label)
                );
            });
            this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
            this.updateChoice();
            this.nodes.select.on('change', function () {
                if (self.nodes.select.prop('selectedIndex') === 0) {
                    self.model.set('percent_completed', 0);
                } else if (self.nodes.select.prop('selectedIndex') === 2) {
                    self.model.set('percent_completed', 100);
                } else if (self.nodes.select.prop('selectedIndex') === 1 && (self.model.get('percent_completed') === 0 || self.model.get('percent_completed') === 100)) {
                    self.model.set('percent_completed', 25);
                }
                self.model.set(self.attribute, self.nodes.select.val());
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
    }));

    // priority
    point.extend(new forms.SelectBoxField({
        id: 'priority',
        index: 400,
        className: 'span3',
        labelClassName: 'task-edit-label',
        render: function () {
            var self = this;
            this.nodes = {};
            this.nodes.select = $('<select>').addClass('priority-selector span12').attr('id', 'task-edit-priority-select');
            _(this.selectOptions).each(function (label, value) {
                self.nodes.select.append(
                    $('<option>', {value: value}).text(label)
                );
            });
            this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
            this.updateChoice();
            this.nodes.select.on('change', function () {
                self.model.set(self.attribute, self.nodes.select.val());
            });
        },
        attribute: 'priority',
        selectOptions: {
            1: gt('Low'),
            2: gt('Medium'),
            3: gt('High')
        },
        label: gt('Priority')
    }));

    //privateflag
    point.extend(new forms.CheckBoxField({
        id: 'private_flag',
        index: 500,
        labelClassName: 'private-flag',
        className: 'span3 ',
        label: gt('Private'),
        attribute: 'private_flag'
    }));

    //estimated duration
    point.extend(new forms.InputField({
        id: 'target_duration',
        index: 600,
        className: 'span6',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="target_duration span12" id="task-edit-target-duration">',
        attribute: 'target_duration',
        label: gt('Estimated duration in minutes'),
        updateModel: function () {
            var value = this.nodes.inputField.val();
            if (!isNaN(parseFloat(value, 10)) || value === '') {
                if (value === '') {
                    value = null;
                }
                this.model.set(this.attribute, value);
            } else {
                setTimeout(function () {notifications.yell('error', gt('Please enter a correct number.')); }, 300);
                this.nodes.inputField.val(this.model.get(this.attribute));
            }
        }
    }));

    //actual duration
    point.extend(new forms.InputField({
        id: 'actual_duration',
        index: 700,
        className: 'span6',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="actual_duration span12" id="task-edit-actual-duration">',
        attribute: 'actual_duration',
        label: gt('Actual duration in minutes'),
        updateModel: function () {
            var value = this.nodes.inputField.val();
            if (!isNaN(parseFloat(value, 10)) || value === '') {
                if (value === '') {
                    value = null;
                }
                this.model.set(this.attribute, value);
            } else {
                setTimeout(function () {notifications.yell('error', gt('Please enter a correct number.')); }, 300);
                this.nodes.inputField.val(this.model.get(this.attribute));
            }
        }
    }));

    //estimated costs
    point.extend(new forms.InputField({
        id: 'target_costs',
        index: 800,
        className: 'span6',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="target_costs span12" id="task-edit-target-costs">',
        attribute: 'target_costs',
        label: gt('Estimated costs'),
        updateModel: function () {
            var value = this.nodes.inputField.val();
            if (!isNaN(parseFloat(value, 10)) || value === '') {
                if (value === '') {
                    value = null;
                }
                this.model.set(this.attribute, value);
            } else {
                setTimeout(function () {notifications.yell('error', gt('Please enter a correct number.')); }, 300);
                this.nodes.inputField.val(this.model.get(this.attribute));
            }
        }
    }));

    //actual costs
    point.extend(new forms.InputField({
        id: 'actual_costs',
        index: 900,
        className: 'span4',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="actual_costs span12" id="task-edit-actual-costs">',
        attribute: 'actual_costs',
        label: gt('Actual costs'),
        updateModel: function () {
            var value = this.nodes.inputField.val();
            if (!isNaN(parseFloat(value, 10)) || value === '') {
                if (value === '') {
                    value = null;
                }
                this.model.set(this.attribute, value);
            } else {
                setTimeout(function () {notifications.yell('error', gt('Please enter a correct number.')); }, 300);
                this.nodes.inputField.val(this.model.get(this.attribute));
            }
        }
    }));

    //currency
    point.extend(new forms.SelectBoxField({
        id: 'currency',
        index: 1000,
        className: 'span2',
        labelClassName: 'task-edit-label',
        render: function () {
            var self = this;
            this.nodes = {};
            this.nodes.select = $('<select>').addClass('currency span12').attr('id', 'task-edit-currency');
            _(this.selectOptions).each(function (label, value) {
                self.nodes.select.append(
                    $('<option>', {value: value}).text(label)
                );
            });
            this.$el.append($('<label>').addClass(this.labelClassName || '').text(this.label), this.nodes.select);
            this.updateChoice();
            this.nodes.select.on('change', function () {
                self.model.set(self.attribute, self.nodes.select.val());
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
    }));

    // distance
    point.extend(new forms.InputField({
        id: 'trip_meter',
        index: 1100,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="trip-meter span12" id="task-edit-trip-meter">',
        attribute: 'trip_meter',
        label: gt('Distance')
    }));

    // billing information
    point.extend(new forms.InputField({
        id: 'billing_information',
        index: 1200,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="billing-information span12" id="task-edit-billing-information">',
        attribute: 'billing_information',
        label: gt('Billing information')
    }));

    // companies
    point.extend(new forms.InputField({
        id: 'companies',
        index: 1300,
        className: 'span12',
        labelClassName: 'task-edit-label',
        control: '<input type="text" class="companies span12" id="task-edit-companies">',
        attribute: 'companies',
        label: gt('Companies')
    }));

    // participants
    point.basicExtend({
        id: 'participants_list',
        index: 1400,
        draw: function (baton) {
            this.append(new pViews.UserContainer({collection: baton.model.getParticipants(),
                                                  baton: baton}).render().$el);
        }
    });

    // add participants
    point.basicExtend({
        id: 'add_participant',
        index: 1500,
        draw: function (options) {
            var node = this;
            require(['io.ox/calendar/edit/view-addparticipants'], function (AddParticipantsView) {

                var collection = options.model.getParticipants();

                node.append(
                    $('<div class="input-append">').append(
                        $('<input type="text" class="add-participant task-participant-input-field">'),
                        $('<button class="btn" type="button" data-action="add">')
                            .append($('<i class="icon-plus">'))
                    ),
                    $('<div>').css('height', '220px') // default height of autocomplete popup, we do need expand the page to a height which can show the autocomplete popup
                );

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
                            baton.list.push({email: email, id: item.get('user_id') || item.get('internal_userid') || item.get('id'), type: item.get('type')});
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
                                    var def = $.Deferred();
                                    if (val.folder_id === 6) {
                                        util.getUserIdByInternalId(val.id, def);
                                        def.done(function (id) {
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

    //DatePickers

    //Datepickers need Custom methods because standard methods show odd behaviour with undefined dates
    var CustomBinderUtils = {
        _timeStrToDate: function (value, attribute, model) {
            var myValue = parseInt(model.get(attribute), 10) || false;
            if (!myValue) {
                //check if attribute is undefined or null
                if (model.get(attribute) === undefined || model.get(attribute) === null) {
                    myValue = _.now();
                } else { //attribute seems to be broken
                    return null;
                }
            }
            var mydate = new date.Local(myValue);
            var parsedDate = date.Local.parse(value, date.TIME);

            // just reject the change, if it's not parsable
            if (value !== '' && (_.isNull(parsedDate) || parsedDate.getTime() === 0)) {
                model.trigger('change:' + attribute);//reset inputfields
                setTimeout(function () {notifications.yell('error', gt('Please enter a valid date.')); }, 300);
                return model.get(attribute);
            }
            //set hours to 6:00 am if nothing is set
            if (value === '') {
                mydate.setHours(6);
                mydate.setMinutes(0);
                mydate.setSeconds(0);
            } else {
                mydate.setHours(parsedDate.getHours());
                mydate.setMinutes(parsedDate.getMinutes());
                mydate.setSeconds(parsedDate.getSeconds());
            }

            return mydate.getTime();
        },
        _dateStrToDate: function (value, attribute, model) {
            var myValue = parseInt(model.get(attribute), 10) || false;
            if (!myValue) {
                //check if attribute is just undefined
                if (model.get(attribute) === undefined || model.get(attribute) === null) {
                    myValue = _.now();
                } else { //attribute seems to be broken
                    return null;
                }
            }
            var mydate = new date.Local(date.Local.utc(myValue));
            var parsedDate = date.Local.parse(value, date.DATE);

            if (value === '') { //empty input means date should be undefined
                return null;
            }
            // just reject the change, if it's not parsable
            if (_.isNull(parsedDate) || parsedDate.getTime() === 0) {
                model.trigger('change:' + attribute);//reset inputfields
                setTimeout(function () {notifications.yell('error', gt('Please enter a valid date.')); }, 300);
                return model.get(attribute);
            }

            mydate.setDate(parsedDate.getDate());
            mydate.setMonth(parsedDate.getMonth());
            mydate.setYear(parsedDate.getYear());
            return date.Local.localTime(mydate.getTime());
        }
    };

    // start date
    point.extend(new forms.DatePicker({
        id: 'start_date',
        index: 1600,
        className: 'span6',
        labelClassName: 'task-edit-label',
        display: 'DATETIME',
        attribute: 'start_date',
        label: gt('Starts on'),
        updateModelDate: function () {
            this.model.set(this.attribute, CustomBinderUtils._dateStrToDate(this.nodes.dayField.val(), this.attribute, this.model));
        },
        updateModelTime: function () {
            this.model.set(this.attribute, CustomBinderUtils._timeStrToDate(this.nodes.timeField.val(), this.attribute, this.model));
        }
    }));

    // due date
    point.extend(new forms.DatePicker({
        id: 'end_date',
        index: 1700,
        className: 'span6',
        labelClassName: 'task-edit-label',
        display: 'DATETIME',
        attribute: 'end_date',
        label: gt('Due date'),
        updateModelDate: function () {
            this.model.set(this.attribute, CustomBinderUtils._dateStrToDate(this.nodes.dayField.val(), this.attribute, this.model));
        },
        updateModelTime: function () {
            this.model.set(this.attribute, CustomBinderUtils._timeStrToDate(this.nodes.timeField.val(), this.attribute, this.model));
        }
    }));

    // reminder date
    point.extend(new forms.DatePicker({
        id: 'alarm',
        index: 1800,
        className: 'span6 offset1',
        labelClassName: 'task-edit-label',
        display: 'DATETIME',
        attribute: 'alarm',
        label: gt('Date'),
        updateModelDate: function () {
            this.model.set(this.attribute, CustomBinderUtils._dateStrToDate(this.nodes.dayField.val(), this.attribute, this.model));
        },
        updateModelTime: function () {
            this.model.set(this.attribute, CustomBinderUtils._timeStrToDate(this.nodes.timeField.val(), this.attribute, this.model));
        }
    }));

    // Attachments

    point.extend(new attachments.EditableAttachmentList({
        id: 'attachment_list',
        registerAs: 'attachmentList',
        className: 'div',
        index: 1900,
        module: 4
    }));

    point.basicExtend({
        id: 'attachment_upload',
        index: 2000,
        draw: function (baton) {
            var $node = $('<form>').appendTo(this).attr('id', 'attachmentsForm').addClass('span12'),
                $inputWrap = attachments.fileUploadWidget({displayButton: true, multi: true}),
                $input = $inputWrap.find('input[type="file"]'),
                $button = $inputWrap.find('button[data-action="add"]')
                    .on('click', function (e) {
                e.preventDefault();
                if (_.browser.IE !== 9) {
                    _($input[0].files).each(function (fileData) {
                        baton.attachmentList.addFile(fileData);
                    });
                    $input.trigger('reset.fileupload');
                } else {
                    if ($input.val()) {
                        var fileData = {
                            name: $input.val().match(/[^\/\\]+$/),
                            size: 0,
                            hiddenField: $input
                        };
                        baton.attachmentList.addFile(fileData);
                        $input.addClass('add-attachment').hide();
                        $input = $('<input>', { type: 'file' }).appendTo($input.parent());
                    }
                }
            });

            $node.append($('<div>').addClass('span12').append($inputWrap));
        }
    });

    ext.point('io.ox/tasks/edit/dnd/actions').extend({
        id: 'attachment',
        index: 100,
        label: gt('Drop here to upload a <b>new attachment</b>'),
        multiple: function (files, view) {
            _(files).each(function (fileData) {
                view.baton.attachmentList.addFile(fileData);
            });

        }
    });

    return null; //just used to clean up the view class
});