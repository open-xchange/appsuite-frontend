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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/main/appcontrol', [
    'io.ox/core/extensions',
    'settings!io.ox/core'
], function (ext, settings) {

    var coloredIcons = settings.get('features/appLauncher/colored', false);
    var appLauncherIcon = '<svg viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><g class="fill-c1" fill-rule="evenodd"><path d="M0 0h16v16H0zM25 0h16v16H25zM50 0h16v16H50zM0 25h16v16H0zM25 25h16v16H25zM50 25h16v16H50zM0 50h16v16H0zM25 50h16v16H25zM50 50h16v16H50z"/></g></svg>';

    var meta = [{
        name: 'Mail',
        svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="app-icon-mail"><g class="stroke-w1 stroke-c1" stroke-width="3" fill="none" fill-rule="evenodd"><path d="M8 16h48v32H8z"/><path d="M8 20l24 16 24-16"/></g></svg>'
    }, {
        name: 'Calendar',
        svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="app-icon-calendar"><g fill="none" fill-rule="evenodd"><g font-family="HelveticaNeue, Helvetica Neue" transform="translate(5 0)"><text class="fill-c1" font-size="20" font-weight="bold"><tspan x="21.992" y="45">31</tspan></text><text class="fill-c1" font-size="11" text-anchor="middle"><tspan x="27.27" y="24">Thu</tspan></text></g><path class="stroke-c1 stroke-w1" stroke-width="3" d="M8 11v42h48V11z"/></g></svg>'
    }, {
        name: 'Addressbook',
        svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="app-icon-addressbook"><g class="stroke-c1 stroke-w1" transform="translate(16 13)" stroke-width="3" fill="none" fill-rule="evenodd"><circle cx="16" cy="8" r="8"/><path d="M0 34c.488-6.369 4.627-11.705 10.308-13.88A8.864 8.864 0 0 0 16 22.156c2.18 0 4.172-.768 5.692-2.036C27.373 22.295 31.512 27.63 32 34H0z"/></g></svg>'
    }, {
        name: 'Drive',
        svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="app-icon-drive"><path class="stroke-c1 stroke-w1" d="M17.041 46h30.973c1.556 0 8.537-2.642 7.951-10.25-.39-5.074-3.56-7.928-9.507-8.563-.906-4.427-3.472-5.89-7.696-4.388-.628.223-4.246-5.982-12.065-4.597-8.508 1.507-9.937 8.638-10.395 8.985-.437.332-9.099.91-8.242 10.558C8.646 44.348 14.538 46 17.04 46z" stroke-width="3" fill="none" fill-rule="evenodd"/></svg>'
    }, {
        name: 'Portal',
        svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="app-icon-portal"><g class="stroke-c1 stroke-w1" stroke-width="3" fill="none" fill-rule="evenodd"><path d="M13 17h16v12H13zM51 47H35V35h16zM51 29H35V17h16zM29 47H13V35h16z"/></g></svg>'
    }, {
        name: 'Tasks',
        svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="app-icon-tasks"><g class="stroke-c1 stroke-w1" stroke-width="3" fill="none" fill-rule="evenodd"><path d="M47 30v18H16V16h28"/><g stroke-linecap="square"><path d="M23.166 28.397l8.248 8.248M31.385 36.615l18.85-18.85"/></g></g></svg>'
    }, {
        name: 'Text',
        svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="app-icon-text"><g fill="none" fill-rule="evenodd"><g class="stroke-c1 stroke-w1" stroke-width="3"><path d="M40.929 10L48 17.071V54H16V10h24.929z"/><path d="M40 11v7M48 18h-8" stroke-linecap="square"/></g><path d="M22 25h18M22 30h15M22 35h18M22 40h18M22 45h12" class="stroke-c1 stroke-w1" stroke-width="2" stroke-linecap="square"/></g></svg>'
    }, {
        name: 'Spreadsheet',
        svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="app-icon-spreadsheet"><g fill="none" fill-rule="evenodd"><path fill-opacity=".3" class="fill-c1" d="M13 15h38v9H13z"/><path class="stroke-c1 stroke-w1" stroke-width="3" d="M13 15h38v34H13z"/><path d="M13.5 24h37M13.5 32h37M13.5 40h37M22 15v34M32 15v34M42 15v34" class="stroke-c1 stroke-w1" stroke-linecap="square"/></g></svg>'
    }, {
        name: 'Presentation',
        svg: '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="app-icon-presentation"><g fill="none" fill-rule="evenodd"><path d="M10 15h44v34H10z" class="stroke-c1 stroke-w1" stroke-width="3"/><g class="fill-c1"><path d="M32 23v9.004h9a9.001 9.001 0 1 1-18-.002A9.001 9.001 0 0 1 32 23z"/><path d="M34 21.014c.165-.01.332-.014.5-.014 4.694 0 8.5 3.582 8.5 8 0 .339-.022.672-.066 1H34v-8.986z" fill-opacity=".6"/></g></g></svg>'
    }];

    var quicklaunchSettings = 'Mail,Calendar';

    function toggleOverlay() {
        $('#io-ox-appcontrol').toggleClass('open');
        $('#io-ox-launchgrid-overlay, #io-ox-launchgrid-overlay-inner').toggle();
    }

    function drawIcon(o) {
        var $svg = $(o.svg),
            badge = $();

        if (coloredIcons) $svg.addClass('colored');

        if (o.name === 'Calendar') {
            $svg.find('tspan:first').text(moment().format('D'));
            $svg.find('tspan:last').text(moment().format('ddd'));
        }
        if (o.name === 'Mail') {
            badge = $('<div class="indicator" aria-hidden="true">');
        }
        return $('<div class="lcell">').append(
            badge,
            $('<div class="svgwrap">').append($svg),
            $('<div class="title">').text(o.name)
        );
    }

    function drawQuicklaunch() {
        return meta.filter(function (o) {
            return quicklaunchSettings.indexOf(o.name) > -1;
        }).map(function (o) {
            return $('<button type="button" class="btn btn-link">').append(drawIcon(o));
        });
    }

    ext.point('io.ox/core/appcontrol').extend({
        id: 'default',
        draw: function () {
            if (_.device('!desktop')) return;

            $('#io-ox-appcontrol').show();

            var banner = $('#io-ox-appcontrol');
            var taskbar;
            banner.append(
                $('<div id="io-ox-launcher">').append(
                    $('<button type="button" class="btn btn-link" aria-haspopup="true" aria-expanded="false" aria-label="Navigate to:">').on('click', function () {
                        $('#io-ox-appcontrol').toggleClass('open');
                        $('#io-ox-launchgrid-overlay, #io-ox-launchgrid-overlay-inner').toggle();
                    }).append(
                        appLauncherIcon
                    ),
                    $('<div id="io-ox-launchgrid">').append(
                        $('<div class="cflex">').append(
                            meta.map(drawIcon)
                        )
                    ),
                    $('<div id="io-ox-launchgrid-overlay-inner">').on('click', toggleOverlay)
                ),
                $('<div id="io-ox-quicklaunch">').append(
                    drawQuicklaunch()
                ),
                $('<div id="io-ox-topsearch" class="hidden-xs hidden-sm">').text('Search'),
                $('<div id="io-ox-toprightbar">').append(
                    taskbar = $('<ul class="taskbar list-unstyled">')
                )
            );

            $('#io-ox-core').append(
                $('<div id="io-ox-launchgrid-overlay">').on('click', toggleOverlay)
            );

            ext.point('io.ox/core/appcontrol/right').invoke('draw', taskbar);
        }
    });
});
