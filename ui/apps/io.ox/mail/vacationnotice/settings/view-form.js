/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/vacationnotice/settings/view-form',
    ['io.ox/mail/vacationnotice/settings/model',
     'io.ox/backbone/views',
     'io.ox/backbone/forms',
     'less!io.ox/mail/vacationnotice/settings/style.less'
    ], function (model, views, forms) {

    'use strict';

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
            control: '<input type="text" class="span12" name="subject" tabindex="1">',
            attribute: 'subject'
        }));

        point.extend(new forms.ControlGroup({
            id: ref + '/edit/view/mailtext',
            index: 200,
            fluid: true,
            label: model.fields.text,
            control: '<textarea rows="12" class="span12" name="text" tabindex="1">',
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
                                fields.prop('disabled', true);
                            } else {
                                fields.prop('disabled', false);
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
                    initialStateDisabled: timeFrameState ? false : true
                }));

                point.extend(new forms.DatePicker({
                    id: ref + '/edit/view/end_date',
                    index: 500,
                    className: 'span2',
                    labelClassName: 'timeframe-edit-label',
                    display: 'DATE',
                    attribute: 'dateUntil',
                    label: model.fields.dateUntil,
                    initialStateDisabled: timeFrameState ? false : true
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
