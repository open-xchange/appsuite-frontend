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

define('io.ox/mail/autoforward/settings/filter', [
    'io.ox/core/extensions',
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

                var autoForwardData = { userMainEmail: userMainEmail, processSub: true },
                    ForwardEdit = ViewForm.protectedMethods.createAutoForwardEdit('io.ox/core/autoforward'),
                    autoForward;

                if (_.isEmpty(data)) {

                    autoForward = new ForwardEdit({ model: factory.create(autoForwardData) });

                    $node
                        .append(autoForward.render().$el)
                        .one('dispose', function () {
                            if (_.isEmpty(autoForward.model.changed) && $(document.activeElement).is(':input')) {
                                //make the active element lose focus to get the changes of the field a user was editing
                                $(document.activeElement).blur();
                                //unsaved changes (grid changed while input field was still selected with unsaved changes)
                                if (!_.isEmpty(autoForward.model.changed)) {
                                    autoForward.model.save();
                                }
                            }
                        });

                    api.getRules('vacation').done(function (data) {

                        if (!_.isEmpty(data)) {
                            autoForward.model.set('position', data[0].position + 1);
                        } else {
                            autoForward.model.set('position', 0);
                        }
                        deferred.resolve(autoForward.model);
                    });

                } else {
                    _.extend(autoForwardData, {
                        id: data[0].id,
                        active: data[0].active,
                        keep: false,
                        processSub: true
                    });

                    _(data[0].actioncmds).each(function (value) {
                        switch (value.id) {
                            case 'redirect':
                                autoForwardData.forwardmail = value.to;
                                break;
                            case 'keep':
                                autoForwardData.keep = true;
                                break;
                            case 'stop':
                                autoForwardData.processSub = false;
                                break;
                            default:
                                if (ox.debug) console.log('wrong actioncmds');
                        }
                    });

                    autoForward = new ForwardEdit({ model: factory.create(autoForwardData) });

                    $node
                        .append(autoForward.render().$el)
                        .one('dispose', function () {
                            if (_.isEmpty(autoForward.model.changed) && $(document.activeElement).is(':input')) {
                                //make the active element lose focus to get the changes of the field a user was editing
                                $(document.activeElement).blur();
                                //unsaved changes (grid changed while input field was still selected with unsaved changes)
                                if (!_.isEmpty(autoForward.model.changed)) {
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
