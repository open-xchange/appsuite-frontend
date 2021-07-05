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

define('io.ox/multifactor/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/core/settings/util',
    'io.ox/multifactor/api',
    'io.ox/multifactor/factorRenderer',
    'io.ox/core/yell',
    'settings!io.ox/multifactor',
    'gettext!io.ox/core/boot',
    'less!io.ox/multifactor/settings/style',
    'io.ox/multifactor/bundle'
], function (ext, ExtensibleView, util, api, factorRenderer, yell, settings, gt) {
    'use strict';

    ext.point('io.ox/multifactor/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/multifactor/settings/detail/view', model: settings })
                .render().$el
            );
        }
    });

    var INDEX = 0;
    var statusDiv, backupDiv, hasBackup;

    ext.point('io.ox/multifactor/settings/detail/view').extend(
        //
        // Header
        //
        {
            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.addClass('io-ox-multifactor-settings').append(
                    util.header(gt.pgettext('app', '2-Step Verification'))
                );
            }
        },
        {
            id: 'status',
            index: INDEX += 100,
            render: function () {
                statusDiv = $('<div id="multifactorStatus" class="multifactorStatusDiv">');
                this.$el.append(util.fieldset(
                    gt('Verification Options'),
                    statusDiv,
                    addButton()
                ));
            }
        },
        {
            id: 'recoveryDevices',
            index: INDEX += 100,
            render: function () {
                backupDiv = $('<div id="multifactorStatus" class="multifactorBackupDiv">');
                var fieldset = util.fieldset(
                    gt('Recovery Options'),
                    backupDiv,
                    addButton(true)
                ).addClass('multifactorBackupField');
                this.$el.append(fieldset);
                refresh(statusDiv, backupDiv);
            }
        }
    );

    // Refresh the status div and update buttons
    function refresh(statusDiv, backupDiv) {
        if (!statusDiv) {
            statusDiv = $('.multifactorStatusDiv');
            backupDiv = $('.multifactorBackupDiv');
        }
        ox.busy(true);
        statusDiv.empty();
        backupDiv.empty();
        api.getDevices().then(function (status) {
            drawStatus(statusDiv, status);
        });
        api.getDevices('BACKUP').then(function (status) {
            drawStatus(backupDiv, status, true);
            if (status.length > 0) {
                $('.addBackupDevice').hide();
            } else {
                $('.addBackupDevice').show();
            }
            statusDiv.addClass('mfLoaded');
        })
        .always(function () {
            ox.idle();
        });
    }

    // Draw the status div, including proper buttons
    function drawStatus(node, devices, isBackup) {
        if (devices) {
            if (devices && devices.length > 0) {
                node.append(factorRenderer.renderDeletable(devices));
                $('.multifactorRecoverySection').show();
                addDeleteAction(node);  // Add button actions
                addEditAction(node);
                $('.multifactorBackupField').show();
                if (isBackup) {
                    hasBackup = true;
                }
                if (!settings.get('allowMultiple')) {
                    $('#addDevice').hide();
                }
                return;
            }
        }
        if (isBackup) {
            hasBackup = false;
        } else {
            node.append($('<div class="emptyMultifactor">').append(gt('No 2-Step verification options configured yet.')));
            $('.multifactorBackupField').hide();
            $('#addDevice').show();
        }
    }

    function addDeleteAction(node) {
        node.find('.mfDelete').click(function (e) {
            e.preventDefault();
            removeMultifactor($(e.target).closest('.multifactordevice'));
        });
    }

    function addEditAction(node) {
        node.find('.mfEdit').click(function (e) {
            e.preventDefault();
            editMultifactor($(e.target).closest('.multifactordevice'));
        });
    }

    // Button actions

    function removeMultifactor(toDelete) {
        ox.load(['io.ox/multifactor/settings/views/deleteMultifactorView']).done(function (view) {
            view.open(toDelete).then(function () {
                refresh();
            });
        });
    }

    function editMultifactor(toEdit) {
        ox.load(['io.ox/multifactor/settings/views/editMultifactorView']).done(function (view) {
            view.open(toEdit).then(function () {
                refresh();
            });
        });
    }

    // Add button to create devices.
    function addButton(backup) {
        var add = $('<button id="' +
                (backup ? 'addBackupDevice' : 'addDevice') +
                '" class="btn btn-primary">')
            .append(backup ? gt('Add recovery option') : gt('Add verification option'));
        add.click(function () {
            addMultifactor(backup);
        });
        if (backup) add.addClass('addBackupDevice');
        return add;
    }

    function addMultifactor(backup) {
        api.getProviders(backup).then(function (data) {
            if (data && data.providers) {
                ox.load(['io.ox/multifactor/settings/views/addMultifactorView']).done(function (view) {
                    view.open(data.providers, backup).then(function () {
                        refresh();
                        if (!backup && !hasBackup) {  // If we don't have any backup providers, try adding now.
                            addMultifactor(true);
                        }
                    });
                });
            } else {
                //#. Error message when trying to get available providers from middleware
                yell('error', gt('Problem getting 2-step verification providers'));
            }

        });
    }


});
