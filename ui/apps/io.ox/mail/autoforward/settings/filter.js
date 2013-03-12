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

define('io.ox/mail/autoforward/settings/filter', [
    'io.ox/core/extensions',
    'io.ox/core/api/mailfilter',
    'io.ox/mail/autoforward/settings/model',
    'io.ox/mail/autoforward/settings/view-form',
    'io.ox/core/tk/dialogs',
    'io.ox/core/date',
    'gettext!io.ox/mail'
], function (ext, api, mailfilterModel, ViewForm, dialogs, date, gt) {

    'use strict';


    var factory = mailfilterModel.protectedMethods.buildFactory('io.ox/core/autoforward/model', api);

    return {
        editAutoForward: function ($node, multiValues, userMainEmail) {
            var deferred = $.Deferred();

            api.getRules('autoforward').done(function (data) {

                if (_.isEmpty(data)) {
                    var autoForwardData = {},
                        ForwardEdit,
                        autoForward;
                    autoForwardData.userMainEmail = userMainEmail;
                    ForwardEdit = ViewForm.protectedMethods.createAutoForwardEdit('io.ox/core/autoforward', multiValues);

                    autoForward = new ForwardEdit({model: factory.create(autoForwardData)});

                    $node.append(autoForward.render().$el);

                    deferred.resolve(autoForward.model);

                } else {
                    var autoForwardData = {},
                        ForwardEdit,
                        autoForward;

                    autoForwardData.id = data[0].id;
                    autoForwardData.active = data[0].active;

                    _(data[0].actioncmds).each(function (value) {
                        if (value.id === 'redirect') {
                            autoForwardData.forwardmail = value.to;
                        }
                    });
                    autoForwardData.userMainEmail = userMainEmail;
                    ForwardEdit = ViewForm.protectedMethods.createAutoForwardEdit('io.ox/core/autoforward', multiValues);

                    autoForward = new ForwardEdit({model: factory.create(autoForwardData)});

                    if (data[0].active === true) {
                       // set active state
                    }
                    $node.append(autoForward.render().$el);

                    deferred.resolve(autoForward.model);

                }

            });

            return deferred;

        }
    };

});
