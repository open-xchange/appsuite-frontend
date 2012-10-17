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
 * @author Oliver Specht <oliver.specht@open-xchange.com>
 */

define('io.ox/office/editor/format/lists',
    ['io.ox/core/event',
     'io.ox/office/tk/utils',
     'io.ox/office/editor/dom'
    ], function (Events, Utils, DOM) {

    'use strict';

    // class Lists ==================================================

    /**
     * Contains the definitions of lists.
     *
     * @constructor
     *
     * @param {HTMLElement|jQuery} rootNode
     *  The root node containing all elements formatted by the style sheets of
     *  this container. If this object is a jQuery collection, uses the first
     *  node it contains.
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
     */
    function Lists(rootNode, documentStyles) {

        var // self reference
        self = this,

        // list definitons
        lists = [];
        // methods ------------------------------------------------------------


        /**
         * Adds a new style sheet to this container. An existing list definition
         * with the specified identifier will be replaced.
         *
         * @param {String} name
         *  The name of of the new list definition.
         *
         * @param {Object} listDefinition
         *  The attributes of the list definition.
         *
         * @returns {Lists}
         *  A reference to this instance.
         */
        this.addList = function (listIdentifier, listDefinition) {

            lists[listIdentifier] = {};
            var list = lists[listIdentifier];
            //list.listIdentifier = listIdentifier;
            list.listLevels = [];
            list.listLevels[0] = listDefinition.listLevel0;
            list.listLevels[1] = listDefinition.listLevel1;
            list.listLevels[2] = listDefinition.listLevel2;
            list.listLevels[3] = listDefinition.listLevel3;
            list.listLevels[4] = listDefinition.listLevel4;
            list.listLevels[5] = listDefinition.listLevel5;
            list.listLevels[6] = listDefinition.listLevel6;
            list.listLevels[7] = listDefinition.listLevel7;
            list.listLevels[8] = listDefinition.listLevel8;

            // notify listeners
            this.trigger('change');

            return this;
        };
        /**
         * Gives access to a single list definition.
         *
         * @param name the name of the list to return.
         * @returns {Lists}
         *  A reference to this instance.
         */
        this.getList = function (name) {
            return (name in lists) ? lists[name] : undefined;
        };
        /**
         * Gives access to all list definitions.
         *
         */
        this.getLists = function () {
            return lists;
        };

        this.destroy = function () {
            this.events.destroy();
        };

        /**
         * Generates the numbering Label for the given paragraph
         *
         * @param listId identifier of the applied numbering definition
         * @param ilvl indent level, zero based
         * @param levelIndexes array of sequential position of the current paragraph
         *      contains an array with ilvl + 1 elements that determines the sequential position of the current paragraph within the numbering
         *
         * @returns tbd.
         *
         */
        this.formatNumber = function (listId, ilvl, levelIndexes) {
            var ret = {};
            var currentList = this.getList(listId);
            if (currentList === undefined) {
                return "?";
            }
            var levelFormat = currentList.listLevels[ilvl];
            if (levelFormat === undefined) {
                return "??";
            }
            var numberFormat = levelFormat.numberFormat;
            ret.text = this.formatNumberType(levelIndexes === undefined ? 0 : levelIndexes[ilvl], numberFormat);
            ret.indent = levelFormat.leftIndent - (levelFormat.hangingIndent ? levelFormat.hangingIndent : 0);
            //+ levelFormat.firstLineIndent
            ret.labelWidth = (levelFormat.hangingIndent ? levelFormat.hangingIndent : 0);
            return ret;
        };

        this.formatNumberType = function (seqNo, numberFormat) {
            var retString = "???";
            switch (numberFormat) {
            case "decimal":
                retString = "1";
                break;
            case "lowerLetter":
                retString = "a";
                break;
            case "upperLetter":
                retString = "A";
                break;
            case "lowerRoman":
                retString = "i";
                break;
            case "upperRoman":
                retString = "I";
                break;
            case "bullet":
                retString = "●";
                break;
            default:
            }
            return retString;
        };
        // add event hub
        Events.extend(this);
    } // class Lists
    // exports ================================================================

    return Lists;


});
