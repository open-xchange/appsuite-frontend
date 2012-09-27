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
    var Operations = {

        OP_DELETE: 'delete',
        OP_MOVE: 'move',

        OP_TEXT_INSERT: 'insertText',
        OP_TEXT_DELETE: 'deleteText',

        OP_PARA_INSERT: 'insertParagraph',
        OP_PARA_DELETE: 'deleteParagraph',
        OP_PARA_SPLIT: 'splitParagraph',
        OP_PARA_MERGE: 'mergeParagraph',

        OP_TABLE_INSERT: 'insertTable',
        OP_TABLE_DELETE: 'deleteTable',
        OP_CELLRANGE_DELETE: 'deleteCellRange',
        OP_ROWS_DELETE: 'deleteRows',
        OP_COLUMNS_DELETE: 'deleteColumns',
        OP_CELLS_DELETE: 'deleteCells',
        OP_ROW_COPY: 'copyRow',
        OP_COLUMN_COPY: 'copyColumn',
        OP_ROW_INSERT: 'insertRow',
        OP_COLUMN_INSERT: 'insertColumn',
        OP_CELL_INSERT: 'insertCell',

        OP_INSERT_STYLE: 'insertStylesheet',
        OP_ATTRS_SET: 'setAttributes',

        OP_IMAGE_INSERT: 'insertImage',
        OP_FIELD_INSERT: 'insertField'
        // OP_ATTR_DELETE:  'deleteAttribute'

    };

    return Operations;
});
