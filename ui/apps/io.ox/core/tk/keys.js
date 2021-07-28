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

define('io.ox/core/tk/keys', ['io.ox/core/event'], function (Events) {

    'use strict';

    var KEY_MAP = {
        8: 'backspace',
        9: 'tab',
        13: 'enter',
        27: 'esc',
        32: 'space',
        37: 'leftarrow',
        38: 'uparrow',
        39: 'rightarrow',
        40: 'downarrow',
        46: 'del'
    };

    function translate(charCode) {
        return KEY_MAP[charCode] || String.fromCharCode(charCode) || String(charCode);
    }

    function KeyListener($node) {
        var events = new Events(), included = false;

        if (!$node) {
            $node = $(window);
        } else {
            $node.on('dispose', function () {
                if (included) {
                    $node.off('keydown', handleEvent);
                }
            });
        }

        function handleEvent(evt) {
            var keys = [], expr;
            if (evt.shiftKey) {
                keys.push('shift');
            }

            if (evt.metaKey || evt.ctrlKey) {
                keys.push('ctrl');
            }

            keys.push(translate(evt.which));

            expr = _.chain(keys).invoke('toLowerCase').sort().join('+').value();
            events.trigger(expr, evt);
        }

        this.include = function () {
            if (included) {
                return;
            }
            included = true;
            $node.on('keydown', handleEvent);
            return this;
        };

        this.remove = function () {
            if (!included) {
                return;
            }
            included = false;
            $node.off('keydown', handleEvent);
            return this;
        };

        function normalizeExpression(keyExpr) {
            return _.chain(keyExpr.split(/[ +]+/)).invoke('toLowerCase').sort().join('+').value();
        }

        this.on = function (keyExpr, fn) {
            if (!keyExpr) {
                throw new Error('Please specify a key expression');
            }
            events.on(normalizeExpression(keyExpr), fn);
            return this;
        };

        this.off = function (keyExpr, fn) {
            events.off(normalizeExpression(keyExpr), fn);
            return this;
        };

        this.destroy = function () {
            this.remove();
            events.destroy();
        };

    }

    return KeyListener;
});
