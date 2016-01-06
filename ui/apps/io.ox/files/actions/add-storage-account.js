/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/files/actions/add-storage-account', [
    'io.ox/core/tk/dialogs',
    'io.ox/metrics/main',
    'gettext!io.ox/files'
], function (dialogs, metrics, gt) {

    'use strict';

    var services = {
        'google': {
            title: gt('Google Drive'),
            className: 'logo-google'
        },
        'dropbox': {
            title: gt('Dropbox'),
            className: 'logo-dropbox'
        },
        'boxcom': {
            title: gt('Box'),
            className: 'logo-boxcom'
        },
        msliveconnect: {
            title: gt('OneDrive'),
            className: 'logo-onedrive'
        }
    };

    function getAvailableServices() {
        return require(['io.ox/keychain/api']).then(function (keychainApi) {
            return _(keychainApi.submodules).filter(function (submodule) {
                if (!services[submodule.id]) return false;
                return !submodule.canAdd || submodule.canAdd.apply(this);
            });
        });
    }

    function onClick(e) {
        e.preventDefault();
        $(this).tooltip('hide');
        e.data.dialog.close();
        var win = window.open(ox.base + '/busy.html', '_blank', 'height=600, width=800, resizable=yes, scrollbars=yes');
        e.data.service.createInteractively(win);
    }

    function drawLink(service) {

        var data = services[service.id];

        return $('<button class="btn btn-default storage-account-item" role="button" tabindex="1">')
            .addClass(data.className)
            .append(
                $('<div class="icon">'),
                $('<span>').text(data.title)
            )
            .attr({
                'data-service': service.id,
                'title': data.title
            })
            .on('click', { dialog: this, service: service }, onClick);
    }

    function drawContent(node) {

        var draw = drawLink.bind(this);

        getAvailableServices().done(function (availableServices) {
            node.append(_(availableServices).map(draw)).show();
            $(window).trigger('resize');
            node.find('.storage-account-item:first').focus();
        });

        // consider metrics
        if (!metrics.isEnabled()) return;

        this.delegate('.toolbar-item', 'mousedown', function (e) {
            metrics.trackEvent({
                app: 'drive',
                target: 'folder/account/add',
                type: 'click',
                action: $(e.currentTarget).attr('data-service') || 'unknown'
            });
        });
    }

    return function () {

        new dialogs.ModalDialog({ width: 506 })
            .header($('<h4>').text(gt('Add storage account')))
            .addPrimaryButton('close', gt('Close'), 'close', { tabIndex: 1 })
            .build(function () {
                this.getPopup().addClass('select-storage-account-dialog');
                drawContent.call(this, this.getContentNode());
            })
            .show();
    };
});
