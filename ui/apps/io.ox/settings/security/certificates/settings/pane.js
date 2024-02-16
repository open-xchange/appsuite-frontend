/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/settings/security/certificates/settings/pane', [
    'io.ox/core/extensions',
    'gettext!io.ox/settings/certificates',
    'io.ox/core/api/certificate',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/settings/security/certificates/settings/certificate-view',
    'io.ox/backbone/mini-views/listutils'
], function (ext, gt, api, ListView, certificateViews, listUtils) {

    'use strict';


    var Certificate = Backbone.Model.extend({
        idAttribute: 'fingerprint'
    });

    var CertificateCollection = Backbone.Collection.extend({
            model: Certificate
        }), pane,
        POINT = 'io.ox/settings/security/certificates/settings/detail';

    var collection = new CertificateCollection();

    function getAllStoredCertificates() {
        return api.getAll().done(function (data) {
            collection.reset(data);
        });
    }

    function handleEmptyNotice() {
        var notice = gt('The certificate list is empty'),
            hint = pane.find('.hint');

        if (collection.length === 0) {
            if (hint.length !== 0) hint.text(notice);
        } else {
            hint.empty();
        }
    }

    api.on('update', getAllStoredCertificates);
    collection.on('remove add reset', handleEmptyNotice);

    ext.point(POINT).extend({
        index: 100,
        draw: function () {
            var self = this;
            pane = $('<div class="io-ox-certificate-settings">').busy();
            self.append(pane);
            getAllStoredCertificates().done(function () {
                ext.point(POINT + '/pane').invoke('draw', pane);
                handleEmptyNotice();
                pane.idle();
            });
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.addClass('io-ox-certificate-settings').append(
                $('<div class="row">').append(
                    $('<h1 class="col-md-8 col-xs-8">').text(gt('Certificates'))
                ),
                $('<div class="hint">')
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 300,
        id: 'list',
        draw: function () {
            this.append(new ListView({
                collection: collection,
                sortable: false,
                containment: this,
                childView: certificateViews.CertificateSettingsView,
                dataIdAttribute: 'fingerprint'
            }).render().$el);
        }
    });

    ext.point(POINT + '/view').extend({
        id: 'state',
        index: 100,
        draw: function (baton) {
            var data = baton.model.toJSON();
            this[data.trusted ? 'removeClass' : 'addClass']('disabled');
        }
    });

    ext.point(POINT + '/view').extend({
        id: 'title',
        index: 400,
        draw: function (baton) {
            var data = baton.model.toJSON(),
                title = data.hostname,
                fingerprint = data.fingerprint;
            this.append(
                listUtils.makeTitle(title)
                    .removeClass('pull-left').append(
                        listUtils.makeSubTitle(fingerprint, gt('Fingerprint'))
                        .removeClass('pull-left')
                    )
            );
        }
    });

    ext.point(POINT + '/view').extend({
        id: 'controls',
        index: 500,
        draw: function (baton) {
            var data = baton.model.toJSON(),
                title = data.hostname;

            var $controls = listUtils.makeControls(),
                $link = listUtils.controlsToggle();

            if (data.trusted) {
                $controls.append(
                    listUtils.appendIconText($link.attr({
                        'aria-label': gt('Untrust certificate %1$s', title)
                    }), gt('Untrust'), 'untrust')
                );

            } else {
                $controls.append(
                    listUtils.appendIconText($link.attr({
                        'aria-label': gt('Trust certificate %1$s', title)
                    }), gt('Trust'), 'trusted')
                );
            }

            $controls.append(
                listUtils.controlsDelete({ title: gt('Remove certificate %1$s', title) })
            );

            this.append($controls);
        }
    });

});
