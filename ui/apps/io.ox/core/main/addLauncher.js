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

define('io.ox/core/main/addLauncher', [], function () {
    // add launcher
    var addLauncher = function (side, label, fn, arialabel) {
        var node = $('<li role="presentation" class="launcher">');

        if (fn) {
            node.on('click', 'a', function (e) {
                e.preventDefault();
                var self = $(this), content,
                    focus = $(document.activeElement);
                // set fixed width, hide label, be busy
                content = self.contents().detach();
                self.css('width', self.width() + 'px').text('\u00A0').busy();
                // call launcher
                (fn.call(this) || $.when()).done(function () {
                    // revert visual changes
                    self.idle().empty().append(content).css('width', '');
                    //detaching results in lost focus, which is bad for keyboard support.
                    //so we need to restore it, if it was not set manually in the mean time.
                    if ($(document.activeElement).filter('body').length > 0) {
                        focus.focus();
                    }
                });
            });
        }

        //construct
        node.append(function () {
            if (_.isString(label)) {
                return $('<a href="#" class="apptitle" tabindex="-1">').text(label);
            } else if (label[0].tagName === 'I' || label[0].tagName === 'svg') {
                return $('<a href="#" class="apptitle" role="button" tabindex="-1">').attr('aria-label', arialabel ? _.escape(arialabel) : null).append(label);
            }
            return label;
        });

        if (side === 'left') node.hide();

        return node.appendTo($('#io-ox-toprightbar'));
    };

    return addLauncher;
});
