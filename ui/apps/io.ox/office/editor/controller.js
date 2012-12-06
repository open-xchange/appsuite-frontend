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

define('io.ox/office/editor/controller',
    ['io.ox/office/tk/controller',
     'io.ox/office/editor/image',
     'io.ox/office/editor/hyperlink',
     'io.ox/office/editor/format/drawingstyles',
     'io.ox/office/editor/format/paragraphstyles'
    ], function (Controller, Image, Hyperlink, DrawingStyles, ParagraphStyles) {

    'use strict';

    // class EditorController =================================================

    function EditorController(app) {

        var // self reference
            self = this,

            // the editor of the passed application
            editor = app.getEditor(),

            // all the little controller items
            items = {

                'document/hasfile': {
                    enable: function () { return app.getConnectionState() !== 'nofile'; }
                },
                'document/editable': {
                    parent: 'document/hasfile',
                    enable: function (enabled) { return enabled && editor.isEditMode(); }
                },
                'document/editable/text': {
                    parent: 'document/editable',
                    enable: function (enabled) { return enabled && editor.isTextSelected(); }
                },

                // document file

                'file/rename': {
                    parent: 'document/editable',
                    get: function () { return app.getFileName(); },
                    set: function (fileName) { app.rename(fileName); }
                },
                'file/editrights': {
                    parent: 'document/hasfile',
                    enable: function (enabled) { return enabled && !editor.isEditMode() && app.hasFileDescriptor(); },
                    set: function (state) { app.acquireEditRights(); }
                },
                'file/connection/state': {
                    get: function () { return app.getConnectionState(); }
                },

                // document contents

                'document/undo': {
                    parent: 'document/editable',
                    enable: function (enabled) { return enabled && editor.undoAvailable() > 0; },
                    set: function () { editor.undo(1); }
                },
                'document/redo': {
                    parent: 'document/editable',
                    enable: function (enabled) { return enabled && editor.redoAvailable() > 0; },
                    set: function () { editor.redo(1); }
                },
                'document/quicksearch': {
                    parent: 'document/hasfile', // enabled in read-only mode
                    //get: function () { return editor.hasHighlighting(); },
                    set: function (query) { editor.quickSearch(query); },
                    done: $.noop // do not focus editor
                },

                'document/cut': {
                    parent: 'document/editable',
                    enable: function (enabled) { return enabled && editor.hasSelectedRange(); },
                    set: function () { editor.cut(); }
                },
                'document/copy': {
                    parent: 'document/hasfile', // enabled in read-only mode
                    enable: function (enabled) { return enabled && editor.hasSelectedRange(); },
                    set: function () { editor.copy(); }
                },
                'document/paste': {
                    parent: 'document/editable',
                    enable: function (enabled) { return enabled && editor.hasInternalClipboard(); },
                    set: function () { editor.pasteInternalClipboard(); }
                },

                // paragraphs

                'paragraph/attributes': {
                    parent: 'document/editable/text',
                    get: function () { return editor.getAttributes('paragraph').paragraph || {}; }
                },
                'paragraph/stylesheet': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) { return attributes.style; },
                    set: function (styleId) { editor.setAttribute('paragraph', 'style', styleId, { clear: true }); }
                },
                'paragraph/alignment': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) { return attributes.alignment; },
                    set: function (alignment) { editor.setAttribute('paragraph', 'alignment', alignment); }
                },
                'paragraph/lineheight': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) { return attributes.lineHeight; },
                    set: function (lineHeight) { editor.setAttribute('paragraph', 'lineHeight', lineHeight); }
                },
                'paragraph/fillcolor': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) { return attributes.fillColor; },
                    set: function (color) { editor.setAttribute('paragraph', 'fillColor', color); }
                },
                'paragraph/list/indent': {
                    parent: 'paragraph/attributes',
                    enable: function (enabled) { var indent = this.get(); return enabled && _.isNumber(indent) && (0 <= indent) && (indent <= 8); },
                    get: function (attributes) { return attributes.indentLevel; },
                    set: function (indent) { editor.setAttribute('paragraph', 'indentLevel', indent); }
                },
                'paragraph/list/incindent': {
                    parent: 'paragraph/list/indent',
                    enable: function (enabled) { return enabled && (this.get() < 8); },
                    set: function () {
                        var indent = this.get();
                        if (indent < 8) {
                            editor.setAttribute('paragraph', 'indentLevel', indent + 1);
                        }
                    }
                },
                'paragraph/list/decindent': {
                    parent: 'paragraph/list/indent',
                    enable: function (enabled) { return enabled && (this.get() > 0); },
                    set: function () {
                        var indent = this.get();
                        if (indent > 0) {
                            editor.setAttribute('paragraph', 'indentLevel', indent - 1);
                        }
                    }
                },

                'paragraph/list/bullets': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) {
                        return (attributes.indentLevel > -1) && editor.getLists().isDefaultList(attributes.numId, 'bullet');
                    },
                    set: function (mode) {
                        if (mode) {
                            editor.createDefaultList('bullet');
                        } else {
                            editor.setAttributes('paragraph', { paragraph: { numId: -1, indentLevel: -1 } });
                        }
                    }
                },
                'paragraph/list/numbering': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) {
                        return (attributes.indentLevel > -1) && editor.getLists().isDefaultList(attributes.numId, 'numbering');
                    },
                    set: function (mode) {
                        if (mode) {
                            editor.createDefaultList('numbering');
                        } else {
                            editor.setAttributes('paragraph', { paragraph: { numId: -1, indentLevel: -1 } });
                        }
                    }
                },
                'paragraph/borders': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) { return ParagraphStyles.getBorderModeFromAttributes(attributes); },
                    set: function (borderMode) { editor.setAttributes('paragraph', { paragraph: ParagraphStyles.getAttributesFromBorderMode(borderMode) }); }
                },

                // characters

                'character/attributes': {
                    parent: 'document/editable/text',
                    get: function () { return editor.getAttributes('character').character || {}; }
                },
                'character/stylesheet': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.style; },
                    set: function (styleId) { editor.setAttribute('character', 'style', styleId, { clear: true }); }
                },
                'character/fontname': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.fontName; },
                    set: function (fontName) { editor.setAttribute('character', 'fontName', fontName); }
                },
                'character/fontsize': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.fontSize; },
                    set: function (fontSize) { editor.setAttribute('character', 'fontSize', fontSize); }
                },
                'character/bold': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.bold; },
                    set: function (state) { editor.setAttribute('character', 'bold', state); }
                },
                'character/italic': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.italic; },
                    set: function (state) { editor.setAttribute('character', 'italic', state); }
                },
                'character/underline': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.underline; },
                    set: function (state) { editor.setAttribute('character', 'underline', state); }
                },
                'character/strike': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.strike !== 'none'; },
                    set: function (state) { editor.setAttribute('character', 'strike', state ? 'single' : 'none'); }
                },
                'character/vertalign': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.vertAlign; },
                    set: function (align) { editor.setAttribute('character', 'vertAlign', align); }
                },
                'character/color': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.color; },
                    set: function (color) { editor.setAttribute('character', 'color', color); }
                },
                'character/fillcolor': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.fillColor; },
                    set: function (color) { editor.setAttribute('character', 'fillColor', color); }
                },
                'character/language': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.language; },
                    set: function (language) { editor.setAttribute('character', 'language', language); }
                },
                'character/hyperlink': {
                    parent: 'character/attributes',
                    enable: function (enabled) { return enabled && editor.selectionEnclosingParagraph(); },
                    get: function (attributes) { return attributes.url; },
                    set: function () { editor.insertHyperlink(); },
                    done: $.noop
                },

                // tables

                'table/insert': {
                    parent: 'document/editable/text',
                    set: function (size) { editor.insertTable(size); }
                },

                'document/editable/table': {
                    parent: 'document/editable/text',
                    enable: function (enabled) { return enabled && editor.isPositionInTable(); }
                },
                'table/insert/row': {
                    parent: 'document/editable/table',
                    set: function () { editor.insertRow(); }
                },
                'table/insert/column': {
                    parent: 'document/editable/table',
                    set: function () { editor.insertColumn(); }
                },
                'table/delete/row': {
                    parent: 'document/editable/table',
                    set: function () { editor.deleteRows(); }
                },
                'table/delete/column': {
                    parent: 'document/editable/table',
                    set: function () { editor.deleteColumns(); }
                },

                'table/attributes': {
                    parent: 'document/editable/table',
                    get: function () { return editor.getAttributes('table').table || {}; }
                },
                'table/stylesheet': {
                    parent: 'table/attributes',
                    get: function (attributes) { return attributes.style; },
                    set: function (styleId) { editor.setAttribute('table', 'style', styleId, { clear: true }); }
                },

                // drawing

                'document/editable/drawing': {
                    parent: 'document/editable',
                    enable: function (enabled) { return enabled && editor.isDrawingSelected(); }
                },
                'drawing/delete': {
                    parent: 'document/editable/drawing',
                    set: function () { editor.deleteSelected(); }
                },

                'drawing/attributes': {
                    parent: 'document/editable/drawing',
                    get: function () { return editor.getAttributes('drawing').drawing || {}; }
                },
                'drawing/floatmode': {
                    parent: 'drawing/attributes',
                    get: function (attributes) { return DrawingStyles.getFloatModeFromAttributes(attributes); },
                    set: function (floatMode) { editor.setAttributes('drawing', { drawing: DrawingStyles.getAttributesFromFloatMode(floatMode) }); }
                },

                // images

                'image/insert/file': {
                    parent: 'document/editable/text',
                    set: function () { Image.insertFileDialog(app); }
                },
                'image/insert/url': {
                    parent: 'document/editable/text',
                    set: function () { Image.insertURLDialog(app); },
                    done: $.noop
                },

                // debug

                'debug/toggle': {
                    get: function () { return app.isDebugMode(); },
                    set: function (state) { app.setDebugMode(state); }
                },
                'debug/sync': {
                    parent: 'document/hasfile', // disable if no file exists
                    get: function () { return app.isSynchronizedMode(); },
                    set: function (state) { app.setSynchronizedMode(state); }
                }

            };

        // private methods ----------------------------------------------------

        /**
         * The controller done handler that will be executed after an item
         * setter function (of items without own done handler), and after a
         * view component triggers a 'cancel' event.
         */
        function doneHandler() {
            editor.grabFocus();
        }

        // base constructor ---------------------------------------------------

        Controller.call(this, items, doneHandler);

        // methods ------------------------------------------------------------

        /**
         * Set the editor to write protected mode which prevents changes
         * to the loaded document.
         */
        this.setWriteProtected = function () {
            editor.setWriteProtected();
        };

        /**
         * Changes the read-only mode at the editor and updates all controller
         * items.
         */
        this.setEditMode = function (state) {
            if (state !== editor.isEditMode()) {
                editor.setEditMode(state);
                this.update();
            }
        };

        /**
         * Sets the name of the user that currently has the edit rigths
         */
        this.setEditUser = function (user) {
            if (user !== editor.getEditUser()) {
                editor.setEditUser(user);
            }
        };

        // initialization -----------------------------------------------------

        // update GUI after operations or changed selection
        editor.on('operation selection', function () { self.update(); });

    } // class EditorController

    // exports ================================================================

    // derive this class from class Controller
    return Controller.extend({ constructor: EditorController });

});
