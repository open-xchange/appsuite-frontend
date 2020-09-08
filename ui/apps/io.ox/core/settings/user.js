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

define('io.ox/core/settings/user', [
    'io.ox/core/api/user',
    'io.ox/contacts/model',
    'io.ox/contacts/widgets/pictureUpload'
], function (api, contactModel, PhotoUploadView) {

    'use strict';

    // Model Factory for use with the edit dialog
    var factory = contactModel.protectedMethods.buildFactory('io.ox/core/user/model', api);

    function getCurrentUser() {
        return factory.realm('default').get({});
    }

    return {

        getCurrentUser: getCurrentUser,

        openModalDialog: function () {
            getCurrentUser().done(function (model) {
                ox.load(['io.ox/contacts/edit/main']).done(function (m) {
                    if (m.reuse('edit', model.attributes)) return;
                    m.getApp(model.attributes).launch();
                });
            });
        },

        openEditPicture: function () {
            return getCurrentUser().then(function (model) {
                var view = new PhotoUploadView({ model: model });
                view.openDialog();
            });
        }
    };
});
