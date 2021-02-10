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
 * @author Greg Hill <greg.hill@open-xchange.com>
 */

define('io.ox/multifactor/login/loginScreen', ['io.ox/core/extensions', 'io.ox/core/main/addLauncher', 'gettext!io.ox/core', 'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/main/appcontrol', 'io.ox/core/main/icons', 'io.ox/core/api/apps', 'less!io.ox/multifactor/login/style'
], function (ext, addLauncher, gt, Dropdown) {

    'use strict';

    var styleModified = false;

    // Function that adds icon placeholders.  These are non functional, and need to be redrawn once complete login done.
    function addPlaceholderIcons(node) {
        node.append(
            addLauncher(
                'right',
                $('<i class="fa fa-refresh launcher-icon" aria-hidden="true">').attr('title', gt('Refresh')),
                function () {
                    return $.when();
                },
                gt('Refresh')
            ).attr('id', 'io-ox-refresh-icon'));
        var a = $('<a href="#" class="dropdown-toggle f6-target" data-toggle="dropdown" tabindex="-1">').attr('title', gt('Settings')),
            dropdown = new Dropdown({
                tagName: 'li',
                id: 'io-ox-topbar-settings-dropdown-icon',
                className: 'launcher dropdown',
                $toggle: a
            });
        var tempPic = $('<div class="contact-picture">').append('...');
        a.append(tempPic);
        node.append(dropdown.render().$el);
    }

    function loadBackground() {
        $('body').append($('<iframe class="multifactorBackground" src="' + ox.serverConfig.multifactorBackground + '">'));
        document.styleSheets[0].insertRule('.modal-backdrop.in { opacity: 0.1 !important; }', 0);
        styleModified = true;
    }

    var login = {
        create: function () {
            if (ox.serverConfig.multifactorBackground) {  // If configured background, use that instead of toolbar
                loadBackground();
                return;
            }
            var topbar = $('#io-ox-appcontrol');
            ext.point('io.ox/core/appcontrol').invoke('draw', topbar);  // Draw the top bar
            $('#io-ox-core').show();  // We need to show the core if hidden
            addPlaceholderIcons(topbar.find('.taskbar'));  // Add temporary icons
            require(['io.ox/core/main/designs']);  // Load the users selected colors for the top bar
        },
        destroy: function () {
            $('#io-ox-appcontrol').empty();   // Wipe the temporary bar
            $('.multifactorBackground').remove();
            if (styleModified) document.styleSheets[0].deleteRule(0);
        }
    };

    return login;

});
