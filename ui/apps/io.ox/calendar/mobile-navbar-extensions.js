/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/calendar/mobile-navbar-extensions', [
    'io.ox/core/extensions'
], function (ext) {

    'use strict';

    ext.point('io.ox/calendar/mobile/navbar').extend({
        id: 'btn-left',
        index: 100,
        draw: function (baton) {
            if (!baton.left) return;
            this.$el.append(
                $('<div class="navbar-action left">').append(
                    $('<a>').append(
                        $('<i class="fa fa-chevron-left" aria-hidden="true">'),
                        baton.left
                    )
                )
            );
        }
    });

    ext.point('io.ox/calendar/mobile/navbar').extend({
        id: 'header',
        index: 200,
        draw: function (baton) {
            this.$el.append(
                $('<div class="navbar-title">').text(baton.title)
            );
        }
    });

    ext.point('io.ox/calendar/mobile/navbar').extend({
        id: 'btn-right',
        index: 300,
        draw: function (baton) {
            if (!baton.right) return;
            this.$el.append(
                $('<div class="navbar-action right">').append(
                    $('<a>').append(
                        baton.right
                    )
                )
            );
        }
    });

    ext.point('io.ox/calendar/mobile/navbarFoldertree').extend({
        id: 'btn-left',
        index: 100,
        draw: function (baton) {
            if (!baton.left) return;
            this.$el.append(
                $('<div class="navbar-action left">').append(
                    $('<a>').append(
                        baton.left
                    )
                )
            );
        }
    });

    ext.point('io.ox/calendar/mobile/navbarFoldertree').extend({
        id: 'header',
        index: 200,
        draw: function (baton) {
            this.$el.append(
                $('<div class="navbar-title">').text(baton.title)
            );
        }
    });

    ext.point('io.ox/calendar/mobile/navbarFoldertree').extend({
        id: 'btn-right',
        index: 300,
        draw: function (baton) {
            if (!baton.right) return;
            this.$el.append(
                $('<div class="navbar-action right">').append(
                    $('<a>').append(
                        baton.right,
                        $('<i class="fa fa-chevron-right" aria-hidden="true">')
                    )
                )
            );
        }
    });

});
