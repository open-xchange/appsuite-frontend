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
    'io.ox/core/extensions'
], function (ext) {

    var meta = [{
        name: 'Mail',
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g class="stroke-c1 fill-none" stroke-width="2" fill-rule="evenodd"><path d="M17.012 25.012l66 .192a4 4 0 0 1 3.988 4V71a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V29.012a4 4 0 0 1 4.012-4z"/><path d="M13 28l37 26 37-25.73"/></g></svg>'
    }, {
        name: 'Calendar',
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(10 14)" fill="none" fill-rule="evenodd"><rect class="stroke-c1" stroke-opacity=".695" stroke-width="2" x="1" y="1" width="78" height="70" rx="4"/><text class="fill-c1" text-anchor="middle" font-family="HelveticaNeue, Helvetica Neue" font-size="34" y="55"><tspan x="41">21</tspan></text><text class="fill-c1" text-anchor="middle" font-family="HelveticaNeue, Helvetica Neue" font-size="11" y="21"><tspan x="41">Monday</tspan></text></g></svg>'
    }, {
        name: 'Addressbook',
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g class="stroke-c1" stroke-width="2" transform="translate(24 23)" fill="none" fill-rule="evenodd"><ellipse cx="26.19" cy="14.423" rx="14" ry="14.423"/><path d="M0 55c.793-11.146 7.519-20.484 16.75-24.29 2.471 2.218 5.707 3.563 9.25 3.563s6.779-1.345 9.25-3.564C44.48 34.516 51.207 43.854 52 55H0z"/></g></svg>'
    }, {
        name: 'Drive',
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path class="stroke-c1" d="M27.405 70.244h45.923c2.307 0 12.657-3.797 11.789-14.734-.579-7.29-5.277-11.393-14.096-12.306-1.344-6.363-5.148-8.465-11.41-6.307-.932.321-6.296-8.598-17.89-6.607C29.107 32.456 26.99 42.705 26.31 43.204c-.649.477-13.492 1.309-12.222 15.175.87 9.49 9.606 11.865 13.317 11.865z" stroke-width="2" fill="none"/></svg>'
    }, {
        name: 'Portal',
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path class="stroke-c1" d="M25 36h14v13H25zm18 0h14v13H43zM25 53h14v13H25zm18 0h14v13H43zm18-17h14v13H61zm0 17h14v13H61z" stroke-width="2" fill="none" fill-rule="evenodd" opacity=".868"/></svg>'
    }, {
        name: 'Tasks',
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g class="stroke-c1" fill="none" fill-rule="evenodd"><path stroke-width="4" d="M37 43.154l12.119 11.539L74 28"/><path d="M71 40.776V68a4 4 0 0 1-4 4H31a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4h29.74" stroke-width="2"/></g></svg>'
    }, {
        name: 'Text',
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path class="fill-c1" d="M33 48h30v4H33zm0 9h34v4H33zm0-18h34v4H33z"/><g class="stroke-c1" stroke-width="2"><path d="M66 17v9h9"/><path d="M25 17h41l9 9v58H25z"/></g></g></svg>'
    }, {
        name: 'Spreadsheet',
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path class="fill-c1" fill-opacity=".197" d="M19.711 24.711H83v10.263H19.711z"/><path class="stroke-c1" stroke-width="1.711" d="M18.855 23.855h63.289v53.026H18.855z"/><path class="stroke-c1" d="M34.25 23.855v53.027M68.46 23.855v53.027M51.355 23.855v53.027M18.855 35.829h63.29M18.985 49.513h63.03M18.985 63.197h63.03" stroke-width="1.711" stroke-linecap="square"/></g></svg>'
    }, {
        name: 'Presentation',
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(15 24)" fill="none" fill-rule="evenodd"><g class="fill-c1"><path d="M33.384 13.509v14.064H46.62c-.592 6.574-6.117 11.725-12.845 11.725-7.123 0-12.898-5.774-12.898-12.897 0-6.993 5.565-12.686 12.507-12.892z"/><path d="M35.614 11.058c.13-.003.26-.005.39-.005 7.124 0 12.899 5.774 12.899 12.897 0 .396-.018.787-.053 1.173H35.614V11.058z"/></g><rect class="stroke-c1" stroke-width="2.456" x="1.228" y="1.228" width="67.544" height="49.123" rx="1.228"/></g></svg>'
    }];

    function toggleOverlay() {
        $('#io-ox-appcontrol').toggleClass('open');
        $('#io-ox-launchgrid-overlay, #io-ox-launchgrid-overlay-inner').toggle();
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
                        $('<i class="fa fa-th" aria-hidden="true">')
                    ),
                    $('<div id="io-ox-launchgrid">').append(
                        $('<div class="cflex">').append(
                            meta.map(function (o) {
                                if (o.name === 'Calendar') {
                                    var svg = $(o.svg);
                                    svg.find('tspan:first').text(moment().format('D'));
                                    svg.find('tspan:last').text(moment().format('dddd'));
                                    o.svg = svg;
                                }
                                return $('<div class="lcell" tabindex="0">').append(
                                    $('<div class="svgwrap">').append(o.svg),
                                    $('<div class="title">').text(o.name)
                                );
                            })
                        )
                    ),
                    $('<div id="io-ox-launchgrid-overlay-inner">').on('click', toggleOverlay)
                ),
                $('<div id="io-ox-quicklaunch">').text('Quicklaunch'),
                $('<div id="io-ox-topsearch">').text('Search'),
                $('<div id="io-ox-toprightbar">').append(
                    taskbar = $('<ul class="taskbar list-unstyled">')
                )
            );

            $('#io-ox-core').append(
                $('<div id="io-ox-launchgrid-overlay">').on('click', toggleOverlay)
            );

            ext.point('io.ox/core/topbar/right').invoke('draw', taskbar);
        }
    });
});
