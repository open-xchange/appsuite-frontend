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
     'io.ox/office/editor/format/objectstyles'
    ], function (BaseController, Image, ObjectStyles) {

    'use strict';

    // class Controller =======================================================

    function Controller(app) {

        var // self reference
            self = this,

            // the editor of the passed application
            editor = app.getEditor(),

            // all the little controller items
            items = {

                'document/editable': {
                    enable: function () { return editor.isEditMode(); }
                },
                'document/editable/text': {
                    parent: 'document/editable',
                    enable: function (enabled) { return enabled && editor.isTextSelected(); }
                },

                // document file

                'file/download': {
                    set: function () { app.download(); }
                },
                'file/print': {
                    set: function () { app.print(); }
                },
                'file/export': {
                    set: function () { app.save(); }
                },
                'file/flush': {
                    set: function () { app.flush(); }
                },
                'file/rename': {
                    parent: 'document/editable',
                    get: function () { return app.getFileName(); },
                    set: function (fileName) { app.rename(fileName); }
                },
                'file/editrights': {
                    enable: function () { return !editor.isEditMode() && app.hasFileDescriptor(); },
                    set: function (state) { app.acquireEditRights(); }
                },
                'file/quit': {
                    set: function () { window.setTimeout(function () { app.quit(); }); }
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
                    //get: function () { return editor.hasHighlighting(); },
                    set: function (query) { editor.quickSearch(query); },
                    done: $.noop // do not focus editor
                },
                'document/cut': {
                    enable: function () { return editor.hasSelectedRange(); },
                    set: function () { editor.cut(); }
                },
                'document/copy': {
                    enable: function () { return editor.hasSelectedRange(); },
                    set: function () { editor.copy(); }
                },
                'document/paste': {
                    enable: function () { return editor.hasInternalClipboard(); },
                    set: function () { editor.pasteInternalClipboard(); }
                },

                // paragraphs

                'paragraph/attributes': {
                    parent: 'document/editable/text',
                    get: function () { return editor.getAttributes('paragraph'); }
                },
                'paragraph/stylesheet': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) { return attributes.style; },
                    set: function (styleId) { editor.setAttribute('paragraph', 'style', styleId); }
                },
                'paragraph/alignment': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) { return attributes.alignment; },
                    set: function (alignment) { editor.setAttribute('paragraph', 'alignment', alignment); }
                },
                'paragraph/lineheight': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) { return attributes.lineheight; },
                    set: function (lineHeight) { editor.setAttribute('paragraph', 'lineheight', lineHeight); }
                },
                'paragraph/fillcolor': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) { return attributes.fillcolor; },
                    set: function (color) { editor.setAttribute('paragraph', 'fillcolor', color); }
                },

                'paragraph/list/bullets': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) {
                        return (attributes.ilvl !== -1) && editor.getLists().isDefaultList(attributes.numId, 'bullet');
                    },
                    set: function (mode) {
                        if (mode) {
                            editor.createDefaultList('bullet');
                        } else {
                            editor.setAttributes('paragraph', { numId: -1, ilvl: -1 });
                        }
                    }
                },
                'paragraph/list/numbering': {
                    parent: 'paragraph/attributes',
                    get: function (attributes) {
                        return (attributes.ilvl !== -1) && editor.getLists().isDefaultList(attributes.numId, 'numbering');
                    },
                    set: function (mode) {
                        if (mode) {
                            editor.createDefaultList('numbering');
                        } else {
                            editor.setAttributes('paragraph', { numId: -1, ilvl: -1 });
                        }
                    }
                },
                'paragraph/list/incindent': {
                    parent: 'paragraph/attributes',
                    enable: function (enabled) { return enabled && this.ilvl !== null && this.ilvl !== -1 && this.ilvl < 8; },
                    get: function (attributes) {
                        this.ilvl = attributes.ilvl;
                    },
                    set: function () {
                        if (this.ilvl < 8) {
                            editor.setAttribute('paragraph', 'ilvl', this.ilvl + 1);
                        }
                    }
                },
                'paragraph/list/decindent': {
                    parent: 'paragraph/attributes',
                    enable: function (enabled) { return enabled && this.ilvl !== null && this.ilvl !== -1 && this.ilvl > 0; },
                    get: function (attributes) {
                        this.ilvl = attributes.ilvl;
                    },
                    set: function () {
                        if (this.ilvl > 0) {
                            editor.setAttribute('paragraph', 'ilvl', this.ilvl - 1);
                        }
                    }
                },

                // characters

                'character/attributes': {
                    parent: 'document/editable/text',
                    get: function () { return editor.getAttributes('character'); }
                },
                'character/stylesheet': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.style; },
                    set: function (styleId) { editor.setAttribute('character', 'style', styleId); }
                },
                'character/fontname': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.fontname; },
                    set: function (fontName) { editor.setAttribute('character', 'fontname', fontName); }
                },
                'character/fontsize': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.fontsize; },
                    set: function (fontSize) { editor.setAttribute('character', 'fontsize', fontSize); }
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
                'character/color': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.color; },
                    set: function (color) { editor.setAttribute('character', 'color', color); }
                },
                'character/fillcolor': {
                    parent: 'character/attributes',
                    get: function (attributes) { return attributes.fillcolor; },
                    set: function (color) { editor.setAttribute('character', 'fillcolor', color); }
                },
                'character/tab' : {
                    parent: 'character/attributes',
                    set: function () { editor.insertTab(); }
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
                    get: function () { return editor.getAttributes('table'); }
                },

                // images

                'image/insert/file': {
                    parent: 'document/editable/text',
                    set: function () { Image.insertFileDialog(app); }
                },
                'image/insert/url': {
                    parent: 'document/editable/text',
                    set: function () { Image.insertURLDialog(app); }
                },

                'document/editable/image': {
                    parent: 'document/editable',
                    enable: function (enabled) { return enabled && editor.isImageSelected(); }
                },
                'image/delete': {
                    parent: 'document/editable/image',
                    set: function () { editor.deleteSelected(); }
                },

                'image/attributes': {
                    parent: 'document/editable/image',
                    get: function () { return editor.getAttributes('image'); }
                },
                'image/floatmode': {
                    parent: 'image/attributes',
                    // TODO: enable this when object selection works correctly
                    // get: function (attributes) { return ObjectStyles.getFloatModeFromAttributes(attributes); },
                    get: function () { return editor.getImageFloatMode(); },
                    set: function (floatMode) { editor.setAttributes('image', ObjectStyles.getAttributesFromFloatMode(floatMode)); }
                },

                // debug

                'debug/toggle': {
                    get: function () { return app.isDebugMode(); },
                    set: function (state) { app.setDebugMode(state); }
                },
                'debug/sync': {
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

        BaseController.call(this, items, doneHandler);

        // methods ------------------------------------------------------------

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

    } // class Controller

    // exports ================================================================

    // derive this class from class BaseController
    return BaseController.extend({ constructor: Controller });

});
