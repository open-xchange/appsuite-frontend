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
    ['io.ox/office/tk/utils',
     'io.ox/office/editor/format/container'
    ], function (Utils, Container) {

    'use strict';

    // class Lists ============================================================

    /**
     * Contains the definitions of lists.
     *
     * @constructor
     *
     * @extends Container
     *
     * @param {DocumentStyles} documentStyles
     *  Collection with the style containers of all style families.
     */
    function Lists(documentStyles) {

        var // list definitions
            lists = [],
        // defaults - TODO: check each added lists if it is a default!
            defaultNumberingNumId, defaultBulletNumId;

        // base constructor ---------------------------------------------------

        Container.call(this, documentStyles);

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
            this.triggerChangeEvent();

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
         */
        this.getLists = function () {
            return lists;
        };

        /**
         *
         * @returns {String}
         *  the Id of a default bullet numbering. If this default numbering definition is not availabe then it will be created
         */
        this.getDefaultBulletNumId = function () {
            // TODO: find or create default definition
            if (!defaultBulletNumId) {

                //TODO: search for a 'free' id
                defaultBulletNumId = 99;
                var listDefinition = {};
                listDefinition.listLevel0 = {numberFormat: 'bullet', leftIndent: 720, hangingIndent: 360 };
                listDefinition.listLevel1 = {numberFormat: 'bullet', leftIndent: 2 * 720, hangingIndent: 360 };
                listDefinition.listLevel2 = {numberFormat: 'bullet', leftIndent: 3 * 720, hangingIndent: 360 };
                listDefinition.listLevel3 = {numberFormat: 'bullet', leftIndent: 4 * 720, hangingIndent: 360 };
                listDefinition.listLevel4 = {numberFormat: 'bullet', leftIndent: 5 * 720, hangingIndent: 360 };
                listDefinition.listLevel5 = {numberFormat: 'bullet', leftIndent: 6 * 720, hangingIndent: 360 };
                listDefinition.listLevel6 = {numberFormat: 'bullet', leftIndent: 7 * 720, hangingIndent: 360 };
                listDefinition.listLevel7 = {numberFormat: 'bullet', leftIndent: 8 * 720, hangingIndent: 360 };
                listDefinition.listLevel8 = {numberFormat: 'bullet', leftIndent: 9 * 720, hangingIndent: 360 };
                this.addList(defaultBulletNumId, listDefinition);
            }
            return defaultBulletNumId;
        };
        /**
         *
         * @returns {String}
         *  the Id of a default ordered numbering. If this default numbering definition is not availabe then it will be created
         */
        this.getDefaultNumberingNumId = function () {
            // TODO: find or create default definition
            if (!defaultNumberingNumId) {
                defaultNumberingNumId = 98;
                var listDefinition = {};
                listDefinition.listLevel0 = {numberFormat: 'decimal', leftIndent: 720, hangingIndent: 360 };
                listDefinition.listLevel1 = {numberFormat: 'lowerLetter', leftIndent: 2 * 720, hangingIndent: 360 };
                listDefinition.listLevel2 = {numberFormat: 'upperLetter', leftIndent: 3 * 720, hangingIndent: 360 };
                listDefinition.listLevel3 = {numberFormat: 'lowerRoman', leftIndent: 4 * 720, hangingIndent: 360 };
                listDefinition.listLevel4 = {numberFormat: 'upperRoman', leftIndent: 5 * 720, hangingIndent: 360 };
                listDefinition.listLevel5 = {numberFormat: 'decimal', leftIndent: 6 * 720, hangingIndent: 360 };
                listDefinition.listLevel6 = {numberFormat: 'lowerLetter', leftIndent: 7 * 720, hangingIndent: 360 };
                listDefinition.listLevel7 = {numberFormat: 'upperLetter', leftIndent: 8 * 720, hangingIndent: 360 };
                listDefinition.listLevel8 = {numberFormat: 'lowerRoman', leftIndent: 9 * 720, hangingIndent: 360 };
                this.addList(defaultNumberingNumId, listDefinition);
            }
            return defaultNumberingNumId;
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

    } // class Lists

    // exports ================================================================

    // derive this class from class Container
    return Container.extend({ constructor: Lists });

});
