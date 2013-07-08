/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/vacationnotice/settings/view-form', [
    'io.ox/mail/vacationnotice/settings/model',
    'io.ox/backbone/views',
    'io.ox/backbone/forms',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/date',
    'io.ox/core/notifications',
    'gettext!io.ox/mail',
    'less!io.ox/mail/vacationnotice/settings/style.less'
], function (model, views, forms, actions, links, date, notifications, gt) {

    "use strict";

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

    function createVacationEdit(ref, multiValues, timeFrameState) {
        var point = views.point(ref + '/edit/view'),
            VacationEditView = point.createView({
                tagName: 'div',
                className: 'edit-vacation'
            });

        point.extend(new forms.Header({
            index: 50,
            id: 'headline',
            label: model.fields.headline
        }));

        // Show backend errors
        point.extend(new forms.ErrorAlert({
            id: ref + '/edit/view/backendErrors',
            className: 'span7',
            index: 100,
            customizeNode: function () {
                this.$el.css({
                    marginTop: '15px'
                });
            }
        }));

        point.extend(new forms.ControlGroup({
            id: ref + '/edit/view/subject',
            index: 150,
            fluid: true,
            label: model.fields.subject,
            control: '<input type="text" class="span12" name="subject">',
            attribute: 'subject'
        }));

        point.extend(new forms.ControlGroup({
            id: ref + '/edit/view/mailtext',
            index: 200,
            fluid: true,
            label: model.fields.text,
            control: '<textarea rows="12" class="span12" name="text">',
            attribute: 'text'
        }));

        point.extend(new forms.SelectBoxField({
            id: ref + '/edit/view/days',
            index: 250,
            label: model.fields.days,
            attribute: 'days',
            selectOptions: multiValues.days
        }));

        point.extend(new forms.ControlGroup({
            id: ref + '/edit/view/addresses',
            fluid: true,
            index: 300,
            label: model.fields.headlineAdresses

        }));

        _(multiValues.aliases).each(function (alias) {
            point.extend(new forms.CheckBoxField({
                id: ref + '/edit/view/' + alias,
                index: 350,
                className: 'blue',
                label: alias,
                attribute: alias,
                customizeNode: function () {
                    this.$el.css({
                        width: '300px'
                    });
                }
            }));
        });

        model.api.getConfig().done(function (data) {
            var isAvailable = false;
            _(data.tests).each(function (test) {
                if (test.test === 'currentdate') {
                    isAvailable = true;
                }
            });

            if (isAvailable) {

                point.extend(new forms.CheckBoxField({
                    id: ref + '/edit/view/timeframecheckbox',
                    index: 425,
                    label: model.fields.activateTimeFrame,
                    attribute: 'activateTimeFrame',
                    customizeNode: function () {
                        var self = this;

                        this.$el.on('change', function () {
                            var fields = $('.edit-vacation').find('.input-small');

                            if (self.$el.find('input').prop('checked') !== true) {
                                fields.attr('disabled', true);
                            } else {
                                fields.attr('disabled', false);
                            }
                        });
                    }
                }));

                point.extend(new forms.DatePicker({
                    id: ref + '/edit/view/start_date',
                    index: 450,
                    className: 'span2',
                    labelClassName: 'timeframe-edit-label',
                    display: 'DATE',
                    attribute: 'dateFrom',
                    label: model.fields.dateFrom,
                    overwritePositioning: true,
                    initialStateDisabled: timeFrameState ? false : true,
                    updateModelDate: function () {
                        this.model.set(this.attribute, CustomBinderUtils._dateStrToDate(this.nodes.dayField.val(), this.attribute, this.model), {validate: true});
                    },
                    updateModelTime: function () {
                        this.model.set(this.attribute, CustomBinderUtils._timeStrToDate(this.nodes.timeField.val(), this.attribute, this.model), {validate: true});
                    }
                }));

                point.extend(new forms.DatePicker({
                    id: ref + '/edit/view/end_date',
                    index: 500,
                    className: 'span2',
                    labelClassName: 'timeframe-edit-label',
                    display: 'DATE',
                    attribute: 'dateUntil',
                    label: model.fields.dateUntil,
                    overwritePositioning: true,
                    initialStateDisabled: timeFrameState ? false : true,
                    updateModelDate: function () {
                        this.model.set(this.attribute, CustomBinderUtils._dateStrToDate(this.nodes.dayField.val(), this.attribute, this.model), {validate: true});
                    },
                    updateModelTime: function () {
                        this.model.set(this.attribute, CustomBinderUtils._timeStrToDate(this.nodes.timeField.val(), this.attribute, this.model), {validate: true});
                    }
                }));

            }
        });

        return VacationEditView;
    }

    return {
        protectedMethods: {
            createVacationEdit: createVacationEdit
        }
    };

});
