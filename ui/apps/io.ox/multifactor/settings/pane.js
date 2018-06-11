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
    'io.ox/multifactor/settings/factorRenderer',
    'settings!io.ox/multifactor',
    'gettext!multifactor',
    'less!io.ox/multifactor/settings/style'
], function (ext, ExtensibleView, util, api, factorRenderer, settings, gt) {
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
        }
    );

    // Refresh the status div and update buttons
    function refresh(statusDiv) {
        statusDiv.empty();
        api.getStatus().then(function (status) {
            drawStatus(statusDiv, status);
        });
    }

    // Returns true if any devices exist within any providers
    function hasDevices(providers) {
        var hasDevice = false;
        providers.forEach(function (provider) {
            if (provider.devices && provider.devices.length > 0) {
                hasDevice = true;
            }
        });
        return hasDevice;
    }

    // Draw the status div, including proper buttons
    function drawStatus(node, data) {
        if (data) {
            if (data.providers && hasDevices(data.providers)) {
                node.append(factorRenderer.render(data.providers));
                addButtons(node, addButton, removeButton);
                return;
            }
        }
        node.append(gt('No multifactor devices registered yet.'));
        addButtons(node, addButton);
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
            view.open(toDelete);
        });
    }

    function addMultifactor() {
        console.log('add');
    }

});
