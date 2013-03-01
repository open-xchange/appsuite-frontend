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

define('io.ox/mail/mailfilter/settings/view-form', [
    'io.ox/mail/mailfilter/settings/model',
    'io.ox/backbone/views',
    'io.ox/backbone/forms',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/date',
    'io.ox/core/notifications',
    'gettext!io.ox/mail',
    'less!io.ox/mail/mailfilter/settings/style.css'
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

    function createVacationEdit(ref, multiValues) {
        var point = views.point(ref + '/edit/view'),
            VacationEditView = point.createView({
                tagName: 'div',
                className: 'edit-vacation'
            });

        point.extend(new forms.Header({
            index: 50,
            id: 'headline',
            label: gt('Vacation Notice')
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

        point.extend(new forms.CheckBoxField({
            id: ref + '/edit/view/active',
            index: 250,
            label: model.fields.active,
            attribute: 'active',
            customizeNode: function () {
                this.$el.css({
                    clear: 'both',
                    width: '100px'
                });
            }
        }));

        point.extend(new forms.ControlGroup({
            id: ref + '/edit/view/subject',
            index: 250,
            label: model.fields.subject,
            control: '<input type="text" class="input-xlarge" name="subject">',
            attribute: 'subject'
        }));

        point.extend(new forms.ControlGroup({
            id: ref + '/edit/view/mailtext',
            index: 250,
            label: model.fields.text,
            control: '<textarea rows="12" class="span6" name="text">',
            attribute: 'text'
        }));

        point.extend(new forms.SelectBoxField({
            id: ref + '/edit/view/days',
            index: 250,
            label: model.fields.days,
            attribute: 'days',
            selectOptions: multiValues.days
        }));

        point.extend(new forms.SectionLegend({
            id: ref + '/edit/view/addresses',
            index: 250,
            label: gt('E-mail addresses')
        }));

        _(multiValues.aliases).each(function (alias) {
            point.extend(new forms.CheckBoxField({
                id: ref + '/edit/view/' + alias,
                index: 350,
                label: alias,
                attribute: alias
            }));
        });

        model.api.getConfig().done(function (data) {
            _(data.tests).each(function (test) {
                if (test.test === 'currentdate') {

                    point.extend(new forms.SectionLegend({
                        id: ref + '/edit/view/timeframe',
                        index: 400,
                        label: gt('Timeframe')
                    }));

                    point.extend(new forms.CheckBoxField({
                        id: ref + '/edit/view/activeTimeframe',
                        index: 1500,
                        label: model.fields.activeTimeframe,
                        attribute: 'activeTimeframe',
                        customizeNode: function () {
                            this.$el.css({
                                clear: 'both',
                                width: '300px',
                                margin: '15px 0'
                            });
                        }
                    }));

                    point.extend(new forms.DatePicker({
                        id: ref + '/edit/view/start_date',
                        index: 1600,
                        className: 'span6',
                        labelClassName: 'timeframe-edit-label',
                        display: 'DATE',
                        attribute: 'dateFrom',
                        label: gt('Starts on'),
                        overwritePositioning: true,
                        updateModelDate: function () {
                            this.model.set(this.attribute, CustomBinderUtils._dateStrToDate(this.nodes.dayField.val(), this.attribute, this.model));
                        },
                        updateModelTime: function () {
                            this.model.set(this.attribute, CustomBinderUtils._timeStrToDate(this.nodes.timeField.val(), this.attribute, this.model));
                        }
                    }));

                    point.extend(new forms.DatePicker({
                        id: ref + '/edit/view/end_date',
                        index: 1600,
                        className: 'span6',
                        labelClassName: 'timeframe-edit-label',
                        display: 'DATE',
                        attribute: 'dateUntil',
                        label: gt('Ends on'),
                        overwritePositioning: true,
                        updateModelDate: function () {
                            this.model.set(this.attribute, CustomBinderUtils._dateStrToDate(this.nodes.dayField.val(), this.attribute, this.model));
                        },
                        updateModelTime: function () {
                            this.model.set(this.attribute, CustomBinderUtils._timeStrToDate(this.nodes.timeField.val(), this.attribute, this.model));
                        }
                    }));
                }
            });
        });

//        point.extend(new forms.DateControlGroup({
//            id: ref + '/edit/view/dateFrom',
//            index: 250,
//            label: 'Date from',
//            attribute: 'dateFrom'
//        }));
//
//        point.extend(new forms.DateControlGroup({
//            id: ref + '/edit/view/dateUntil',
//            index: 250,
//            label: 'Date until',
//            attribute: 'dateUntil'
//        }));


        return VacationEditView;
    }

    return {
        protectedMethods: {
            createVacationEdit: createVacationEdit
        }
    };

});
