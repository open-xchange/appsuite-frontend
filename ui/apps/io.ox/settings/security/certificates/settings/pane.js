/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/settings/security/certificates/settings/pane', [
    'io.ox/core/extensions',
    'gettext!io.ox/settings/certificates',
    'io.ox/core/api/certificate',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/settings/security/certificates/settings/certificate-view',
    'io.ox/backbone/mini-views/listutils',
    'static/3rd.party/jquery-ui.min.js'
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

    api.on('update', getAllStoredCertificates);

    ext.point(POINT).extend({
        index: 100,
        draw: function () {
            var self = this;
            pane = $('<div class="io-ox-certificate-settings">').busy();
            self.append(pane);
            getAllStoredCertificates().done(function () {
                ext.point(POINT + '/pane').invoke('draw', pane);
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
                )
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
