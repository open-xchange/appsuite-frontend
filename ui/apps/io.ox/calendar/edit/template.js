/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/calendar/edit/template',
    ['io.ox/core/extensions',
     'gettext!io.ox/calendar/edit/main',
     'io.ox/calendar/util',
     'io.ox/contacts/util',
     'io.ox/backbone/views',
     'io.ox/backbone/forms',
     'io.ox/core/tk/attachments',
     'io.ox/calendar/edit/recurrence-view',
     'io.ox/calendar/api',
     'io.ox/participants/views',
     'settings!io.ox/calendar',
     'io.ox/core/notifications',
     'io.ox/core/capabilities'
    ], function (ext, gt, calendarUtil, contactUtil, views, forms, attachments, RecurrenceView, api, pViews, settings, notifications, capabilities) {

    'use strict';

    var point = views.point('io.ox/calendar/edit/section'),
        collapsed = false;

    // create blacklist
    var blackList = {},
        blackListStr = settings.get('participantBlacklist') || '';

    _(blackListStr.split(',')).each(function (item) {
        blackList[item.trim()] = true;
    });

    // subpoint for conflicts
    var pointConflicts = point.createSubpoint('conflicts', {
        index: 120,
        id: 'conflicts',
        className: 'additional-info'
    });

    ext.point('io.ox/calendar/edit/section/header').extend({
        draw: function (baton) {
            var row = $('<div class="row-fluid header">');
            ext.point('io.ox/calendar/edit/section/title').invoke('draw', row, baton);
            ext.point('io.ox/calendar/edit/section/buttons').invoke('draw', row, baton);
            this.append(row);
        }
    });

    // pane title and button area
    ext.point('io.ox/calendar/edit/section/title').extend({
        index: 100,
        id: 'title',
        draw: function (baton) {
            this.append($('<h1>').addClass('clear-title title').text(gt(baton.mode === 'edit' ? 'Edit appointment' : 'Create appointment')));
        }
    });

    // buttons
    ext.point('io.ox/calendar/edit/section/buttons').extend({
        index: 100,
        id: 'save',
        draw: function (baton) {
            this.append($('<button type="button" class="btn btn-primary save" data-action="save" >')
                .text(baton.mode === 'edit' ? gt('Save') : gt('Create'))
                .on('click', function () {
                    //check if attachments are changed
                    if (baton.attachmentList.attachmentsToDelete.length > 0 || baton.attachmentList.attachmentsToAdd.length > 0) {
                        baton.model.attributes.tempAttachmentIndicator = true;//temporary indicator so the api knows that attachments needs to be handled even if nothing else changes
                    }
                    baton.model.save().done(function () {
                        baton.app.onSave();
                    });
                })
            );

        }
    });

    ext.point('io.ox/calendar/edit/section/buttons').extend({
        index: 200,
        id: 'discard',
        draw: function (baton) {
            this.append($('<button type="button" class="btn discard" data-action="discard" >')
                .text(gt('Discard'))
                .on('click', function () {
                    baton.app.quit();
                })
            );
        }
    });

    // conflicts
    pointConflicts.extend({
        index: 100,
        id: 'io.ox/calendar/edit/conflicts/main',
        tagName: 'div'
    });

    // alert error
    point.extend(new forms.ErrorAlert({
        index: 100,
        id: 'error',
        isRelevant: function (response) {
            // don't handle conflicts as error
            if (response.conflicts) {
                return false;
            }
            return true;
        }
    }));

    // title
    point.extend(new forms.InputField({
        id: 'title',
        index: 200,
        className: 'span12',
        labelClassName: 'control-label desc',
        control: '<input type="text" class="span12">',
        attribute: 'title',
        label: gt('Subject'),
        changeAppTitleOnKeyUp: true
    }));

    // location input
    point.extend(new forms.InputField({
        id: 'location',
        className: 'span12',
        labelClassName: 'control-label desc',
        index: 300,
        control: '<input type="text" class="span12">',
        attribute: 'location',
        label: gt('Location')
    }));

    var datepickerSpan = _.device('small') ? 'span6' : 'span4';
    // start date
    point.extend(new forms.DatePicker({
        id: 'start-date',
        index: 400,
        className: datepickerSpan,
        labelClassName: 'control-label desc',
        display: 'DATETIME',
        attribute: 'start_date',
        label: gt('Starts on')
    }));

    // end date
    point.extend(new forms.DatePicker({
        id: 'end-date',
        className: datepickerSpan,
        labelClassName: 'control-label desc',
        display: 'DATETIME',
        index: 500,
        attribute: 'end_date',
        label: gt('Ends on')
    }), {
        nextTo: 'start-date',
        rowClass: 'dateinput'
    });

    // find free time link
    point.basicExtend({
        id: 'find-free-time-1',
        index: 550,
        nextTo: 'end-date',
        draw: function () {
            if (_.device('!small')) {
                this.append(
                    $('<div class="span4"><label class="find-free-time"></label></div>')
                );
            }
        }
    });

    // full time
    point.extend(new forms.CheckBoxField({
        id: 'full_time',
        className: 'span12',
        labelClassName: 'control-label desc',
        label: gt('All day'),
        attribute: 'full_time',
        index: 600
    }));

    // move recurrence view to collapsible area on mobile devices
    var recurrenceIndex = _.device('small') ? 950 : 650;
    // recurrence
    point.extend(new RecurrenceView({
        id: 'recurrence',
        className: 'span12',
        index: recurrenceIndex
    }), {
        rowClass: 'collapsed'
    });

    // note
    point.extend(new forms.InputField({
        id: 'note',
        index: 700,
        className: 'span12',
        labelClassName: 'control-label desc',
        control: '<textarea class="note">',
        attribute: 'note',
        label: gt('Description')
    }));

    // separator or toggle
    point.basicExtend({
        id: 'noteSeparator',
        index: 750,
        draw: function (baton) {
            var self = this;
            if (_.device('small')) {
                this.append(
                    $('<a href="#">')
                        .text(gt('Expand form'))
                        .addClass('actionToggle spacer')
                        .on('click', function (e) {
                            e.preventDefault();
                            $('.row-fluid.collapsed', baton.parentView.$el).toggle();
                            if (collapsed) {
                                $(this).text(gt('Expand form')).addClass('spacer');
                            } else {
                                $(this).text(gt('Collapse form')).removeClass('spacer');
                            }
                            collapsed = !collapsed;
                        })
                );
            } else {
                this.append($('<span>&nbsp;</span>'));
            }
        }
    });

    // alarms
    (function () {
        point.extend(new forms.SelectBoxField({
            id: 'alarm',
            index: 800,
            labelClassName: 'control-label desc',
            className: 'span4',
            attribute: 'alarm',
            label: gt('Reminder'),
            selectOptions: calendarUtil.getReminderOptions()
        }), {
            rowClass: 'collapsed'
        });
    }());

    // shown as
    point.extend(new forms.SelectBoxField({
        id: 'shown_as',
        index: 900,
        className: 'span4',
        attribute: 'shown_as',
        label: //#. Describes how a appointment is shown in the calendar, values can be "reserved", "temporary", "absent" and "free"
               gt('Shown as'),
        labelClassName: 'control-label desc',
        selectOptions: {
            1: gt('Reserved'),
            2: gt('Temporary'),
            3: gt('Absent'),
            4: gt('Free')
        }
    }), {
        nextTo: 'alarm',
        rowClass: 'collapsed'
    });

    // private?
    point.extend(new forms.CheckBoxField({
        id: 'private_flag',
        labelClassName: 'control-label desc',
        headerClassName: 'control-label desc',
        className: 'span4',
        header: gt('Type'),
        label: gt('Private'),
        attribute: 'private_flag',
        index: 1000
    }), {
        nextTo: 'shown_as',
        rowClass: 'collapsed'
    });

    // participants label
    point.extend(new forms.SectionLegend({
        id: 'participants_legend',
        className: 'span12 find-free-time',
        label: gt('Participants'),
        index: 1300
    }), {
        rowClass: 'collapsed'
    });

    // participants
    point.basicExtend({
        id: 'participants_list',
        index: 1400,
        rowClass: 'collapsed',
        draw: function (baton) {
            this.append(new pViews.UserContainer({
                    collection: baton.model.getParticipants(),
                    baton: baton,
                    sortBy: 'organizer'
                }).render().$el);
        }
    });

    // add participants
    point.basicExtend({
        id: 'add-participant',
        index: 1500,
        rowClass: 'collapsed',
        draw: function (options) {
            var pNode;
            this.append(
                pNode = $('<div class="input-append span6">').append(
                    $('<input type="text" class="add-participant" tabindex="1">').attr('placeholder', gt('Add participant/resource')),
                    $('<button type="button" class="btn" data-action="add" tabindex="1">')
                        .append($('<i class="icon-plus">'))
                )
            );

            require(['io.ox/calendar/edit/view-addparticipants'], function (AddParticipantsView) {

                var collection = options.model.getParticipants(),
                    autocomplete = new AddParticipantsView({ el: pNode, blackList: blackList });

                collection.each(function (item) {
                    if (blackList[item.getEmail()]) {
                        collection.remove(item);
                    }
                });

                if (!_.browser.Firefox) { pNode.addClass('input-append-fix'); }

                autocomplete.render();

                //add recipents to baton-data-node; used to filter sugestions list in view
                autocomplete.on('update', function () {
                    var baton = {list: []};
                    collection.each(function (item) {
                        //participant vs. organizer
                        var email = item.get('email1') || item.get('email2');
                        if (email !== null)
                            baton.list.push({email: email, id: item.get('user_id') || item.get('internal_userid') || item.get('id'), type: item.get('type')});
                    });
                    $.data(pNode, 'baton', baton);
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
                        if (blackList[contactUtil.getMail(data)]) {
                            notifications.yell('warning', gt('This email address cannot be used for appointments'));
                        } else {
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
                    }
                });
            });
        }
    });

    point.extend(new forms.CheckBoxField({
        id: 'notify',
        labelClassName: 'control-label desc',
        //headerClassName: 'control-label desc',
        className: 'span6',
        //header: gt('Notify all participants via email.'),
        label: gt('Notify all participants by email.'),
        attribute: 'notification',
        index: 1510,
        customizeNode: function () {
            this.$el.css('paddingTop', '5px');
        }
    }), {
        nextTo: 'add-participant',
        rowClass: 'collapsed'
    });

    // Attachments

    // attachments label
    point.extend(new forms.SectionLegend({
        id: 'attachments_legend',
        className: 'span12',
        label: gt('Attachments'),
        index: 1600
    }), {
        rowClass: 'collapsed'
    });


    point.extend(new attachments.EditableAttachmentList({
        id: 'attachment_list',
        registerAs: 'attachmentList',
        className: 'div',
        index: 1700,
        module: 1,
        finishedCallback: function (model, id) {
            var obj = {};
            obj.id = model.attributes.id || id;//new objects have no id in model yet
            obj.folder_id = model.attributes.folder_id || model.attributes.folder;
            if (model.attributes.recurrence_position !== null) {
                obj.recurrence_position = model.attributes.recurrence_position;
            }
            api.attachmentCallback(obj);
        }
    }), {
        rowClass: 'collapsed'
    });

    point.basicExtend({
        id: 'attachments_upload',
        index: 1800,
        rowClass: 'collapsed',
        draw: function (baton) {
            var $node = $('<form>').appendTo(this).attr('id', 'attachmentsForm'),
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
                            $input = $('<input>', { type: 'file', name: 'file' })
                                    .on('change', changeHandler)
                                    .appendTo($input.parent());
                        }
                    }
                };
            $input.on('change', changeHandler);
            $inputWrap.on('change.fileupload', function (e) {
                //use bubbled event to add fileupload-new again (workaround to add multiple files with IE)
                $(this).find('div[data-provides="fileupload"]').addClass('fileupload-new').removeClass('fileupload-exists');
            });
            $node.append($('<div>').addClass('span12').append($inputWrap));
        }
    });

    ext.point('io.ox/calendar/edit/dnd/actions').extend({
        id: 'attachment',
        index: 10,
        label: gt('Drop here to upload a <b class="dndignore">new attachment</b>'),
        multiple: function (files, app) {
            _(files).each(function (fileData) {
                app.view.baton.attachmentList.addFile(fileData);
            });
        }
    }, {
        rowClass: 'collapsed'
    });

    point.basicExtend({
        id: 'dummy_spacer',
        index: 10000,
        rowClass: 'collapsed',
        draw: function () {
            this.append('<div>').css('height', '100px');
        }
    });

    function openFreeBusyView(e) {
        var app = e.data.app, model = e.data.model;
        e.preventDefault();
        ox.launch('io.ox/calendar/freebusy/main', {
            app: app,
            start_date: model.get('start_date'),
            end_date: model.get('end_date'),
            folder: model.get('folder_id'),
            participants: model.get('participants'),
            model: model
        });
    }

    // link free/busy view
    point.basicExtend({
        id: 'link-free-busy',
        index: 100000,
        draw: function (baton) {
            // because that works
            if (capabilities.has('freebusy !alone') && _.device('!small')) {
                var selector = 'label.find-free-time, .find-free-time legend';
                this.parent().find(selector).append(
                    $('<a href="#" class="pull-right" tabindex="1">').text(gt('Find a free time'))
                        .on('click', { app: baton.app, model: baton.model }, openFreeBusyView)
                );
            }
        }
    });

     // bottom toolbar for mobile only
    ext.point('io.ox/calendar/edit/bottomToolbar').extend({
        id: 'toolbar',
        index: 2500,
        draw: function (baton) {
            // must be on a non overflow container to work with position:fixed
            var node = $(baton.app.attributes.window.nodes.body),
                toolbar;
            node.append(toolbar = $('<div class="app-bottom-toolbar">'));
            ext.point('io.ox/calendar/edit/section/buttons').replace({
                id: 'save',
                index: 200
            }).replace({
                id: 'discard',
                index: 100
            });
            ext.point('io.ox/calendar/edit/section/buttons').enable('save').enable('discard').invoke('draw', toolbar, baton);
        }
    });

    if (!capabilities.has('infostore')) {
        ext.point('io.ox/calendar/edit/section').disable('attachments_legend');
        ext.point('io.ox/calendar/edit/section').disable('attachments_upload');
    }

    return null;
});
