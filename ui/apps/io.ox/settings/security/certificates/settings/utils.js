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

define('io.ox/settings/security/certificates/settings/utils', [
    'io.ox/backbone/views/modal',
    'io.ox/settings/security/certificates/settings/certificate-view',
    'gettext!io.ox/settings/certificates',
    'io.ox/backbone/views/disposable',
    'io.ox/core/api/certificate',
    'io.ox/core/api/account'
], function (ModalDialog, view, gt, DisposableView, api, accountAPI) {

    var ExaminView = DisposableView.extend({

        tagName: 'div',

        events: {
            'trust': 'onTrust'
        },

        initialize: function (opt) {
            this.opt = _.extend({}, opt);
        },

        render: function () {

            var self = this,
                labelMapping = {
                    commonName: gt('Common name'),
                    expired: gt('Expired'),
                    expiresOn: gt('Expires on'),
                    failureReason: gt('Failure reason'),
                    fingerprint: gt('Fingerprint'),
                    hostname: gt('Hostname'),
                    issuedBy: gt('Issued by'),
                    issuedOn: gt('Issued on'),
                    serialNumber: gt('Serial number'),
                    signature: gt('Signature'),
                    trusted: gt('Trusted')
                };

            this.certificate = null;

            api.examine({ fingerprint: this.opt.error.error_params[0] }).done(function (data) {
                var $infoPlaceholder = $('<div>');
                self.certificate = data;

                self.$el.addClass('certificates').append(
                    $infoPlaceholder,
                    _.map(data, function (value, key) {
                        if (key === 'issuedOn' || key === 'expiresOn') value = moment(value).toString();

                        if (key === 'failureReason') {
                            $infoPlaceholder.append(
                                $('<div class="alert alert-warning">').text(value)
                            );
                        } else {
                            return $('<dl class="dl-horizontal">').append(
                                $('<dt>').text(labelMapping[key]),
                                $('<dd>').text(value)
                            );
                        }

                    })
                );
            }).fail(function (data) {

                self.$el.addClass('certificates').append(
                    $('<div class="alert alert-warning">').text(data.error_desc)
                );
                self.dialog.$footer.find('button[data-action="trust"]').attr('disabled', 'disabled');
            });
            return this;
        },

        onTrust: function () {
            var self = this,
                hostname = this.certificate.hostname !== this.opt.error.error_params[1] && this.opt.error.error_params[1] !== undefined ? this.opt.error.error_params[1] : this.certificate.hostname;
            api.update({ fingerprint: this.certificate.fingerprint, hostname: hostname, trust: true }).done(function () {
                self.dialog.close();
                accountAPI.trigger('refresh:ssl');
                api.trigger('update');

                //refresh portal
                require(['io.ox/portal/main', 'io.ox/portal/widgets'], function (portal, widgets) {
                    var portalApp = portal.getApp();
                    _(widgets.getEnabled()).chain().filter(function (model) {
                        return model.get('type') === 'rss';
                    }).each(function (model, index) {
                        portalApp.refreshWidget(model, index);
                    });
                });
            });
        }

    });

    var openExaminDialog = function (error, parentDialog) {

        var myView = new ExaminView({

            error: (/SSL/.test(error.code)) ? error : error.warnings[1]

        });
        myView.dialog = new ModalDialog({
            top: 60,
            width: 800,
            center: false,
            maximize: 500,
            async: true,
            point: 'io.ox/settings/certificates/examin',
            title: gt('Certificate details')
        });

        myView.dialog.$body.append(
            myView.render().el
        );

        myView.dialog
            .addCancelButton()
            .addButton({
                label: gt('Trust certificate'),
                action: 'trust'
            });

        myView.dialog.on('trust', function () {
            myView.dialog.$body.find('div').first().trigger('trust');

            if (parentDialog) parentDialog.idle();
        });

        myView.dialog.open();

    };

    return {
        openExaminDialog: openExaminDialog
    };

});
