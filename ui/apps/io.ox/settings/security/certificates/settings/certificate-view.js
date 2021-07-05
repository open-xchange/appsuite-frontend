/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/settings/security/certificates/settings/certificate-view', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/settings/certificates',
    'io.ox/backbone/views/disposable',
    'io.ox/core/api/certificate',
    'io.ox/core/api/account',
    'less!io.ox/settings/security/certificates/settings/style'
], function (ext, ModalDialog, gt, DisposableView, api, accountAPI) {

    'use strict';

    var CertificateSettingsView = DisposableView.extend({

        tagName: 'li',

        className: 'settings-list-item',

        events: {
            'click [data-action="toggle"]': 'onToggle',
            'click [data-action="delete"]': 'onDelete'
        },

        render: function () {
            if (this.disposed) return this;

            var baton = ext.Baton({ model: this.model, view: this });

            ext.point('io.ox/settings/security/certificates/settings/detail/view').invoke('draw', this.$el.empty(), baton);
            return this;
        },

        onToggle: function (e) {
            var self = this;
            e.preventDefault();
            var trusted = this.model.get('trusted');

            this.model.set('trusted', !trusted, { validate: true });
            api.update({ fingerprint: this.model.get('fingerprint'), hostname: this.model.get('hostname'), trust: this.model.get('trusted') }).done(function () {
                accountAPI.trigger('refresh:ssl', self.model.get('hostname'));
                self.refreshWidget();
                self.render();
            });
        },

        removeCertificate: function () {
            var self = this;
            api.remove({ fingerprint: this.model.get('fingerprint'), hostname: this.model.get('hostname') }).done(function () {
                ox.trigger('SSL:remove', { code: 'SSL:remove', error_params: [self.model.get('fingerprint'), self.model.get('hostname')] });
                self.model.collection.remove(self.model.cid);
                self.refreshWidget();
                self.render();
            });
        },

        onDelete: function (e) {
            e.preventDefault();
            var self = this;
            new ModalDialog({ title: gt('Remove certificate'), description: gt('Do you really want to remove this certificate?') })
                .addCancelButton()
                .addButton({ label: gt('Remove'), action: 'certremove' })
                .on('certremove', function () {
                    self.removeCertificate();
                })
                .open();
        },

        refreshWidget: function () {
            require(['io.ox/portal/main', 'io.ox/portal/widgets'], function (portal, widgets) {
                var portalApp = portal.getApp();
                _(widgets.getEnabled()).chain().filter(function (model) {
                    return model.get('type') === 'rss';
                }).each(function (model, index) {
                    portalApp.refreshWidget(model, index);
                });
            });
        }
    });

    return {
        CertificateSettingsView: CertificateSettingsView
    };
});
