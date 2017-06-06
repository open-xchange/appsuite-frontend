/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/mail/vacationnotice/settings/filter', [
    'io.ox/core/extensions',
    'io.ox/core/api/mailfilter',
    'io.ox/mail/vacationnotice/settings/model',
    'io.ox/mail/vacationnotice/settings/view-form',
    'io.ox/core/tk/dialogs',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (ext, api, mailfilterModel, ViewForm, dialogs, settings, gt) {

    'use strict';

    var factory = mailfilterModel.protectedMethods.buildFactory('io.ox/core/vacationnotice/model', api);

    function createDateDefaults(vacationData) {
        vacationData.dateFrom = moment().add(1, 'day').valueOf();
        vacationData.dateUntil = moment(vacationData.dateFrom).add(1, 'week').valueOf();
        vacationData.activateTimeFrame = false;
    }

    return {
        editVacationtNotice: function ($node, multiValues, primaryMail) {
            var deferred = $.Deferred();

            $.when(api.getRules('vacation'), api.getConfig()).done(function (data, config) {
                data = data[0];

                // config = config;
                var defaultNotice = {
                        days: '7',
                        internal_id: 'vacation',
                        subject: '',
                        text: '',
                        active: false
                    },
                    vacationData,
                    VacationEdit,
                    vacationNotice,
                    setSender = settings.get('features/setFromInVacationNotice', true),
                    setAddresses = settings.get('features/setAddressesInVacationNotice', true);

                if (setSender) {
                    defaultNotice.from = _.first(multiValues.fromArrays);
                } else {
                    ext.point('io.ox/core/vacationnotice/edit/view').disable('io.ox/core/vacationnotice/edit/view/sender');
                }

                if (!setAddresses || multiValues.aliases.length === 1) ext.point('io.ox/core/vacationnotice/edit/view').disable('io.ox/core/vacationnotice/edit/view/addresses');

                if (data[0] && data[0].actioncmds[0]) {

                    vacationData = data[0].actioncmds[0];

                    // action ID
                    vacationData.internal_id = vacationData.id;

                    // rule ID
                    vacationData.id = data[0].id;

                    // reset the from value if the submitted value is unknown to default
                    if (setSender && _.findIndex(multiValues.from, { label: vacationData.from }) === -1 && _.findIndex(multiValues.from, { value: vacationData.from }) === -1) {
                        vacationData.from = _.first(multiValues.fromArrays);
                    }
                    // if from is set but unsupported remove
                    if (!setSender && vacationData.from) delete vacationData.from;

                    // we do have a time frame
                    if (_(data[0].test).size() === 2) {
                        _(data[0].test.tests).each(function (value) {
                            if (value.comparison === 'ge') {
                                vacationData.dateFrom = value.datevalue[0];
                            } else {
                                vacationData.dateUntil = value.datevalue[0];
                            }
                        });

                        vacationData.activateTimeFrame = true;
                    // we do have just start or end date
                    } else if (data[0].test.id === 'currentdate') {
                        if (data[0].test.comparison === 'ge') {
                            vacationData.dateFrom = data[0].test.datevalue[0];
                        } else {
                            vacationData.dateUntil = data[0].test.datevalue[0];
                        }

                        vacationData.activateTimeFrame = true;
                    } else {
                        createDateDefaults(vacationData);
                    }
                } else {
                    vacationData = defaultNotice;
                    createDateDefaults(vacationData);
                }

                vacationData.primaryMail = primaryMail;

                // set active state
                if (data[0] && data[0].active === true) vacationData.active = true;

                VacationEdit = ViewForm.protectedMethods.createVacationEdit('io.ox/core/vacationnotice', multiValues, vacationData.activateTimeFrame, config);
                vacationNotice = new VacationEdit({ model: factory.create(vacationData) });


                // transfer addresses array to model but skip primary mail
                _(vacationData.addresses).each(function (mail) {
                    if (mail !== vacationData.primaryMail) vacationNotice.model.set(mail, true, { validate: true });
                });

                $node.append(vacationNotice.render().$el);

                ext.point('io.ox/core/vacationnotice/model/validation').extend({
                    id: 'start-date-before-end-date',
                    validate: function (attributes) {

                        if (attributes.dateFrom && attributes.dateUntil && attributes.dateUntil < attributes.dateFrom) {
                            this.add('dateFrom', gt('The start date must be before the end date.'));
                            this.add('dateUntil', gt('The start date must be before the end date.'));
                        }
                    }
                });

                ext.point('io.ox/core/vacationnotice/model').extend({
                    id: 'io.ox/core/vacationnotice/model/text',
                    saveText: function () {
                        var textarea = $(this.el).find('textarea'),
                            model = this.model;
                        textarea.on('keyup keydown', function () {
                            model.set('text', textarea.val(), { silent: true });
                        });
                    }
                });

                ext.point('io.ox/core/vacationnotice/model').invoke('saveText', vacationNotice, vacationNotice);

                api.getRules().done(function (rules) {
                    if (!_.isEmpty(rules) && _.isEmpty(data)) {
                        // vacation notice is initially on top
                        vacationNotice.model.set('position', 0);
                    }
                    deferred.resolve(vacationNotice.model);
                });

            }).fail(function (error) {
                deferred.reject(error);
            });

            return deferred;

        }
    };

});
