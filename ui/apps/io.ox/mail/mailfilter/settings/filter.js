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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/filter', [
    'io.ox/core/extensions',
    'io.ox/mail/mailfilter/api',
    'io.ox/mail/mailfilter/settings/model',
    'io.ox/mail/mailfilter/settings/view-form',
    'io.ox/core/tk/dialogs',
    'io.ox/core/date',
    'gettext!io.ox/mail'
], function (ext, api, mailfilterModel, ViewForm, dialogs, date, gt) {

    'use strict';


    var factory = mailfilterModel.protectedMethods.buildFactory('io.ox/core/mailfilter/model', api);

    return {
        editVacationtNotice: function ($node, multiValues) {
            var deferred = $.Deferred();

            api.getRules('vacation').done(function (data) {
                var vacationData = data[0].actioncmds[0];
                vacationData.mainID = data[0].id;

                if (_(data[0].test).size() === 2) {
                    _(data[0].test.tests).each(function (value) {
                        if (value.comparison === 'ge') {
                            vacationData.dateFrom = value.datevalue[0];
                        } else {
                            vacationData.dateUntil = value.datevalue[0];
                        }
                    });

                    vacationData.activeSelect = data[0].active ? 'activeTime' : 'disabled';

                } else {
                    var myDateStart = new date.Local(date.Local.utc(_.now()));
                    var myDateEnd = new date.Local(date.Local.utc(_.now()));

                    myDateStart = myDateStart.addUTC(date.DAY);
                    myDateEnd = myDateEnd.addUTC(date.DAY + date.WEEK);

                    vacationData.dateFrom = date.Local.localTime(myDateStart.getTime());
                    vacationData.dateUntil = date.Local.localTime(myDateEnd.getTime());

                    vacationData.activeSelect = data[0].active ? 'active' : 'disabled';
                }

                var VacationEdit = ViewForm.protectedMethods.createVacationEdit('io.ox/core/mailfilter', multiValues);

                var vacationNotice = new VacationEdit({model: factory.create(vacationData)});

                _(vacationData.addresses).each(function (mail) {
                    vacationNotice.model.set(mail, true);
                });

                $node.append(vacationNotice.render().$el);

                ext.point("io.ox/core/mailfilter/model/validation").extend({
                    id: 'start-date-before-end-date',
                    validate: function (attributes) {

                        if (attributes.dateFrom && attributes.dateUntil && attributes.dateUntil < attributes.dateFrom) {
                            this.add('dateFrom', gt("The start date must be before the end date."));
                            this.add('dateUntil', gt("The start date must be before the end date."));
                        }
                    }
                });

                deferred.resolve(vacationNotice.model);

            });

            return deferred.done(function (model) {
            });

        }
    };

});
