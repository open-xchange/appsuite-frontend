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
* @author Jonas Regier <jonas.regier@open-xchange.com>
*/

define('io.ox/backbone/mini-views/contextmenu-utils', [
], function () {

    'use strict';

    //
    // drawing utility functions
    //
    function a(action, text) {
        return $('<a href="#" role="menuitem">')
            .attr('data-action', action).text(text)
            // always prevent default
            .on('click', $.preventDefault);
    }

    function disable(node) {
        return node.attr('aria-disabled', true).removeAttr('tabindex').addClass('disabled');
    }

    function addLink(node, options) {
        var link = a(options.action, options.text);
        if (options.enabled) link.on('click', options.data, options.handler); else disable(link);
        node.append($('<li role="presentation">').append(link));
        return link;
    }

    function divider() {
        this.append(
            $('<li class="divider" role="separator">')
        );
    }

    function header(label) {
        this.append(
            $('<li class="dropdown-header" role="presentation" aria-hidden="true">').text(label)
        );
    }

    return {
        a: a,
        disable: disable,
        addLink: addLink,
        divider: divider,
        header: header
    };
});
