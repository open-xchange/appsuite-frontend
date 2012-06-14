/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/toolbar', ['gettext!io.ox/office/main'], function (gt) {

    'use strict';

    function ToolBar(options) {

        options = options || {};

        var node = $('<div>')
                .addClass('btn-toolbar')
                .append(
                    $('<div>').addClass('btn-group').append(
                        $('<button>').addClass('btn btn-iconlike').text('B').css('font-weight', 'bold'),
                        $('<button>').addClass('btn btn-iconlike').text('I').css('font-style', 'italic'),
                        $('<button>').addClass('btn btn-iconlike').text('U').css('text-decoration', 'underline')
                    ),
                    $('<div>').addClass('btn-group').append(
                        $('<button>').addClass('btn').append($('<i>').addClass('icon-align-left')),
                        $('<button>').addClass('btn').append($('<i>').addClass('icon-align-center')),
                        $('<button>').addClass('btn').append($('<i>').addClass('icon-align-right')),
                        $('<button>').addClass('btn').append($('<i>').addClass('icon-align-justify'))
                    )
                );

        /**
         * Returns the root element representing this tool bar.
         */
        this.getNode = function () {
            return node;
        };

        /**
         * Destructor function, detaches all listeners and performs other
         * cleanup work.
         */
        this.destroy = function () {
            node.off();
            node = null;
        };
    }

    return ToolBar;
});
