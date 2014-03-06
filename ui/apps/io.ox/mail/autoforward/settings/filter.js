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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/mail/autoforward/settings/filter',
    ['io.ox/core/extensions',
     'io.ox/core/api/mailfilter',
     'io.ox/mail/autoforward/settings/model',
     'io.ox/mail/autoforward/settings/view-form'
    ], function (ext, api, mailfilterModel, ViewForm) {

    'use strict';

    var factory = mailfilterModel.protectedMethods.buildFactory('io.ox/core/autoforward/model', api);

    return {
        editAutoForward: function ($node, userMainEmail) {
            var deferred = $.Deferred();

            api.getRules('autoforward').done(function (data) {

                if (_.isEmpty(data)) {
                    var autoForwardData = {},
                        ForwardEdit,
                        autoForward;
                    autoForwardData.userMainEmail = userMainEmail;
                    ForwardEdit = ViewForm.protectedMethods.createAutoForwardEdit('io.ox/core/autoforward');

                    autoForward = new ForwardEdit({model: factory.create(autoForwardData)});

                    $node.append(autoForward.render().$el);
                    $node.one('dispose', function () {
                        if (_.isEmpty(autoForward.model.changed) && $(document.activeElement).is(':input')) {
                            $(document.activeElement).blur();//make the active element lose focus to get the changes of the field a user was editing
                            if (!_.isEmpty(autoForward.model.changed)) {//unsaved changes (grid changed while input field was still selected with unsaved changes)
                                autoForward.model.save();
                            }
                        }
                    });

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
                    ForwardEdit = ViewForm.protectedMethods.createAutoForwardEdit('io.ox/core/autoforward');

                    autoForward = new ForwardEdit({model: factory.create(autoForwardData)});

                    if (data[0].active === true) {
                       // set active state
                    }
                    $node.append(autoForward.render().$el);
                    $node.one('dispose', function () {
                        if (_.isEmpty(autoForward.model.changed) && $(document.activeElement).is(':input')) {
                            $(document.activeElement).blur();//make the active element lose focus to get the changes of the field a user was editing
                            if (!_.isEmpty(autoForward.model.changed)) {//unsaved changes (grid changed while input field was still selected with unsaved changes)
                                autoForward.model.save();
                            }
                        }
                    });
                    deferred.resolve(autoForward.model);

                }

            }).fail(function (error) {
                deferred.reject(error);
            });

            return deferred;

        }
    };

});
