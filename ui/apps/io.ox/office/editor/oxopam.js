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
 * @author Ingo Schmidt-Rosbiegal <ingo.schmidt-rosbiegal@open-xchange.com>
 */

define('io.ox/office/editor/oxopam', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

    // class OXOPaM =======================================================

    /**
     * 'Point and mark'. Represents a text position a.k.a. cursor position.
     * Member field 'oxoPosition' contains the logical position as an array
     * of integers. Member field 'selectedNodeName' contains the property
     * 'nodeName' of the dom node that was used to calculate the logical
     * position. The value of selectedNodeName can be 'DIV', 'TR', ...
     */
    function OXOPaM(oxoPosition, selectedNodeName) {
        this.oxoPosition = oxoPosition;
        this.selectedNodeName = selectedNodeName ? selectedNodeName : null;

        this.toString = function () {
            return oxoPosition.toString();
        };
    }

    return OXOPaM;

});
