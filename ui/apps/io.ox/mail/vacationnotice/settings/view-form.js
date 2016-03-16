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
     'io.ox/core/extensions',
     'io.ox/backbone/mini-views',
     'less!io.ox/mail/vacationnotice/settings/style'
    ], function (model, views, ext, mini) {

    'use strict';

    function createVacationEdit(ref, multiValues) {
        var point = views.point(ref + '/edit/view'),
            VacationEditView = point.createView({
                tagName: 'div',
                className: 'edit-vacation'
            });

        ext.point(ref + '/edit/view').extend({
            index: 50,
            id: 'headline',
            draw: function () {
                this.append($('<div>').append(
                    $('<h1>').text(model.fields.headline)
                ));
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 150,
            id: ref + '/edit/view/subject',
            draw: function (baton) {
                this.append(
                    $('<div>').addClass('form-group').append(
                        $('<label for="subject">').text(model.fields.subject),
                        new mini.InputView({ name: 'subject', model: baton.model, className: 'form-control', id: 'subject' }).render().$el
                    )
                );
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 200,
            id: ref + '/edit/view/mailtext',
            draw: function (baton) {
                this.append(
                    $('<div>').addClass('form-group').append(
                        $('<label for="text">').text(model.fields.text),
                        new mini.TextView({ name: 'text', model: baton.model, id: 'text', rows: '12' }).render().$el
                    )
                );
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 250,
            id: ref + '/edit/view/days',
            draw: function (baton) {
                this.append(
                    $('<div>').addClass('form-horizontal').append(
                        $('<div>').addClass('form-group').append(
                            $('<label>').attr({ 'for': 'days' }).addClass('control-label col-md-offset-2 col-md-8').text(model.fields.days),
                            $('<div>').addClass('col-md-2').append(
                                new mini.SelectView({ list: multiValues.days, name: 'days', model: baton.model, id: 'days', className: 'form-control'}).render().$el
                            )
                        )
                    )
                );
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 275,
            id: ref + '/edit/view/sender',
            draw: function (baton) {
                var returnIndex = function(source, target) {
                    var index = -1;
                    _.each(source, function(obj, key) {
                        if (_.isArray(obj)) {
                            if (obj[0] === target || obj[1] === target) index = key;
                        } else {
                            if (obj.label === target || obj.value === target) index = key;
                        }

                    });
                    return index;
                },
                    SelectView = mini.SelectView.extend({
                    onChange: function () {
                        var valuePosition = returnIndex(multiValues.from, this.$el.val());
                        this.model.set(this.name, multiValues.fromArrays[valuePosition]);
                    },
                    update: function () {
                        var valuePosition,
                            modelValue = this.model.get(this.name);
                        if (_.isArray(modelValue)) {
                            this.$el.val(multiValues.from[returnIndex(multiValues.fromArrays, modelValue[1])].value);
                        } else {
                            valuePosition = returnIndex(multiValues.from, modelValue);
                            if (valuePosition === -1) valuePosition = returnIndex(multiValues.from, modelValue);
                            this.$el.val(multiValues.from[valuePosition].value);
                        }
                    }
                });
                this.append(
                    $('<fieldset>').append(
                        $('<legend>').addClass('sectiontitle').append(
                            $('<h2>').text(model.fields.headlineSender)
                        ),
                        $('<div class="row form-group">').append(
                            $('<label for="from" class="control-label sr-only">').text(model.fields.headlineSender),
                            $('<div class="controls col-sm-6">').append(
                                new SelectView({
                                    id: 'from',
                                    list: multiValues.from,
                                    model: baton.model
                                }).render().$el
                            )
                        )
                    )
                );
            }
        });

        ext.point(ref + '/edit/view').extend({
            index: 300,
            id: ref + '/edit/view/addresses',
            draw: function (baton) {

                var checkboxes = [];

                _(multiValues.aliases).each(function (alias) {
                    checkboxes.push(
                        $('<div>').addClass('checkbox').append(
                            $('<label>').addClass('control-label blue').text(alias).append(
                                new mini.CheckboxView({ name: alias, model: baton.model }).render().$el
                            )
                        )
                    );
                });

                this.append(
                    $('<fieldset>').append(
                        $('<legend>').addClass('sectiontitle').append(
                            $('<h2>').text(model.fields.headlineAdresses)
                        ),
                        checkboxes
                    )
                );
            }
        });

        model.api.getConfig().done(function (data) {
            var isAvailable = false;
            _(data.tests).each(function (test) {
                if (test.test === 'currentdate') {
                    isAvailable = true;
                }
            });

            if (isAvailable) {

                // point.extend(new forms.CheckBoxField({
                //     id: ref + '/edit/view/timeframecheckbox',
                //     index: 425,
                //     label: model.fields.activateTimeFrame,
                //     attribute: 'activateTimeFrame',
                //     customizeNode: function () {
                //         var self = this;

                //         this.$el.on('change', function () {
                //             var fields = $('.edit-vacation').find('.input-sm');

                //             if (self.$el.find('input').prop('checked') !== true) {
                //                 fields.prop('disabled', true);
                //             } else {
                //                 fields.prop('disabled', false);
                //             }
                //         });
                //     }
                // }));

                ext.point(ref + '/edit/view').extend({
                    index: 425,
                    id: ref + '/edit/view/timeframecheckbox',
                    draw: function (baton) {
                        var checkboxView = new mini.CheckboxView({ name: 'activateTimeFrame', model: baton.model });

                        baton.model.off('change:' + checkboxView.name, null,  ext.point(ref + '/edit/view'));
                        baton.model.on('change:' + checkboxView.name, function (model, checked) {
                            $('.dateFrom').find('.form-control').attr('disabled', !checked);
                            $('.dateUntil').find('.form-control').attr('disabled', !checked);
                        }, ext.point(ref + '/edit/view'));

                        this.append(
                            $('<fieldset>').append(
                                $('<div>').addClass('checkbox').append(
                                    $('<label>').addClass('control-label').text(model.fields.activateTimeFrame).append(
                                        checkboxView.render().$el
                                    )
                                )
                            )
                        );
                    }
                });

                ext.point(ref + '/edit/view').extend({
                    index: 450,
                    id: ref + '/edit/view/start_date',
                    draw: function (baton) {

                        var dateView = new mini.DateView({ name: 'dateFrom', model: baton.model, future: 5, past: 5 });

                        this.append(
                            $('<fieldset class="col-md-12 form-group dateFrom">').append(
                                $('<legend class="simple">').append(
                                    $('<h2>').text(model.fields.dateFrom)
                                ),
                                // don't wrap the date control with a label (see bug #27559)
                                dateView.render().$el
                            )
                        );

                        if (!baton.model.get('activateTimeFrame')) {
                            dateView.$el.find('.form-control').attr('disabled', true);
                        }
                    }
                });

                ext.point(ref + '/edit/view').extend({
                    index: 500,
                    id: ref + '/edit/view/end_date',
                    draw: function (baton) {

                        var dateView = new mini.DateView({ name: 'dateUntil', model: baton.model, future: 5, past: 5 });

                        this.append(
                            $('<fieldset class="col-md-12 form-group dateUntil">').append(
                                $('<legend class="simple">').append(
                                    $('<h2>').text(model.fields.dateUntil)
                                ),
                                // don't wrap the date control with a label (see bug #27559)
                                dateView.render().$el
                            )
                        );

                        if (!baton.model.get('activateTimeFrame')) {
                            dateView.$el.find('.form-control').attr('disabled', true);
                        }
                    }
                });

                // point.extend(new forms.DatePicker({
                //     id: ref + '/edit/view/end_date',
                //     index: 500,
                //     className: 'col-md-2',
                //     labelClassName: 'timeframe-edit-label',
                //     display: 'DATE',
                //     attribute: 'dateUntil',
                //     label: model.fields.dateUntil,
                //     initialStateDisabled: timeFrameState ? false : true
                // }));

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
