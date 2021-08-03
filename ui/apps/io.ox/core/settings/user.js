/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
