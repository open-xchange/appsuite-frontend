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
     'io.ox/core/date',
     'io.ox/backbone/views',
     'io.ox/backbone/forms',
     'io.ox/core/tk/attachments',
     'io.ox/calendar/edit/recurrence-view',
     'io.ox/calendar/api',
     'io.ox/participants/views',
     'io.ox/core/capabilities'
    ], function (ext, gt, util, dateAPI, views, forms, attachments, RecurrenceView, api, pViews, capabilities) {

    'use strict';

    var point = views.point('io.ox/calendar/edit/section');

    // subpoint for conflicts
    var pointConflicts = point.createSubpoint('conflicts', {
        index: 120,
        id: 'conflicts',
        className: 'additional-info'
    });

    ext.point('io.ox/calendar/edit/section/header').extend({
        draw: function (baton) {
            var row = $('<div class="row-fluid">');
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
            this.append($('<h1>').addClass('title').text(gt(baton.mode === 'edit' ? 'Edit appointment' : 'Create appointment')));
        }
    });

    // buttons
    ext.point('io.ox/calendar/edit/section/buttons').extend({
        index: 100,
        id: 'buttons',
        draw: function (baton) {
            var saveButton;
            this.append(saveButton = $('<button class="btn btn-primary" data-action="save" >')
                .text(baton.mode === 'edit' ? gt("Save") : gt("Create"))
                .css({float: 'right', marginLeft: '13px'})
                .on('click', function () {
                    baton.model.save();
                })
            );
            this.append($('<button class="btn" data-action="discard" >')
                .text(gt("Discard"))
                .css({float: 'right'})
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
        tagName: 'div',
        modelEvents: {
            'conflicts': 'showConflicts'
        },
        showConflicts: function (conflicts) {
            var self = this,
                hardConflict = false,
                saveButton = $('[data-action="save"]', this.$el.closest('.io-ox-calendar-edit'));

            saveButton.addClass('disabled').off('click');
            // look for hard conflicts
            _(conflicts).each(function (conflict) {
                if (conflict.hard_conflict) {
                    hardConflict = true;
                    return;
                }
            });

            require(["io.ox/calendar/conflicts/conflictList"], function (c) {
                var conflictList = c.drawList(conflicts),
                    $acceptButton = hardConflict ? null : $('<a class="btn btn-danger">')
                    .addClass('btn')
                    .text(gt('Ignore conflicts'))
                    .on('click', function (e) {
                        e.preventDefault();
                        self.model.set('ignore_conflicts', true);
                        self.model.save();
                    });
                self.$el.empty().append(
                    conflictList,
                    $('<div class="row">')
                        .css('margin-top', '10px').append(
                            $('<span class="span12">')
                                .css('text-align', 'right').append(
                                    $('<a class="btn">')
                                        .text(gt('Cancel'))
                                        .on('click', function (e) {
                                            e.preventDefault();
                                            self.$el.empty();
                                            saveButton.removeClass('disabled').on('click', function () {
                                                self.model.save();
                                            });
                                        }),
                                    '&nbsp;',
                                    $acceptButton
                                    )
                            )
                    );

            });
        }
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


    // start date
    point.extend(new forms.DatePicker({
        id: 'start-date',
        index: 400,
        className: 'span6',
        labelClassName: 'control-label desc',
        display: 'DATETIME',
        attribute: 'start_date',
        label: gt('Starts on')
    }));

    // end date
    point.extend(new forms.DatePicker({
        id: 'end-date',
        className: 'span6',
        labelClassName: 'control-label desc',
        display: 'DATETIME',
        index: 500,
        attribute: 'end_date',
        label: gt('Ends on')
    }), {
        nextTo: 'start-date'
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

    // recurrence
    point.extend(new RecurrenceView({
        id: 'recurrence',
        className: 'span12',
        index: 650
    }));

    // note
    point.extend(new forms.InputField({
        id: 'note',
        index: 700,
        className: 'span12',
        labelClassName: 'control-label desc',
        control: '<textarea class="note">',
        attribute: 'note',
        label: gt("Description")
    }));

    point.basicExtend({
        id: 'noteSeparator',
        index: 750,
        draw: function () {
            this.append($('<span>&nbsp;</span>').css({height: '10px'}));
        }
    });

    // alarms
    (function () {
        var reminderListValues = [
            {value: -1, format: 'string'},
            {value: 0, format: 'minutes'},
            {value: 15, format: 'minutes'},
            {value: 30, format: 'minutes'},
            {value: 45, format: 'minutes'},

            {value: 60, format: 'hours'},
            {value: 120, format: 'hours'},
            {value: 240, format: 'hours'},
            {value: 360, format: 'hours'},
            {value: 420, format: 'hours'},
            {value: 720, format: 'hours'},

            {value: 1440, format: 'days'},
            {value: 2880, format: 'days'},
            {value: 4320, format: 'days'},
            {value: 5760, format: 'days'},
            {value: 7200, format: 'days'},
            {value: 8640, format: 'days'},

            {value: 10080, format: 'weeks'},
            {value: 20160, format: 'weeks'},
            {value: 30240, format: 'weeks'},
            {value: 40320, format: 'weeks'}
        ];

        var options = {};
        _(reminderListValues).each(function (item, index) {
            var i;
            switch (item.format) {
            case 'string':
                options[item.value] = gt('No reminder');
                break;
            case 'minutes':
                options[item.value] = gt.format(gt.ngettext('%1$d Minute', '%1$d Minutes', item.value), gt.noI18n(item.value));
                break;
            case 'hours':
                i = Math.floor(item.value / 60);
                options[item.value] = gt.format(gt.ngettext('%1$d Hour', '%1$d Hours', i), gt.noI18n(i));
                break;
            case 'days':
                i  = Math.floor(item.value / 60 / 24);
                options[item.value] = gt.format(gt.ngettext('%1$d Day', '%1$d Days', i), gt.noI18n(i));
                break;
            case 'weeks':
                i = Math.floor(item.value / 60 / 24 / 7);
                options[item.value] = gt.format(gt.ngettext('%1$d Week', '%1$d Weeks', i), gt.noI18n(i));
                break;
            }
        });
        point.extend(new forms.SelectBoxField({
            id: 'alarm',
            index: 800,
            labelClassName: 'control-label desc',
            className: "span4",
            attribute: 'alarm',
            label: gt("Reminder"),
            selectOptions: options
        }));

    }());

    // shown as
    point.extend(new forms.SelectBoxField({
        id: 'shown_as',
        index: 900,
        className: "span4",
        attribute: 'shown_as',
        label: //#. Describes how a appointment is shown in the calendar, values can be "reserved", "temporary", "absent" and "free"
               gt("Shown as"),
        labelClassName: 'control-label desc',
        selectOptions: {
            1: gt('Reserved'),
            2: gt('Temporary'),
            3: gt('Absent'),
            4: gt('Free')
        }
    }), {
        nextTo: 'alarm'
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
        nextTo: 'shown_as'
    });

    // participants label
    point.extend(new forms.SectionLegend({
        id: 'participants_legend',
        className: 'span12',
        label: gt('Participants'),
        index: 1300
    }));

    // participants
    point.basicExtend({
        id: 'participants_list',
        index: 1400,
        draw: function (baton) {
            this.append(new pViews.UserContainer({
                    collection: baton.model.getParticipants(),
                    baton: baton,
                    sortBy: 'organizer'
                }).render().$el);
        }
    });
    point.extend(new forms.CheckBoxField({
        id: 'notify',
        labelClassName: 'control-label desc',
        //headerClassName: 'control-label desc',
        className: 'span12',
        //header: gt('Notify all participants via e-mail.'),
        label: gt('Notify all participants by E-mail.'),
        attribute: 'notification',
        index: 1410
    }));

    // add participants
    point.basicExtend({
        id: 'add-participant',
        index: 1500,
        draw: function (options) {
            var node = this;
            require(['io.ox/calendar/edit/view-addparticipants'], function (AddParticipantsView) {

                var collection = options.model.getParticipants();

                node.append(
                    $('<div class="input-append">').append(
                        $('<input type="text" class="add-participant">'),
                        $('<button class="btn" type="button" data-action="add">')
                            .append($('<i class="icon-plus">'))
                    )
                );

                var autocomplete = new AddParticipantsView({el: node});
                autocomplete.render();

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

    // Attachments

    // attachments label
    point.extend(new forms.SectionLegend({
        id: 'attachments_legend',
        className: 'span12',
        label: gt('Attachments'),
        index: 1600
    }));


    point.extend(new attachments.EditableAttachmentList({
        id: 'attachment_list',
        registerAs: 'attachmentList',
        className: 'div',
        index: 1700,
        module: 1
    }));

    point.basicExtend({
        id: 'attachments_upload',
        index: 1800,
        draw: function (baton) {
            var $node = $('<form>').appendTo(this).attr('id', 'attachmentsForm'),
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

    ext.point("io.ox/calendar/edit/dnd/actions").extend({
        id: 'attachment',
        index: 10,
        label: gt("Drop here to upload a <b>new attachment</b>"),
        multiple: function (files, app) {
            _(files).each(function (fileData) {
                app.view.baton.attachmentList.addFile(fileData);
            });

        }
    });

    point.basicExtend({
        id: 'dummy_spacer',
        index: 10000,
        draw: function () {
            this.append('<div>').css('height', '100px');
        }
    });

    // Disable attachments for specific devices (see boot.js)
    if (!ox.uploadsEnabled || !capabilities.has('infostore')) {
        ext.point("io.ox/calendar/edit/section").disable("attachments_legend");
        ext.point("io.ox/calendar/edit/section").disable("attachments_upload");
    }

    return null;
});
