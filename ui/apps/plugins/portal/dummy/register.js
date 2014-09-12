/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/portal/dummy/register', $.noop);

/*define('plugins/portal/dummy/register', [
    'io.ox/core/extensions'], function (ext) {

    'use strict';

    var load = function () {
        return $.Deferred().resolve($('<div>').text('Blablabla'));
    };
    var drawTypeA = function () {
        var $node = $('<div class="io-ox-tile-container io-ox-portal-typeA">').append(
            $('<div class="io-ox-portal-title">').text('Dummy Type A'),
            $('<div class="io-ox-portal-content">').append(
                $('<div class="io-ox-portal-item">').text('item #1'),
                $('<div class="io-ox-portal-item">').text('item #2'),
                $('<div class="io-ox-portal-item">').text('item #3'),
                $('<div class="io-ox-portal-item">').text('item #4'),
                $('<div class="io-ox-portal-item">').text('item #5'),
                $('<div class="io-ox-portal-item">').text('item #6'),
                $('<div class="io-ox-portal-item">').text('item #7'),
                $('<div class="io-ox-portal-item">').text('item #8'),
                $('<div class="io-ox-portal-item">').text('item #9')
            ),
            $('<div class="io-ox-portal-actions">').append(
                $('<i class="fa fa-edit io-ox-portal-tile-action">').text(' '),
                $('<i class="fa fa-times io-ox-portal-tile-action">').text(' ')
            )
        );
        return $node;
    };
    var drawTypeB = function () {
        var pos = Math.floor(Math.random() * 3);
        var img = ['http://www.open-xchange.com/typo3conf/ext/opx/Resources/Public/Image/portal/icon/carousel/doller.png',
            'http://www.open-xchange.com/typo3conf/ext/opx/Resources/Public/Image/portal/icon/carousel/gear.png',
            'http://www.open-xchange.com/typo3conf/ext/opx/Resources/Public/Image/portal/icon/carousel/ignite.png'][pos];
        var $node = $('<div class="io-ox-tile-container io-ox-portal-typeB">').append(
            $('<div class="io-ox-portal-image">').attr({ 'style': 'background-image: url(' + img + ')' }),
            $('<div class="io-ox-portal-title">').text('Dummy Type B' + pos).append(
                $('<i class="fa fa-edit io-ox-portal-action">').text(' '),
                $('<i class="fa fa-times io-ox-portal-action">').text(' ')
            )
        );
        return $node;
    };
    var drawTile = function () {
        if (Math.random() > 0.5) {
            $(this).append(drawTypeA());
        } else {
            $(this).append(drawTypeB());
        }
    };
    var draw = function () {
        var $node = $('<div class="io-ox-portal-dummy">').appendTo(this).append(
            $('<h1 class="clear-title">').text('Dummy'),
            $('<p>').text('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ' +
            'ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi' +
            ' ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum' +
            ' dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia' +
            ' deserunt mollit anim id est laborum.')
        );
        return $.Deferred().resolve($node);
    };
    // for (var i = 0; i < 25; i++) {
    //     ext.point('io.ox/portal/widget').extend({
    //         id: 'dummy' + i,
    //         index: 500 + i,
    //         title: 'Dummy #' + i,
    //         load: load,
    //         draw: draw,
    //         drawTile: drawTile
    //     });
    // }
});
*/
