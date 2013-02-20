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
    'io.ox/core/tk/dialogs'
], function (ext, api, mailfilterModel, ViewForm, dialogs) {

    'use strict';


    var factory = mailfilterModel.protectedMethods.buildFactory('io.ox/core/mailfilter/model', api);

    return {
        editVacationtNotice: function ($node, multiValues) {
            var deferred = $.Deferred();

            api.getRules('vacation').done(function (data) {
                var vacationData = data[0].actioncmds[0];
                vacationData.active = data[0].active;
                var VacationEdit = ViewForm.protectedMethods.createVacationEdit('io.ox/core/mailfilter', multiValues);

                var vacationNotice = new VacationEdit({model: factory.create(vacationData)});

                $node.append(vacationNotice.render().$el);

                deferred.resolve(vacationNotice.model);

            });

            return deferred.done(function (model) {
            });

        }
    };

});
