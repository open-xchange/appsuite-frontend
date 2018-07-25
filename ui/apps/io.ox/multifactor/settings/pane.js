/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * @author Greg Hill <greg.hill@open-xchange.com>
 *
 * Copyright (C) 2016-2020 OX Software GmbH
 */
define('io.ox/multifactor/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/core/settings/util',
    'io.ox/multifactor/api',
    'io.ox/multifactor/factorRenderer',
    'io.ox/core/yell',
    'settings!io.ox/multifactor',
    'gettext!multifactor',
    'less!io.ox/multifactor/settings/style'
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

    ext.point('io.ox/multifactor/settings/detail/view').extend(
        //
        // Header
        //
        {
            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.addClass('io-ox-multifactor-settings').append(
                    util.header(gt.pgettext('app', 'Multifactor'))
                );
            }
        },
        {
            id: 'status',
            index: INDEX += 100,
            render: function () {
                var statusDiv = $('<div id="multifactorStatus" class="multifactorStatusDiv">');
                this.$el.append(util.fieldset(
                    gt('Devices'),
                    statusDiv
                ));
                refresh(statusDiv);
            }
        },
        {
            id: 'recovery',
            index: INDEX += 100,
            render: function () {
                var recoverySection = $('<div class="multifactorRecoverySection">');
                var recoveryDiv = $('<div id="multifactorRecovery" class="multifactorRecoveryDiv">');
                this.$el.append(recoverySection.append(util.fieldset(
                    gt('Recovery'),
                    addRecovery(recoveryDiv)
                )));
            }
        }
    );

    // Refresh the status div and update buttons
    function refresh(statusDiv) {
        if (!statusDiv) {
            statusDiv = $('.multifactorStatusDiv');
        }
        statusDiv.empty();
        api.getDevices().then(function (status) {
            drawStatus(statusDiv, status);
        });
    }

    // Draw the status div, including proper buttons
    function drawStatus(node, devices) {
        if (devices) {
            if (devices && devices.length > 0) {
                node.append(factorRenderer.renderSelectable(devices));
                addButtons(node, addButton, removeButton);
                $('.multifactorRecoverySection').show();
                return;
            }
        }
        node.append(gt('No multifactor devices registered yet.'));
        addButtons(node, addButton);
        $('.multifactorRecoverySection').hide();
    }

    // Buttons

    // Add buttons to the proper Div
    function addButtons(node) {
        var div = $('<div class="multifactorButtons">');
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                div.append(arguments[i]);
            }
        }
        node.append(div);
    }

    function addRecovery(node) {
        var div = $('<div class="multifactorRecovery">');
        var button = $('<button type="button" class="btn btn-default multifactorButton" data-action="recovery-multifactor">')
            .append($.txt(gt('Manage Account Recovery')))
            .on('click', function (e) {
                e.preventDefault();
                manageRecover(true);
            });
        return node.append(div.append(button));
    }

    // Creates the add Button
    function addButton() {
        return $('<button type="button" class="btn btn-default multifactorButton" data-action="remove-multifactor">')
            .append(
                $.txt(gt('Add'))
            )
            .on('click', addMultifactor);
    }

    // Creates the remove button
    function removeButton() {
        return $('<button type="button" class="btn btn-default multifactorButton" data-action="remove-multifactor">')
            .append(
                $.txt(gt('Remove'))
            )
            .on('click', removeMultifactor);
    }

    // Button actions

    function removeMultifactor() {
        var devices = $('.multifactordevice');
        var selected = $('.multifactordevice.selected');
        var toDelete;
        // Confirm additional authentication ????
        if (devices.length === 1) {
            toDelete = devices[0];
        } else {
            if (selected.length === 0) {
                alert('select at least one');
                return;
            }
            toDelete = selected[0];
        }
        ox.load(['io.ox/multifactor/settings/views/deleteMultifactorView']).done(function (view) {
            view.open(toDelete).then(function () {
                refresh();
            });
        });
    }

    function addMultifactor() {
        api.getProviders().then(function (data) {
            if (data && data.providers) {
                ox.load(['io.ox/multifactor/settings/views/addMultifactorView']).done(function (view) {
                    view.open(data.providers).then(function () {
                        refresh();
                        manageRecover();
                    });
                });
            } else {
                yell('error', gt('Problem getting and multifactor providers'));
            }

        });
    }

    function manageRecover(showExisting) {
        api.getDevices(true).then(function (devices) {
            if (devices && devices.length > 0) {
                if (showExisting) {
                    ox.load(['io.ox/multifactor/views/recoveryDeviceView']).done(function (view) {
                        view.open(devices);
                    });
                }
            } else {
                api.getProviders(true).then(function (data) {
                    ox.load(['io.ox/multifactor/settings/views/addMultifactorView']).done(function (view) {
                        view.open(data.providers, true).then(function () {
                            refresh();
                        });
                    });
                });
            }
        });
    }

});
