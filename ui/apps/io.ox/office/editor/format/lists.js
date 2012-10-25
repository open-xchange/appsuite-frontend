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
     'io.ox/office/editor/format/container',
     'io.ox/office/editor/operations'
    ], function (Utils, Container, Operations) {

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
        // defaults
            defaultNumberingNumId, defaultBulletNumId;

        var defaultBulletListDefinition = {
            listLevel0: { justification: 'left', leftIndent: 1270,     numberFormat: 'bullet', levelStart: 1, fontName: 'Symbol', levelText: '', hangingIndent: 635 },
            listLevel1: { justification: 'left', leftIndent: 2 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Symbol', levelText: 'o',  hangingIndent: 635 },
            listLevel2: { justification: 'left', leftIndent: 3 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Symbol', levelText: '', hangingIndent: 635 },
            listLevel3: { justification: 'left', leftIndent: 4 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Symbol', levelText: '', hangingIndent: 635 },
            listLevel4: { justification: 'left', leftIndent: 5 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Symbol', levelText: 'o', hangingIndent: 635 },
            listLevel5: { justification: 'left', leftIndent: 6 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Symbol', levelText: '', hangingIndent: 635 },
            listLevel6: { justification: 'left', leftIndent: 7 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Symbol', levelText: '', hangingIndent: 635 },
            listLevel7: { justification: 'left', leftIndent: 8 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Symbol', levelText: 'o',  hangingIndent: 635 },
            listLevel8: { justification: 'left', leftIndent: 9 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Symbol', levelText: '', hangingIndent: 635 }
        };
        var defaultNumberingListDefinition = {
            listLevel0: { numberFormat: 'decimal',       levelStart: 1, leftIndent: 1270,     hangingIndent: 635, justification: 'left',  levelText: '%1.'},
            listLevel1: { numberFormat: 'lowerLetter',   levelStart: 1, leftIndent: 2 * 1270, hangingIndent: 635, justification: 'left',  levelText: '%2.'},
            listLevel2: { numberFormat: 'upperLetter',   levelStart: 1, leftIndent: 3 * 1270, hangingIndent: 635, justification: 'right', levelText: '%3.'},
            listLevel3: { numberFormat: 'lowerRoman',    levelStart: 1, leftIndent: 4 * 1270, hangingIndent: 635, justification: 'left',  levelText: '%4.'},
            listLevel4: { numberFormat: 'upperRoman',    levelStart: 1, leftIndent: 5 * 1270, hangingIndent: 635, justification: 'left',  levelText: '%5.'},
            listLevel5: { numberFormat: 'decimal',       levelStart: 1, leftIndent: 6 * 1270, hangingIndent: 635, justification: 'right', levelText: '%6.'},
            listLevel6: { numberFormat: 'lowerLetter',   levelStart: 1, leftIndent: 7 * 1270, hangingIndent: 635, justification: 'left',  levelText: '%7.'},
            listLevel7: { numberFormat: 'upperLetter',   levelStart: 1, leftIndent: 8 * 1270, hangingIndent: 635, justification: 'left',  levelText: '%8.'},
            listLevel8: { numberFormat: 'lowerRoman',    levelStart: 1, leftIndent: 9 * 1270, hangingIndent: 635, justification: 'right', levelText: '%9.'}
        };
        // base constructor ---------------------------------------------------

        Container.call(this, documentStyles);

        // methods ------------------------------------------------------------

        function isLevelEqual(defaultLevel, compareLevel) {
            var ret = defaultLevel !== undefined && compareLevel !== undefined &&
            defaultLevel.numberFormat === compareLevel.numberFormat &&
            defaultLevel.leftIndent === compareLevel.leftIndent &&
            defaultLevel.hangingIndent === compareLevel.hangingIndent &&
            defaultLevel.firstLineIndent === compareLevel.firstLineIndent &&
            defaultLevel.justification === compareLevel.justification &&
            defaultLevel.levelText === compareLevel.levelText &&
            defaultLevel.fontName === compareLevel.fontName;
            return ret;
        }
        function isDefinitionEqual(defaultDefinition, compareDefinition) {
            var ret = isLevelEqual(defaultDefinition.listLevel0, compareDefinition.listLevel0) &&
                    isLevelEqual(defaultDefinition.listLevel1, compareDefinition.listLevel1) &&
                    isLevelEqual(defaultDefinition.listLevel2, compareDefinition.listLevel2) &&
                    isLevelEqual(defaultDefinition.listLevel3, compareDefinition.listLevel3) &&
                    isLevelEqual(defaultDefinition.listLevel4, compareDefinition.listLevel4) &&
                    isLevelEqual(defaultDefinition.listLevel5, compareDefinition.listLevel5) &&
                    isLevelEqual(defaultDefinition.listLevel6, compareDefinition.listLevel6) &&
                    isLevelEqual(defaultDefinition.listLevel7, compareDefinition.listLevel7) &&
                    isLevelEqual(defaultDefinition.listLevel8, compareDefinition.listLevel8);

            return ret;
        }

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
            if (listDefinition) {
                list.listLevels[0] = listDefinition.listLevel0;
                list.listLevels[1] = listDefinition.listLevel1;
                list.listLevels[2] = listDefinition.listLevel2;
                list.listLevels[3] = listDefinition.listLevel3;
                list.listLevels[4] = listDefinition.listLevel4;
                list.listLevels[5] = listDefinition.listLevel5;
                list.listLevels[6] = listDefinition.listLevel6;
                list.listLevels[7] = listDefinition.listLevel7;
                list.listLevels[8] = listDefinition.listLevel8;
                if (listDefinition.defaultList) {
                    if (listDefinition.defaultList === 'bullet')
                        defaultBulletNumId = listIdentifier;
                    else
                        defaultNumberingNumId = listIdentifier;
                } else {
                    if (defaultBulletNumId === undefined) {
                        if (isDefinitionEqual(defaultBulletListDefinition, listDefinition) === true)
                            defaultBulletNumId = listIdentifier;
                    }
                    if (defaultNumberingNumId === undefined) {
                        if (isDefinitionEqual(defaultNumberingListDefinition, listDefinition) === true)
                            defaultNumberingNumId = listIdentifier;
                    }
                }
            }
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
         * @param {String} type
         *  either bullet or numbering
         * @returns {integer}
         *  the Id of a default bullet or numbered numbering. If this default numbering definition is not available then it will be created
         */
        this.getDefaultNumId = function (type) {
            return type === 'bullet' ? defaultBulletNumId : defaultNumberingNumId;
        };
        /**
         * @param {String} type
         *  either bullet or numbering
         * @returns {Object}
         *  the operation that creates the requested list
         *
         */
        this.getDefaultListOperation = function (type) {
            var freeId = 1;
            for (;;++freeId) {
                if (!(freeId in lists))
                    break;
            }
            var newOperation = { name: Operations.INSERT_LIST, listName: freeId };
            if (type === 'bullet') {
                newOperation.listDefinition = defaultBulletListDefinition;
            } else {
                newOperation.listDefinition = defaultNumberingListDefinition;
            }

            newOperation.listDefinition.defaultList = type;
            return newOperation;
        };
        /**
         *
         * @param {integer} numId
         *  id of a list
         * @param {String} type
         *  either bullet or numbering
         * @returns {bool}
         *  determines whether a supplied id is points to the default list of bullets or numberings
         *
         */
        this.isDefaultList = function (numId, type) {
            return (type === 'bullet' && defaultBulletNumId === numId) ||
                    (type === 'numbering' && defaultNumberingNumId === numId);
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
            ret.text = this.formatNumberType(levelIndexes === undefined ? 0 :
                    levelIndexes[ilvl] + (levelFormat.levelStart !== undefined ? levelFormat.levelStart - 1 : 0), numberFormat);
            ret.indent = levelFormat.leftIndent - (levelFormat.hangingIndent ? levelFormat.hangingIndent : 0);
            //+ levelFormat.firstLineIndent
            ret.labelWidth = (levelFormat.hangingIndent ? levelFormat.hangingIndent : 0);
            return ret;
        };

        this.formatNumberType = function (seqNo, numberFormat) {
            var retString = "???";
            switch (numberFormat) {
            case "decimal":
                retString = seqNo.toString();
                break;
            case "lowerLetter":
                retString = String.fromCharCode(96 + seqNo);
                break;
            case "upperLetter":
                retString = String.fromCharCode(64 + seqNo);
                break;
            case "lowerRoman":
                var romanSmall = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x' ];
                if (seqNo < 11)
                    retString = romanSmall[seqNo - 1];
                break;
            case "upperRoman":
                var romanCaps = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X' ];
                if (seqNo < 11)
                    retString = romanCaps[seqNo - 1];
                break;
            case "bullet":
                retString = "●";
                break;
            default:
            }
            if (numberFormat !== 'bullet')
                retString += '.';
            return retString;
        };

    } // class Lists

    // exports ================================================================

    // derive this class from class Container
    return Container.extend({ constructor: Lists });

});
