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

define('io.ox/core/about/c64', ['less!io.ox/core/about/c64'], function () {

    'use strict';

    var keydown = function (e) {
        if (e.which === 27) {
            $('.c64').remove();
            $(document).off('keydown', keydown);
        }
    };

    var focus = function () {
        $(this).attr('contenteditable', 'true');
        $(this).find('.cursor').remove();
    };

    function cursor() {
        $('.c64 .inner').prepend(
            $('<div class="cursor">')
        );
    }

    function list() {
        $('.c64 .inner').append(
            $.txt(
                '100 REM   UI Team' + '\n' +
                '110 REM -----------------------' + '\n' +
                '110 REM   Matthias Biggeleben' + '\n' +
                '120 REM   Francisco Laguna' + '\n' +
                '130 REM   Christoph Kopp' + '\n' +
                '140 REM   Tobias Prinz' + '\n' +
                '150 REM   Christoph Hellweg' + '\n' +
                '160 REM   Alexander Quast' + '\n' +
                '170 REM   Frank Paczynski' + '\n' +
                '180 REM   Julian Baeume' + '\n' +
                '190 REM   David Bauer' + '\n' +
                '200 REM   Daniel Dickhaus' + '\n' +
                '210 REM   Viktor Pracht' + '\n' +
                '220 REM -----------------------' + '\n' +
                '\n' +
                'READY.\n'
            )
        );
    }

    function content() {
        $('.c64 .inner').append(
            $.txt(
                '\n' +
                '    **** COMMODORE 64 BASIC V2 ****\n' +
                '\n' +
                ' 64K RAM SYSTEM  57462 BASIC BYTES FREE\n' +
                '\n' +
                'READY.\n' +
                'LIST\n\n'
            )
        );
    }

    function inner() {
        $('.c64').append($('<div class="inner" tabindex="-1">'));
    }

    return function () {

        $('body').append($('<div class="c64">'));

        _.wait(1000).done(function () {
            inner();
            _.wait(500).done(function () {
                content();
                _.wait(1000).done(function () {
                    list();
                    cursor();
                    $('.c64 .inner').on('focus', focus);
                    $(document).on('keydown', keydown);
                });
            });
        });
    };
});
