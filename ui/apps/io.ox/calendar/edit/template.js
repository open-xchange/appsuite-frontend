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
         'io.ox/contacts/util',
         'io.ox/core/date',
         'io.ox/backbone/views',
         'io.ox/backbone/forms',
         'io.ox/calendar/edit/binding-util',
         'io.ox/participants/views'], function (ext, gt, util, dateAPI, views, forms, BinderUtils, pViews) {

    'use strict';

    var point = views.point('io.ox/calendar/edit/section');
    var convertImageStyle = function (url) {
        if (_.isString(url) && url.length > 1) {
            url = url.replace(/^\/ajax/, ox.apiRoot);
            return 'url("' + url + '")';
        } else {
            return '';
        }
    };

    ext.point('io.ox/calendar/edit/section').extend({
        index: 100,
        id: 'error',
        draw: function (data) {
            this.append($('<div>').addClass('error-display'));
        }
    };

    point.extend(new forms.ErrorAlert({
        index: 100,
        id: 'io.ox/calendar/edit/section/error'
    }));

    point.basicExtend({
        index: 120,
        id: 'additionalinfo',
        draw: function (data) {
            this.append($('<div>').addClass('additional-info'));
        }
    });

    point.extend(new forms.InputField({
        id: 'io.ox/calendar/edit/section/title',
        index: 200,
        className: 'span12',
        control: '<input type="text" class="span12">',
        attribute: 'title',
        label: gt('Subject')
    }));

    point.extend(new forms.InputField({
        id: 'io.ox/calendar/edit/section/location',
        className: 'span10',
        index: 300,
        control: '<input type="text" class="span12">',
        attribute: 'location',
        label: gt('Location')
    }), {
        forceLine: 3
    });

    point.basicExtend({
        id: 'io.ox/calendar/edit/section/save',
        draw: function (data) {
            this.append($('<button class="btn btn-primary span2">').text(gt("Create")).css({marginTop: '25px', float: 'right'}).on('click', function () {
                data.parentView.trigger('save', data);
            }));
        },
        forceLine: 3
    });


    function DateField(options) {
        var hours_typeahead = [];
        var filldate = new dateAPI.Local();
        filldate.setHours(0);
        filldate.setMinutes(0);
        for (var i = 0; i < 24; i++) {
            hours_typeahead.push(filldate.format(dateAPI.TIME));
            filldate.add(1000 * 60 * 30); //half hour
            hours_typeahead.push(filldate.format(dateAPI.TIME));
            filldate.add(1000 * 60 * 30); //half hour
        }

        var comboboxHours = {
            source: hours_typeahead,
            items: 48,
            menu: '<ul class="typeahead dropdown-menu calendaredit"></ul>',
            sorter: function (items) {
                items = _(items).sortBy(function (item) {
                    var pd = dateAPI.Local.parse(item, dateAPI.TIME);
                    return pd.getTime();
                });
                return items;
            },
            autocompleteBehavoir: false
        };
        var modelEvents = {};
        modelEvents['change:' + options.attribute] = 'setValueInField';
        modelEvents['invalid:' + options.attribute] = 'showError';
        modelEvents.valid = 'removeError';
        modelEvents['change:full_time'] = 'onFullTimeChange';

        _.extend(this, {
            tagName: 'div',
            render: function () {
                this.nodes = {};
                this.$el.append(
                        this.nodes.controlGroup = $('<div class="control-group">').append(
                            $('<label>').text(this.label),
                            $('<div class="control">').append(
                                this.nodes.dayField = $('<input type="text" class="input-small">'),
                                '&nbsp;',
                                this.nodes.timeField = $('<input type="text" class="input-mini">'),
                                '&nbsp;',
                                this.nodes.timezoneField = $('<span class="label">').text(dateAPI.Local.getTTInfoLocal(this.model.get(this.attribute)).abbr)
                            )
                        )
                );
                this.setValueInField();
                // get the right date format
                var dateFormat = dateAPI.getFormat(dateAPI.DATE).replace(/\by\b/, 'yyyy').toLowerCase();
                this.nodes.dayField.datepicker({format: dateFormat});
                this.nodes.timeField.combobox(comboboxHours);

                this.nodes.dayField.on("change", _.bind(this.updateModelDate, this));
                this.nodes.timeField.on("change", _.bind(this.updateModelTime, this));
                return this;
            },
            setValueInField: function () {
                var value = this.model.get(this.attribute);
                this.nodes.timezoneField.text(dateAPI.Local.getTTInfoLocal(value).abbr);
                this.nodes.dayField.val(BinderUtils.convertDate('ModelToView', value, this.attribute, this.model));
                this.nodes.timeField.val(BinderUtils.convertTime('ModelToView', value, this.attribute, this.model));
            },
            updateModelDate: function () {
                this.model.set(this.attribute, BinderUtils.convertDate('ViewToModel', this.nodes.dayField.val(), this.attribute, this.model));
            },
            updateModelTime: function () {
                this.model.set(this.attribute, BinderUtils.convertTime('ViewToModel', this.nodes.timeField.val(), this.attribute, this.model));
            },
            showError: function (messages) {
                this.removeError();
                this.nodes.controlGroup.addClass("error");
                var helpBlock =  this.nodes.helpBlock = $('<div class="help-block error">');
                _(messages).each(function (msg) {
                    helpBlock.append($.txt(msg));
                });
                this.$el.append(helpBlock);
            },
            removeError: function () {
                if (this.nodes.helpBlock) {
                    this.nodes.helpBlock.remove();
                    delete this.nodes.helpBlock;
                    this.nodes.controlGroup.removeClass("error");
                }
            },
            onFullTimeChange: function () {
                if (this.model.get('full_time')) {
                    this.nodes.timeField.hide();
                    this.nodes.timezoneField.hide();
                } else {
                    this.nodes.timeField.show();
                    this.nodes.timezoneField.show();
                }
            },
            modelEvents: modelEvents
        }, options);
    }

    point.extend(new DateField({
        id: 'io.ox/calendar/edit/section/start-date',
        index: 400,
        className: 'span6',
        attribute: 'start_date',
        label: gt('Starts on')
    }), {
        forceLine: 4
    });

    point.extend(new DateField({
        id: 'io.ox/calendar/edit/section/end-date',
        className: 'span6',
        index: 500,
        attribute: 'end_date',
        label: gt('Ends on')
    }), {
        forceLine: 4
    });

    point.extend(new forms.CheckBoxField({
        id: 'io.ox/calendar/edit/section/full_time',
        className: 'span12',
        label: gt('All day'),
        attribute: 'full_time',
        index: 600
    }));

    point.extend(new forms.InputField({
        id: 'io.ox/calendar/edit/section/note',
        index: 700,
        className: 'span12',
        control: '<textarea class="note">',
        attribute: 'note',
        label: gt("Description")
    }));

    (function () {
        var reminderListValues = [
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
            id: 'io.ox/calendar/edit/section/alarm',
            index: 800,
            className: "span4",
            attribute: 'alarm',
            label: gt("Reminder"),
            selectOptions: options
        }), {
            forceLine: 7
        });

    }());

    point.extend(new forms.SelectBoxField({
        id: 'io.ox/calendar/edit/section/shown_as',
        index: 900,
        className: "span4",
        attribute: 'shown_as',
        label: gt("Shown as"),
        selectOptions: {
            1: gt('Reserved'),
            2: gt('Temporary'),
            3: gt('Absent'),
            4: gt('Free')
        }
    }), {
        forceLine: 7
    });

    point.extend(new forms.CheckBoxField({
        id: 'io.ox/calendar/edit/section/private_flag',
        className: 'span4',
        header: gt('Type'),
        label: gt('Private'),
        attribute: 'private_flag',
        index: 1000
    }), {
        forceLine: 7
    });

    point.extend(new forms.SectionLegend({
        id: 'io.ox/calendar/edit/section/participants_legend',
        className: 'span12',
        label: gt('Participants'),
        index: 1100
    }));

    point.basicExtend({
        id: 'io.ox/calendar/edit/section/participants_list',
        index: 1200,
        draw: function (options) {
            this.append(new pViews.UserContainer({collection: options.model.getParticipants()}).render().$el);
        }
    });

    point.basicExtend({
        id: 'io.ox/calendar/edit/section/add-participant',
        index: 1300,
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
                //node.append($('<button class="btn" type="button" data-action="add">').append($('<i class="icon-plus">')));

                var autocomplete = new AddParticipantsView({el: node});
                autocomplete.render();

                autocomplete.on('select', function (data) {
                    var alreadyParticipant = false, obj,
                    userId;
                    alreadyParticipant = collection.any(function (item) {
                        if (data.type === 5) {
                            return (item.get('mail') === data.mail && item.get('type') === data.type) || (item.get('mail') === data.email1 && item.get('type') === data.type);
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
    /**
     * extpoint
     * conflicts
     */
    ext.point('io.ox/calendar/edit/conflicts').extend({
        index: 1,
        id: 'conflicts',
        draw: function (data) {
            this.append($('<div class="row-fluid show-grid">')
                .css('margin-top', '10px').append(
                    $('<span class="span12">').css('text-align', 'right').append(
                        $('<a class="btn">')
                            .attr('data-action', 'cancel')
                            .text(gt('Cancel')),
                        $('<a class="btn btn-danger">')
                            .addClass('btn')
                            .attr('data-action', 'ignore')
                            .text(gt('Ignore conflicts')))));
        }
    });
    /**
     * extension point
     * user drawing in participant view
     */
    ext.point('io.ox/calendar/edit/participants/user').extend({
        index: 1,
        id: 'participant_user',
        draw: function (model) {

            this.append(
                $('<div class="contact-image">')
                    .css("background-image", convertImageStyle(model.get('image1_url'))),
                $('<div>').append(
                    $('<a class="person-link">')
                        .text(util.getDisplayName(model.toJSON()))
                ),
                $('<div class="email">')
                    .text(util.getMail(model.toJSON())),
                // only append remove icon if user is removable
                model.get('ui_removable') !== false ? $('<a class="remove">')
                    .attr('href', '#').append(
                        $('<div class="icon">').append('<i class="icon-remove"></i>')
                    ) : $()
            );
        }
    });
    /**
     * extension point
     * groups in particpant view
     */
    ext.point('io.ox/calendar/edit/participants/usergroup').extend({
        index: 1,
        id: 'participant_group',
        draw: function (model) {
            this.append(
                $('<div class="group-image">'),
                $('<div>')
                     .text(util.getDisplayName(model.toJSON())),
                gt("Group"),
                $('<a class="remove">')
                    .attr('href', '#').append(
                        $('<div class="icon">').append(
                            '<i class="icon-remove"></i>')
                        )
             );
        }
    });

    ext.point('io.ox/calendar/edit/participants/resource').extend({
        index: 1,
        id: 'resource',
        draw: function (model) {
            this.append(
                $('<div class="resource-image">'),
                $('<div>')
                    .text(util.getDisplayName(model.toJSON())),
                gt("Resource"),
                $('<a class="remove">')
                    .attr('href', '#').append(
                        $('<div class="icon">').append(
                            '<i class="icon-remove"></i>')
                        )
            );
        }
    });

    ext.point('io.ox/calendar/edit/participants/externaluser').extend({
        index: 1,
        id: 'externaluser',
        draw: function (model) {
            this.append(
                $('<div class="external-user-image">'),
                $('<div>').append(
                    $('<a class="person-link">')
                         .text(util.getDisplayName(model.toJSON()))
                ),
                $('<div class="email">')
                    .text(util.getMail(model.toJSON())),
                $('<a class="remove">').attr('href', '#').append(
                    $('<div class="icon">').append(
                        '<i class="icon-remove"></i>')
                    )
            );
        }
    });

    ext.point('io.ox/calendar/edit/participants/distlistusergroup').extend({
        index: 1,
        id: 'distlistgroup',
        draw: function (model) {
            this.append(
                $('<div class="group-image">'),
                $('<div>')
                    .text(util.getDisplayName(model.toJSON())),
                gt("Distribution list"),
                $('<a class="remove">')
                    .attr('href', '#').append(
                        $('<div class="icon">').append(
                            '<i class="icon-remove"></i>')
                        )
            );
        }
    });


/*
//    ext.point('io.ox/calendar/edit/section').extend({
//        index: 240,
//        id: 'participants',
//        draw: function (data) {
//            this.append(
//                $('<div class="row-fluid show-grid">').append(
//                    $('<div class="span12">').append(
//                        $('<legend class="sectiontitle">')
//                            .text(gt("Participants")))),
//                $('<div class="row-fluid show-grid participantsrow">').append(
//                    $('<div class="span12 participants">')),
//                $('<div class="row-fluid show-grid add-participants">').append(
//                    $('<div class="span6 control-group">').append(
//                        $('<div class="controls">').append(
//                            $('<div class="input-append">').append(
//                                $('<input type="text" class="add-participant">')).append(
//                                    $('<button class="btn" type="button" data-action="add">').append(
//                                        $('<i class="icon-plus">'))).append(
//                                $('<div class="help">')
//                                    .text(gt('To add participants manually, just provide a valid email address (e.g john.doe@example.com or "John Doe" <jd@example.com>)')))))).append(
//                    $('<div class="control-group span6 notify-participants">').append(
//                        $('<div class="controls">').append(
//                            $('<input type="checkbox" data-property="notification">')
//                                .attr('id', data.uid + "_notification"),
//                            $('<label class="label-inline">')
//                                .attr('for', data.uid + '_notification')
//                                .text(gt('Notify all participants about this change'))))));
    */

//    /**
//     * RECURRENCE CONTAINER
//     */
//    ext.point('io.ox/calendar/edit/section').extend({
//        index: 181,
//        id: 'repeat-option',
//        draw: function (data) {
//            this.append(
//                $('<div class="edit-appointment-recurrence-container">')
//            );
//        }
//    });
//
//
//
//    ext.point('io.ox/calendar/edit/section').extend({
//        index: 240,
//        id: 'participants',
//        draw: function (data) {
//            this.append(
//                $('<div class="row-fluid show-grid">').append(
//                    $('<div class="span12">').append(
//                        $('<legend class="sectiontitle">')
//                            .text(gt("Participants")))),
//                $('<div class="row-fluid show-grid participantsrow">').append(
//                    $('<div class="span12 participants">')),
//                $('<div class="row-fluid show-grid add-participants">').append(
//                    $('<div class="span6 control-group">').append(
//                        $('<div class="controls">').append(
//                            $('<div class="input-append">').append(
//                                $('<input type="text" class="add-participant">')).append(
//                                    $('<button class="btn" type="button" data-action="add">').append(
//                                        $('<i class="icon-plus">'))).append(
//                                $('<div class="help">')
//                                    .text(gt('To add participants manually, just provide a valid email address (e.g john.doe@example.com or "John Doe" <jd@example.com>)')))))).append(
//                    $('<div class="control-group span6 notify-participants">').append(
//                        $('<div class="controls">').append(
//                            $('<input type="checkbox" data-property="notification">')
//                                .attr('id', data.uid + "_notification"),
//                            $('<label class="label-inline">')
//                                .attr('for', data.uid + '_notification')
//                                .text(gt('Notify all participants about this change'))))));
//        }
//    });
//    /**
//     * extpoint
//     * conflicts
//     */
//    ext.point('io.ox/calendar/edit/conflicts').extend({
//        index: 1,
//        id: 'conflicts',
//        draw: function (data) {
//            this.append($('<div class="row-fluid show-grid">')
//                .css('margin-top', '10px').append(
//                    $('<span class="span12">').css('text-align', 'right').append(
//                        $('<a class="btn">')
//                            .attr('data-action', 'cancel')
//                            .text(gt('Cancel')),
//                        $('<a class="btn btn-danger">')
//                            .addClass('btn')
//                            .attr('data-action', 'ignore')
//                            .text(gt('Ignore conflicts')))));
//        }
//    });
//    /**
//     * extension point
//     * user drawing in participant view
//     */
//    ext.point('io.ox/calendar/edit/participants/user').extend({
//        index: 1,
//        id: 'participant_user',
//        draw: function (model) {
//
//            this.append(
//                $('<div class="contact-image">')
//                    .css("background-image", convertImageStyle(model.get('image1_url'))),
//                $('<div>').append(
//                    $('<a class="person-link">')
//                        .text(util.getDisplayName(model.toJSON()))
//                ),
//                $('<div class="email">')
//                    .text(util.getMail(model.toJSON())),
//                // only append remove icon if user is removable
//                model.get('ui_removable') !== false ? $('<a class="remove">')
//                    .attr('href', '#').append(
//                        $('<div class="icon">').append('<i class="icon-remove"></i>')
//                    ) : $()
//            );
//        }
//    });
//    /**
//     * extension point
//     * groups in particpant view
//     */
//    ext.point('io.ox/calendar/edit/participants/usergroup').extend({
//        index: 1,
//        id: 'participant_group',
//        draw: function (model) {
//            this.append(
//                $('<div class="group-image">'),
//                $('<div>')
//                     .text(util.getDisplayName(model.toJSON())),
//                gt("Group"),
//                $('<a class="remove">')
//                    .attr('href', '#').append(
//                        $('<div class="icon">').append(
//                            '<i class="icon-remove"></i>')
//                        )
//             );
//        }
//    });
//
//    ext.point('io.ox/calendar/edit/participants/resource').extend({
//        index: 1,
//        id: 'resource',
//        draw: function (model) {
//            this.append(
//                $('<div class="resource-image">'),
//                $('<div>')
//                    .text(util.getDisplayName(model.toJSON())),
//                gt("Resource"),
//                $('<a class="remove">')
//                    .attr('href', '#').append(
//                        $('<div class="icon">').append(
//                            '<i class="icon-remove"></i>')
//                        )
//            );
//        }
//    });
//
//    ext.point('io.ox/calendar/edit/participants/externaluser').extend({
//        index: 1,
//        id: 'externaluser',
//        draw: function (model) {
//            this.append(
//                $('<div class="external-user-image">'),
//                $('<div>').append(
//                    $('<a class="person-link">')
//                         .text(util.getDisplayName(model.toJSON()))
//                ),
//                $('<div class="email">')
//                    .text(util.getMail(model.toJSON())),
//                $('<a class="remove">').attr('href', '#').append(
//                    $('<div class="icon">').append(
//                        '<i class="icon-remove"></i>')
//                    )
//            );
//        }
//    });
//
//    ext.point('io.ox/calendar/edit/participants/distlistusergroup').extend({
//        index: 1,
//        id: 'distlistgroup',
//        draw: function (model) {
//            this.append(
//                $('<div class="group-image">'),
//                $('<div>')
//                    .text(util.getDisplayName(model.toJSON())),
//                gt("Distribution list"),
//                $('<a class="remove">')
//                    .attr('href', '#').append(
//                        $('<div class="icon">').append(
//                            '<i class="icon-remove"></i>')
//                        )
//            );
//        }
//    });
//
//
//    /**
//     * shows which type of recurrence is selected
//     */
//    ext.point('io.ox/calendar/edit/recurrence').extend({
//        index: 100,
//        id: 'options',
//        draw: function (data) {
//            console.log("draw ext recurrence", data);
//            this.append(
//                $('<div class="span12">').append(
//                    $('<div class="span3">').append(
//                        $('<div class="inner-margin">').append(
//                            $('<label class="radio">').append(
//                                $('<input type="radio" checked="checked">')
//                                .attr({
//                                    'id': data.uid + '_daily',
//                                    'value': '1',
//                                    'name': 'recurrence_type'
//                                })
//                                .after(gt("Daily"))
//                            )
//                        )
//                    ),
//                    $('<div class="span3">').append(
//                        $('<div class="inner-margin">').append(
//                            $('<label class="radio">').append(
//                                $('<input type="radio">')
//                                .attr({
//                                    'id': data.uid + '_weekly',
//                                    'value': '2',
//                                    'name': 'recurrence_type'
//                                })
//                                .after(gt("Weekly"))
//                            )
//                        )
//                    ),
//                    $('<div class="span3">').append(
//                        $('<div class="inner-margin">').append(
//                            $('<label class="radio">').append(
//                                $('<input type="radio">')
//                                    .attr({
//                                        'id': data.uid + '_monthly',
//                                        'value': '3',
//                                        'name': 'recurrence_type'
//                                    })
//                                    .after(gt("Monthly"))
//                            )
//                        )
//                    ),
//                    $('<div class="span3">').append(
//                        $('<div class="inner-margin">').append(
//                            $('<label class="radio">').append(
//                                $('<input type="radio">')
//                                    .attr({
//                                        'id': data.uid + '_yearly',
//                                        'value': '4',
//                                        'name': 'recurrence_type'
//                                    })
//                                    .after(gt("Yearly"))
//                            )
//                        )
//                    )
//                 )
//            );
//        }
//    });
//    /**
//     * day options for recurrence
//     */
//    ext.point('io.ox/calendar/edit/recurrence').extend({
//        index: 200,
//        id: 'dayoption',
//        draw: function (data) {
//            this.append(
//                $('<div class="span12 recurrence_details daily">').append(
//                    $('<form class="form-inline">').append(
//                        $('<span class="margin-right">')
//                            .text(gt("Every")),
//                        $('<input type="text" class="input-extra-small">')
//                            .attr({
//                                'size': 2,
//                                'name': 'recurrence_days_input',
//                                'value': data.days
//                            })
//                            .after(
//                                $('<span class="margin-left">')
//                                    .text(gt("Days")))
//                    )
//                )
//            );
//        }
//    });
//
//    /**
//     * week options for recurrence
//     */
//    ext.point('io.ox/calendar/edit/recurrence').extend({
//        index: 300,
//        id: 'weekoption',
//        draw: function (data) {
//            var days = ['<option>Montag</option>',
//                        '<option>Dienstag</option>',
//                        '<option>Mittwoch</option>',
//                        '<option>Donnerstag</option>',
//                        '<option>Freitag</option>',
//                        '<option>Samstag</option>',
//                        '<option>Sonntag</option>'];
//            this.append(
//                $('<div class="span12 recurrence_details weekly">').append(
//                    $('<form class="form-inline">').append(
//                        $('<span class="margin-right">')
//                            .text(gt("Every")),
//                        $('<input type="text">')
//                            .attr({
//                                'size': 2,
//                                'name': 'recurrence_days_input',
//                                'value': data.days
//                            })
//                            .css('width', '25px') // TODO not so nice, find better value
//                            .after(
//                                $('<span class="margin-left">')
//                                    .text(gt("Weeks on"))
//                                )),
//                    $('<form class="form-inline">').append(
//                        $('<div class=" ">')
//                            .append($('<label class="checkbox">').append(
//                                $('<input type="checkbox">')
//                                    .attr({
//                                        'value': 'monthly',
//                                        'name': 'rec_weekly_weekday'
//                                    })
//                                    .after(gt("Monday"))
//                            )
//                        ),
//                        $('<div class=" ">').append(
//                            $('<label class="checkbox">').append(
//                                $('<input type="checkbox">')
//                                    .attr({
//                                        'value': 'monthly',
//                                        'name': 'rec_weekly_weekday'
//                                    })
//                                    .after(gt("Tuesday"))
//                            )
//                        ),
//                        $('<div class=" ">').append(
//                            $('<label class="checkbox">').append(
//                                $('<input type="checkbox">')
//                                    .attr({
//                                        'value': 'monthly',
//                                        'name': 'rec_weekly_weekday'
//                                    })
//                                    .after(gt("Wednesday"))
//                            )
//                        ),
//                        $('<div class=" ">').append(
//                            $('<label class="checkbox">').append(
//                                $('<input type="checkbox">')
//                                    .attr({
//                                        'value': 'monthly',
//                                        'name': 'rec_weekly_weekday'
//                                    })
//                                    .after(gt("Thursday"))
//                            )
//                        ),
//                        $('<div class=" ">').append(
//                            $('<label class="checkbox">').append(
//                                $('<input type="checkbox">')
//                                    .attr({
//                                        'value': 'monthly',
//                                        'name': 'rec_weekly_weekday'
//                                    })
//                                    .after(gt("Friday"))
//                            )
//                        ),
//                        $('<div class=" ">').append(
//                            $('<label class="checkbox">').append(
//                                $('<input type="checkbox">')
//                                    .attr({
//                                        'value': 'monthly',
//                                        'name': 'rec_weekly_weekday'
//                                    })
//                                    .after(gt("Saturday"))
//                            )
//                        ),
//                        $('<div class=" ">').append(
//                            $('<label class="checkbox">').append(
//                                    $('<input type="checkbox">')
//                                        .attr({
//                                            'value': 'monthly',
//                                            'name': 'rec_weekly_weekday'
//                                        })
//                                        .after(gt("Sunday"))
//                                )
//                            )
//                    )
//                )
//            );
//        }
//    });
//
//    /*
//     *  <div class="row-fluid show-grid recurrence_details monthly">
//        <div class="container span12">
//            <div class="row-fluid show-grid">
//                <div class="control-group span12">
//                    <div class="controls">
//                        <input type='radio' name='monthly_option' value='one'>
//                        <span class='help-inline'>{{! it.strings.AT }}</span>
//                        <input type='text' name='day_in_month' class='discreet short'/>
//                        <span class='help-inline'>{{! it.strings.TH_DAY_EVERY }}</span>
//                        <input type='text' name='interval' class='discreet short'/>
//                        <span class='help-inline'>{{! it.strings.TH_MONTH }}</span>
//                    </div>
//                </div>
//            </div>
//            <div class="row-fluid show-grid">
//                <div class="control-group span12">
//                    <input type='radio' name='monthly_option' value='two'>
//                    <span class='help-inline'>{{! it.strings.AT }}</span>
//                    <select name='day_in_month'>
//                        <option value='1'>{{! it.strings.FIRST }}</option>
//                        <option value='2'>{{! it.strings.SECOND }}</option>
//                        <option value='3'>{{! it.strings.THIRD }}</option>
//                        <option value='4'>{{! it.strings.FOURTH }}</option>
//                        <option value='5'>{{! it.strings.LAST }}</option>
//                    </select>
//                    <select name='days' class='days'>
//                        {{~it.weekDayList :item:index }}
//                        <option value='{{! item.value }}'>{{! item.label }}</option>
//                        {{~}}
//                    </select>
//                    <span class='help-inline'>{{! it.strings.EVERY }}</span>
//                    <input type='text' name='interval' class='discreet short'/>
//                    <span class='help-inline'>{{! it.strings.TH_MONTH }}</span>
//                </div>
//            </div>
//        </div>
//    </div>
//     */
//    /*
//     * $('<input type="text" class="input-extra-small">')
//                            .attr({
//                                'size': 2,
//                                'name': 'recurrence_days_input',
//                                'value': data.days
//                            })
//                            .after(
//                                $('<span class="margin-left">')
//                                    .text(gt("Days")))
//     */
//    ext.point('io.ox/calendar/edit/recurrence').extend({
//        index: 300,
//        id: 'monthlyoption',
//        draw: function (data) {
//            console.log("draw monthlyoption");
//
//            var weekDayList = [
//                { value: 1, label: gt('Sunday')},
//                { value: 2, label: gt('Monday')},
//                { value: 4, label: gt('Tuesday')},
//                { value: 8, label: gt('Wednesday')},
//                { value: 16, label: gt('Thursday')},
//                { value: 32, label: gt('Friday')},
//                { value: 64, label: gt('Saturday')}
//            ];
//            var dayOptionsFragment = [];
//            _.each(weekDayList, function (days) {
//                console.log(days);
//                var node = $('<option>').attr('value', days.value).text(days.label);
//                dayOptionsFragment.push(node);
//            });
//
//            this.append(
//                $('<div class="span12 recurrence_details monthly">').append(
//                    $('<div class="row-fluid show-grid">').append(
//                        $('<div class="control-group span12">').append(
//                            $('<div class="controls">').append(
//                                $('<input type="radio" name="monthly-option" value="one">'),
//                                $('<span class="help-inline">').text(gt('at')),
//                                $('<input type="text" name="day_in_month" class="discreet short">'),
//                                $('<span class="help-inline">').text(gt('th day every')), // TODO use format with plurals
//                                $('<input type="text" name="interval" class="discreet short">'),
//                                $('<span class="help-inline>').text(gt('th month'))
//
//                            )
//                        )
//                    ),
//                    $('<div class="row-fluid show-grid">').append(
//                        $('<div class="control-group span12">').append(
//                            $('<input type="radio" name="monthly_option" value="two">'),
//                            $('<span class="help-inline">').text(gt('at')),
//                            $('<select name="day_in_month">').append(
//                                $('<option value="1">').text(gt('first')),
//                                $('<option value="2">').text(gt('second')),
//                                $('<option value="3">').text(gt('third')),
//                                $('<option value="4">').text(gt('fourth')),
//                                $('<option value="5">').text(gt('last'))
//                            ),
//                            $('<select name="days">').append(dayOptionsFragment),
//                            $('<span class="help-inline">').text(gt('every')),
//                            $('<input type="text" name="interval" class="discreet short">'),
//                            $('<span class="help-inline">').text(gt('th Month'))
//                        )
//                    )
//                )
//            );
//        }
//    });
//
//    /*
//     *  <div class="row-fluid recurrence_details yearly">
//        <div class="control-group span12">
//            <div class='controls'>
//                <div>
//                    <input type='radio' name='yearly_option' value='one'>
//                    <span class='help-inline'>{{! it.strings.EVERY }}</span>
//                    <input type='text' name='day_in_month' class='short'/>
//                    <span class='help-inline'>{{! it.strings.TH }}</span>
//                    <select name='month' class='month'>
//                        {{~ it.monthList :item:index }}
//                        <option value='{{! item.value }}'>{{! item.label }}</option>
//                        {{~}}
//                    </select>
//                </div>
//                <div>
//                    <input type='radio' name='yearly_option' value='two'>
//                    <span class='help-inline'>{{! it.strings.AT }}</span>
//                    <select name='day_in_month'>
//                        <option value='1'>{{! it.strings.FIRST }}</option>
//                        <option value='2'>{{! it.strings.SECOND }}</option>
//                        <option value='3'>{{! it.strings.THIRD }}</option>
//                        <option value='4'>{{! it.strings.FOURTH }}</option>
//                        <option value='5'>{{! it.strings.LAST }}</option>
//                    </select>
//                    <select name='days' class='days'>
//                        {{~ it.weekDayList :item:index }}
//                        <option value='{{! item.value }}'>{{! item.label }}</option>
//                        {{~}}
//                    </select>
//                    <span class='help-inline'>{{! it.strings.IN }}</span>
//                    <select name='month' class='month'>
//                        {{~ it.monthList :item:index }}
//                        <option value='{{! item.value }}'>{{! item.label }}</option>
//                        {{~}}
//                    </select>
//                </div>
//            </div>
//        </div>
//    </div>
//
//     */
//
// // TODO ext point for yearly recurrence
//
//    //TODO nicen this up
//    ext.point('io.ox/calendar/edit/recurrence/start_stop').extend({
//        index: 1,
//        id: 'start_stop',
//        draw: function (data) {
//            this.append(
//                $('<div class="span12">').append(
//                    /*$('<div class="span6">').append(
//                        $('<label class="control-label desc">')
//                            .attr({
//                                'for': data.uid + '_recurrence_start'
//                            })
//                            .text(gt('Starts on')),
//                        $('<div>').append($('<input type="text" class="discreet startsat-date input-small">')
//                            .attr({
////                                'value': data.startDate,
//                                'name': 'recurrence_start',
//                                'id': data.uid + '_recurrence_start'
//                            }))
//                    ),*/
//                    $('<div class="span6">').append(
//                        $('<label class="control-label desc">')
//                            .attr({
//                                'for': data.uid + '_recurrence_endings'
//                            })
//                            .text(gt('Ends'))
//                    ).append(
//                        $('<div class="controls">').append(
//                            $('<label class="radio">').append(
//                                    $('<input type="radio" name="endingoption">')
//                                        .after(gt("Never"))),
//                            $('<label class="radio">').append(
//                                    $('<input type="radio" name="endingoption">').attr('id', data.uid + '_recurrence_endings')
//                                        .after(gt("On"))),
//                            $('<input type="text" class="discreet until input-small">').attr('name', 'until'),
//                            $('<label class="radio">').append(
//                                    $('<input type="radio" name="endingoption">').attr('id', data.uid + '_recurrence_endings')
//                                        .after($('<span>').text(gt("After")))
//                                ),
//                            $('<div>').append(
//                                $('<input type="text" class="discreet until input-extra-small">')
//                                    .attr('name', 'occurences')
//                                    .css('margin-top', '5px')
//                            )
//                        )
//                    )
//                )
//            );
//
//        }
//    });
    // per default templates return null
    return null;
});