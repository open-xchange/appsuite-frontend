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

define('io.ox/office/editor/operations', [], function () {

    'use strict';

    // class Operations ======================================================

    /**
     * The class Operations is used to define some global public constants.
     */
    var Operations = {};

    Operations.OP_DELETE = 'delete';
    Operations.OP_MOVE = 'move';

    Operations.OP_TEXT_INSERT = 'insertText';
    Operations.OP_TEXT_DELETE = 'deleteText';

    Operations.OP_PARA_INSERT = 'insertParagraph';
    Operations.OP_PARA_DELETE = 'deleteParagraph';
    Operations.OP_PARA_SPLIT = 'splitParagraph';
    Operations.OP_PARA_MERGE = 'mergeParagraph';

    Operations.OP_TABLE_INSERT = 'insertTable';
    Operations.OP_TABLE_DELETE = 'deleteTable';
    Operations.OP_CELLRANGE_DELETE = 'deleteCellRange';
    Operations.OP_ROWS_DELETE = 'deleteRows';
    Operations.OP_COLUMNS_DELETE = 'deleteColumns';
    Operations.OP_ROW_COPY = 'copyRow';
    Operations.OP_COLUMN_COPY = 'copyColumn';
    Operations.OP_ROW_INSERT = 'insertRow';
    Operations.OP_COLUMN_INSERT = 'insertColumn';
    Operations.OP_CELL_INSERT = 'insertCell';

    Operations.OP_INSERT_STYLE = 'insertStylesheet';
    Operations.OP_ATTRS_SET = 'setAttributes';

    Operations.OP_IMAGE_INSERT = 'insertImage';
    Operations.OP_FIELD_INSERT = 'insertField';
    // this.OP_ATTR_DELETE =  'deleteAttribute';

    return Operations;

});
