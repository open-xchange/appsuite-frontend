/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/files/folderview-extensions', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'gettext!io.ox/files',
    'io.ox/core/tk/dialogs'
], function (ext, capabilities, gt, dialogs) {

    'use strict';

    var services = {
        'google': {
            title: gt('Add Google Drive account'),
            className: 'logo-google'
        },
        'dropbox': {
            title: gt('Add Dropbox account'),
            className: 'logo-dropbox'
        },
        'boxcom': {
            title: gt('Add Box account'),
            className: 'logo-boxcom'
        },
        msliveconnect: {
            title: gt('Add OneDrive account'),
            className: 'logo-onedrive'
        }
    };

    function getAvailableServices () {
        return require(['io.ox/keychain/api']).then(function (keychainApi) {
            return _(keychainApi.submodules).filter(function (submodule) {
                if (!services[submodule.id]) return false;

                return !submodule.canAdd || submodule.canAdd.apply(this);
            });
        });
    }

    ext.point('io.ox/core/foldertree/infostore/app').extend({
        id: 'add-external-account',
        index: 400,
        draw: (function () {
            if (_.device('smartphone')) return $.noop;

            var links = $('<div class="links">');

            function openDialog(e) {
                e.preventDefault();

                new dialogs.ModalDialog()
                    .header($('<h4>').text(gt('Add storage account')))
                    .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                    .build(function () {
                        var baton = ext.Baton.ensure({
                            $: this.getContentNode(),
                            data: e.data,
                            dialog: this
                        });
                        this.getPopup().addClass('select-storage-account-dialog');
                        ext.point('io.ox/core/foldertree/infostore/app/add-external-account').invoke('draw', this.getContentNode(), baton);
                    })
                    .show();
            }

            function draw() {
                getAvailableServices().done(function (services) {
                    if (services.length === 0) return links.hide();

                    links.empty().show().append(
                        $('<a href="#" data-action="add-storage-account" tabindex="1" role="button">')
                        .text(gt('Add storage account'))
                        .on('click', openDialog)
                    );
                });
            }

            return function () {
                this.append(links);

                require(['io.ox/core/api/filestorage'], function (filestorageApi) {
                    // remove old listeners
                    filestorageApi.off('create delete update', draw);
                    // append new listeners and draw immediatly
                    filestorageApi.on('create delete update', draw);
                    draw();
                });
            };
        })()
    });

    ext.point('io.ox/core/foldertree/infostore/app/add-external-account').extend({
        id: 'add-accounts',
        index: 100,
        draw: function (baton) {
            var wrapper = $('<div>');

            this.append(wrapper);

            getAvailableServices().done(function (availableServices) {
                wrapper.append(
                    $('<label class=add-acc-label>').text(gt('Add account')),
                    $('<div class="clearfix">').append(
                        _(availableServices).map(function (service) {
                            var data = services[service.id];

                            return $('<a href="#" class="storage-account-item" role="button">')
                                .addClass(data.className)
                                .append($('<span class="sr-only">').text(data.title))
                                .attr({
                                    'data-trigger': 'hover',
                                    'data-toggle': 'tooltip',
                                    'data-placement': 'top',
                                    'data-animation': 'false',
                                    'data-container': 'body',
                                    'data-service': service.id,
                                    'title': data.title
                                })
                                .tooltip()
                                .on('click', function (e) {
                                    e.preventDefault();

                                    baton.dialog.close();

                                    var win = window.open(ox.base + '/busy.html', '_blank', 'height=600, width=800, resizable=yes, scrollbars=yes');
                                    service.createInteractively(win);
                                });
                        })
                    )
                ).show();
            });
        }
    });

    ext.point('io.ox/core/foldertree/infostore/app/add-external-account').extend({
        id: 'add-accounts-metrics',
        index: 200,
        draw: function () {
            var self = this;

            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;
                self.delegate('.toolbar-item', 'mousedown', function (e) {
                    metrics.trackEvent({
                        app: 'drive',
                        target: 'folder/account/add',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-service') || 'unknown'
                    });
                });
            });
        }
    });
});
