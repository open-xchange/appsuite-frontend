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
            listLevel0: { justification: 'left', indentLeft: 1270,     numberFormat: 'bullet', levelStart: 1, fontName: 'Symbol', levelText: '', indentFirstLine: -635 },
            listLevel1: { justification: 'left', indentLeft: 2 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Courier New', levelText: 'o',  indentFirstLine: -635 },
            listLevel2: { justification: 'left', indentLeft: 3 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Wingdings', levelText: '', indentFirstLine: -635 },
            listLevel3: { justification: 'left', indentLeft: 4 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Symbol', levelText: '', indentFirstLine: -635 },
            listLevel4: { justification: 'left', indentLeft: 5 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Courier New', levelText: 'o', indentFirstLine: -635 },
            listLevel5: { justification: 'left', indentLeft: 6 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Wingdings', levelText: '', indentFirstLine: -635 },
            listLevel6: { justification: 'left', indentLeft: 7 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Symbol', levelText: '', indentFirstLine: -635 },
            listLevel7: { justification: 'left', indentLeft: 8 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Courier New', levelText: 'o',  indentFirstLine: -635 },
            listLevel8: { justification: 'left', indentLeft: 9 * 1270, numberFormat: 'bullet', levelStart: 1, fontName: 'Wingdings', levelText: '', indentFirstLine: -635 }
        };
        // O 2010 uses: decimal-lowerLetter-lowerRomen-decimal-lowerLetter-lowerRomen-decimal-lowerLetter-lowerRomen-
        var defaultNumberingListDefinition = {
            listLevel0: { numberFormat: 'decimal',       levelStart: 1, indentLeft: 1270,     indentFirstLine: -635, justification: 'left',  levelText: '%1.'},
            listLevel1: { numberFormat: 'lowerLetter',   levelStart: 1, indentLeft: 2 * 1270, indentFirstLine: -635, justification: 'left',  levelText: '%2.'},
            listLevel2: { numberFormat: 'upperLetter',   levelStart: 1, indentLeft: 3 * 1270, indentFirstLine: -635, justification: 'right', levelText: '%3.'},
            listLevel3: { numberFormat: 'lowerRoman',    levelStart: 1, indentLeft: 4 * 1270, indentFirstLine: -635, justification: 'left',  levelText: '%4.'},
            listLevel4: { numberFormat: 'upperRoman',    levelStart: 1, indentLeft: 5 * 1270, indentFirstLine: -635, justification: 'left',  levelText: '%5.'},
            listLevel5: { numberFormat: 'decimal',       levelStart: 1, indentLeft: 6 * 1270, indentFirstLine: -635, justification: 'right', levelText: '%6.'},
            listLevel6: { numberFormat: 'lowerLetter',   levelStart: 1, indentLeft: 7 * 1270, indentFirstLine: -635, justification: 'left',  levelText: '%7.'},
            listLevel7: { numberFormat: 'upperLetter',   levelStart: 1, indentLeft: 8 * 1270, indentFirstLine: -635, justification: 'left',  levelText: '%8.'},
            listLevel8: { numberFormat: 'lowerRoman',    levelStart: 1, indentLeft: 9 * 1270, indentFirstLine: -635, justification: 'right', levelText: '%9.'}
        };
        // base constructor ---------------------------------------------------

        Container.call(this, documentStyles);

        // methods ------------------------------------------------------------

        function isLevelEqual(defaultLevel, compareLevel) {
            var ret = defaultLevel !== undefined && compareLevel !== undefined &&
            defaultLevel.numberFormat === compareLevel.numberFormat &&
            defaultLevel.indentLeft === compareLevel.indentLeft &&
            defaultLevel.indentFirstLine === compareLevel.indentFirstLine &&
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

        function convertToRoman(value, caps) {
            var result = '';
            var romanCapsArr = ['M', 'D', 'C', 'L', 'X', 'V', 'I'];
            var romanSmallArr = ['m', 'd', 'c', 'l', 'x', 'v', 'i'];
            var romanValArr = [1000, 500, 100,  50,  10,   5,   1];
            if (value > 0) {
                var index = 0;
                for (;index < 7; index++) {
                    while (value >= romanValArr[index]) {
                        result += caps ? romanCapsArr[index] : romanSmallArr[index];
                        value -= romanValArr[index];
                    }
                    var position = 7;
                    for (; position > index; position--) {
                        var tempVal = romanValArr[index] - romanValArr[position];
                        if ((romanValArr[position] < tempVal) && (tempVal <= value))
                        {
                            if (caps)
                                result += romanCapsArr[position] + romanCapsArr[index];
                            else
                                result += romanSmallArr[position] + romanSmallArr[index];
                            value -= tempVal;
                        }
                    }
                }
            }
            return result;
        }
        function parseRoman(text) {
            var romanSmallArr = ['m', 'd', 'c', 'l', 'x', 'v', 'i'],
            romanValArr = [1000, 500, 100,  50,  10,   5,   1],
            ret = {},
            lowerText = text.toLowerCase(),
            startValue = 0;
            ret.caps = lowerText !== text;
            var index = 0, lastValue = 1000;
            for (; index < text.length; ++index) {
                var char = lowerText.charAt(index);
                if (char === '.')
                    break;
                var position = $.inArray(char, romanSmallArr);
                if (position < 0)
                    return {};
                var value = romanValArr[position];
                if (lastValue < value) {
                    startValue = startValue - lastValue + (value - lastValue);
                } else {
                    startValue += value;
                }
                lastValue = value;
            }
            if (startValue > 0) {
                ret.startnumber = startValue;
                ret.numberFormat = lowerText !== text ? 'upperRoman' : 'lowerRoman';
            }
            return ret;
        }
        /**
         * Creates the label text of the current numbered paragraph.
         * For picture numbered bullet list it returns the URI of the picture
         *
         * @param levelIndexes array of indexes of all numbering levels
         * @param ilvl current indentation level
         * @param listDefinition properties of the list used
         * @returns {Object}
         *  text element contains label text
         *  imgsrc element contains URI of the picture used
         *
         *  In case imgsrc is set then text will be empty
         */
        function formatNumberType(levelIndexes, ilvl, listDefinition) {
            var ret = {};
            var topLevelformat = listDefinition.listLevels[ilvl];
            var levelText = topLevelformat.levelText ? topLevelformat.levelText : '';
            ret.suff = listDefinition.listLevels[ilvl].suff;
            ret.tabpos = listDefinition.listLevels[ilvl].tabpos;
            for (;ilvl >= 0; --ilvl) {
                var levelFormat = listDefinition.listLevels[ilvl];
                var seqNo = levelIndexes === undefined ? 0 :
                    levelIndexes[ilvl] + (levelFormat && levelFormat.levelStart !== undefined ? levelFormat.levelStart - 1 : 0);
                var levelToken = '%' + (ilvl + 1);
                var indexpos = levelText.indexOf(levelToken);
                if (indexpos < 0 && levelFormat.numberFormat !== 'bullet')
                    continue;
                var replacetext = '';
                switch (levelFormat.numberFormat) {
                case "decimal":
                    replacetext = seqNo.toString();
                    break;
                case "lowerLetter":
                    replacetext = String.fromCharCode(96 + seqNo);
                    break;
                case "upperLetter":
                    replacetext = String.fromCharCode(64 + seqNo);
                    break;
                case "lowerRoman":
                case "upperRoman":
                    replacetext = convertToRoman(seqNo, levelFormat.numberFormat === "upperRoman");
                    break;
                case "bullet":
                    if (levelFormat.levelPicBulletUri) {
                        ret.imgsrc = levelFormat.levelPicBulletUri;
                        replacetext = '';
                    }
                    else {
                        var charCode = levelFormat.levelText ? levelFormat.levelText.charCodeAt(0) : -1;
                        if (charCode > 0 && (charCode < 0xE000 || charCode > 0xF8FF)) {
                            replacetext = levelFormat.levelText;
                        }
                        else
                            replacetext = "●";
                    }
                    break;
                case "none":
                    replacetext = '';
                    break;
                default:
                }
                if (levelFormat.levelPicBulletUri) {
                    levelText = '';
                    break;
                }
                else if (levelFormat.numberFormat === 'bullet') {
                    levelText = replacetext;
                    ret.color = levelFormat.color;
                    break;
                }
                else
                    levelText = levelText.replace(levelToken, replacetext);
            }
            ret.text = levelText;
            return ret;
        }
        // exports ================================================================

        /**
         * Adds a new list to this container. An existing list definition
         * with the specified identifier will be replaced.
         *
         * @param {String} listIdentifier
         *  The name of of the new list definition.
         *
         * @param {Object} listDefinition
         *  The attributes of the list definition.
         *
         * @returns {Lists}
         *  A reference to this instance.
         */
        this.addList = function (listIdentifier, listDefinition) {

            var newPosition = lists.length;
            lists[newPosition] = {};
            var list = lists[newPosition];
            list.listIdentifier = listIdentifier;
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
                if (listDefinition.defaultlist) {
                    if (listDefinition.defaultlist === 'bullet')
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
         * Remove an existing list
         *
         * @param {String} listIdentifier
         *  The name of of the list to be removed.
         *
         * @returns {Lists}
         *  A reference to this instance.
         */
        this.deleteList = function (listIdentifier) {
            var index = 0;
            for (; index < lists.length; ++index)
                if (lists[index].listIdentifier === listIdentifier) {
                    lists.splice(index, 1);
                    if (defaultNumberingNumId === listIdentifier)
                        defaultNumberingNumId = undefined;
                    if (defaultBulletNumId === listIdentifier)
                        defaultBulletNumId = undefined;
                    break;
                }
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
            var index = 0,
                ret;
            for (; index < lists.length; ++index)
                if (lists[index].listIdentifier === name) {
                    ret = lists[index];
                    break;
                }
            return ret;
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
         * @param {Object} options
         *  can contain symbol - the bullet symbol
         *              levelStart - start index of an ordered list
         * @returns {Object}
         *  the operation that creates the requested list
         *
         */
        this.getDefaultListOperation = function (type, options) {
            var index = 0,
                freeId = lists.length + 1;
            for (; index < lists.length; ++index) {
                if (lists[index].listIdentifier >= freeId) {
                    freeId = lists[index].listIdentifier + 1;
                }
            }
            var newOperation = { name: Operations.INSERT_LIST, listname: freeId };
            if (type === 'bullet') {
                newOperation.listDefinition = _.copy(defaultBulletListDefinition, true);
                if (options && options.symbol && options.symbol !== '*') {
                    newOperation.listDefinition.listLevel0.levelText = options.symbol;
                } else {
                    newOperation.listDefinition.defaultlist = type;
                }
            } else {
                newOperation.listDefinition = _.copy(defaultNumberingListDefinition, true);
                var defaultlist = true;
                if (options) {
                    if (options.levelStart) {
                        newOperation.listDefinition.listLevel0.levelStart = options.levelStart;
                        defaultlist = false;
                    }
                    if (options.numberFormat) {
                        newOperation.listDefinition.listLevel0.numberFormat = options.numberFormat;
                        defaultlist = false;
                    }
                }
                if (defaultlist) {
                    newOperation.listDefinition.defaultlist = type;
                }
            }
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
         * @returns {Object} containing:
         *          indent
         *          labelwidth
         *          text
         *          tbd.
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
            var format = formatNumberType(levelIndexes, ilvl, currentList);
            _.extend(ret, format);
            ret.indent = levelFormat.indentLeft;
            ret.firstLine = levelFormat.indentFirstLine ? levelFormat.indentLeft + levelFormat.indentFirstLine : levelFormat.indentLeft;
            return ret;
        };

        /**
         * @param text possible numbering label text
         *
         * @returns {integer} listId
         *
         */
        this.detectListSymbol = function (text) {
            var ret = {};
            if (text.length === 1 && (text === '-' || text === '*')) {
                // bullet
                ret.numberFormat = 'bullet';
                ret.symbol = text;
            } else if (text.substring(text.length - 1) === '.') {
                var sub = text.substring(0, text.length - 1);
                var startnumber = parseInt(sub, 10);
                if (startnumber > 0) {
                    ret.numberFormat = 'decimal';
                    ret.levelStart = startnumber;
                } else {
                    var roman = parseRoman(text);
                    if (roman.startnumber > 0) {
                        ret.numberFormat = roman.numberFormat;
                        ret.levelStart = roman.startnumber;
                    }
                }
            }
            return ret;
        };
        this.findIlvl = function (numId, paraStyle) {
            var list = this.getList(numId);
            if (list === undefined) {
                return -1;
            }
            var ilvl = 0;
            for (; ilvl < 9; ++ilvl) {
                var levelFormat = list.listLevels[ilvl];
                if (levelFormat.paraStyle === paraStyle)
                    return ilvl;
            }
            return -1;
        };
        this.findPrevNextStyle = function (numId, pstyle, prev) {
            var list = this.getList(numId);
            if (list === undefined) {
                return '';
            }
            var ilvl = 0;
            for (; ilvl < 9; ++ilvl) {
                var levelFormat = list.listlevels[ilvl];
                if (levelFormat.pstyle === pstyle) {
                    var ret = '';
                    if (prev) {
                        if (ilvl > 0 && list.listlevels[ilvl - 1].pstyle)
                            ret = list.listlevels[ilvl - 1].pstyle;
                    } else if (ilvl < 8 && list.listlevels[ilvl + 1].pstyle) {
                        ret = list.listlevels[ilvl + 1].pstyle;
                    }
                    return ret;
                }
            }
            return -1;
        };

    } // class Lists

    // derive this class from class Container
    return Container.extend({ constructor: Lists });

});
