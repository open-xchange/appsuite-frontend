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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
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
