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
     'io.ox/office/editor/format/imagestyles'
    ], function (BaseController, Image, ImageStyles) {

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
                    chain: 'document/editable',
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
                    chain: 'document/editable',
                    get: function () { return app.getFileName(); },
                    set: function (fileName) { app.rename(fileName); }
                },

                // document contents

                'document/undo': {
                    chain: 'document/editable',
                    enable: function (enabled) { return enabled && editor.undoAvailable() > 0; },
                    get: function () { return editor.undoAvailable(); },
                    set: function (count) { editor.undo(count); }
                },
                'document/redo': {
                    chain: 'document/editable',
                    enable: function (enabled) { return enabled && editor.redoAvailable() > 0; },
                    get: function () { return editor.redoAvailable(); },
                    set: function (count) { editor.redo(count); }
                },
                'document/quicksearch': {
                    get: function () { return editor.hasHighlighting(); },
                    set: function (query) { editor.quickSearch(query); },
                    done: $.noop // do not focus editor
                },

                // paragraphs

                'paragraph/attributes': {
                    chain: 'document/editable/text',
                    get: function () { return editor.getAttributes('paragraph'); }
                },
                'paragraph/stylesheet': {
                    chain: 'paragraph/attributes',
                    get: function (attributes) { return attributes.style; },
                    set: function (styleId) { editor.setAttribute('paragraph', 'style', styleId); }
                },
                'paragraph/alignment': {
                    chain: 'paragraph/attributes',
                    get: function (attributes) { return attributes.alignment; },
                    set: function (alignment) { editor.setAttribute('paragraph', 'alignment', alignment); }
                },
                'paragraph/lineheight': {
                    chain: 'paragraph/attributes',
                    get: function (attributes) { return attributes.lineheight; },
                    set: function (lineHeight) { editor.setAttribute('paragraph', 'lineheight', lineHeight); }
                },
                'paragraph/fillcolor': {
                    chain: 'paragraph/attributes',
                    get: function (attributes) { return attributes.parafill && attributes.parafill.rgbColor; },
                    set: function (fill) {
                        if (fill.themeFill) {
                            var themes = editor.getThemes();
                            if (themes) {
                                var theme = themes.getTheme();
                                if (theme)
                                    fill.rgbColor = theme[fill.themeFill];
                            }
                        }
                        editor.setAttribute('paragraph', 'parafill', fill);
                    }
                },

                // characters

                'character/attributes': {
                    chain: 'document/editable/text',
                    get: function () { return editor.getAttributes('character'); }
                },
                'character/stylesheet': {
                    chain: 'character/attributes',
                    get: function (attributes) { return attributes.style; },
                    set: function (styleId) { editor.setAttribute('character', 'style', styleId); }
                },
                'character/fontname': {
                    chain: 'character/attributes',
                    get: function (attributes) { return attributes.fontname; },
                    set: function (fontName) { editor.setAttribute('character', 'fontname', fontName); }
                },
                'character/fontsize': {
                    chain: 'character/attributes',
                    get: function (attributes) { return attributes.fontsize; },
                    set: function (fontSize) { editor.setAttribute('character', 'fontsize', fontSize); }
                },
                'character/bold': {
                    chain: 'character/attributes',
                    get: function (attributes) { return attributes.bold; },
                    set: function (state) { editor.setAttribute('character', 'bold', state); }
                },
                'character/italic': {
                    chain: 'character/attributes',
                    get: function (attributes) { return attributes.italic; },
                    set: function (state) { editor.setAttribute('character', 'italic', state); }
                },
                'character/underline': {
                    chain: 'character/attributes',
                    get: function (attributes) { return attributes.underline; },
                    set: function (state) { editor.setAttribute('character', 'underline', state); }
                },
                'character/color': {
                    chain: 'character/attributes',
                    get: function (attributes) { return attributes.color; },
                    set: function (state) {
                        if (state.themeFill) {
                            var themes = editor.getThemes();
                            if (themes) {
                                var theme = themes.getTheme();
                                if (theme)
                                    state.rgbColor = theme[state.themeFill];
                            }
                        }
                        editor.setAttribute('character', 'color', state);
                    }
                },

                // tables

                'table/insert': {
                    chain: 'document/editable/text',
                    set: function (size) { editor.insertTable(size); }
                },

                'document/editable/table': {
                    chain: 'document/editable/text',
                    enable: function (enabled) { return enabled && editor.isPositionInTable(); }
                },
                'table/insert/row': {
                    chain: 'document/editable/table',
                    set: function () { editor.insertRow(); }
                },
                'table/insert/column': {
                    chain: 'document/editable/table',
                    set: function () { editor.insertColumn(); }
                },
                'table/delete/row': {
                    chain: 'document/editable/table',
                    set: function () { editor.deleteRows(); }
                },
                'table/delete/column': {
                    chain: 'document/editable/table',
                    set: function () { editor.deleteColumns(); }
                },

                'table/attributes': {
                    chain: 'document/editable/table',
                    get: function () { return editor.getAttributes('table'); }
                },

                // images

                'image/insert/file': {
                    chain: 'document/editable/text',
                    set: function () { Image.insertFileDialog(app); }
                },
                'image/insert/url': {
                    chain: 'document/editable/text',
                    set: function () { Image.insertURLDialog(app); }
                },

                'document/editable/image': {
                    chain: 'document/editable',
                    enable: function (enabled) { return enabled && editor.isImageSelected(); }
                },
                'image/delete': {
                    chain: 'document/editable/image',
                    set: function () { editor.deleteSelected(); }
                },

                'image/attributes': {
                    chain: 'document/editable/image',
                    get: function () { return editor.getAttributes('image'); }
                },
                'image/floatmode': {
                    chain: 'image/attributes',
                    // TODO: enable this when image selection works correctly
                    // get: function (attributes) { return ImageStyles.getFloatModeFromAttributes(attributes); },
                    get: function () { return editor.getImageFloatMode(); },
                    set: function (floatMode) { editor.setAttributes('image', ImageStyles.getAttributesFromFloatMode(floatMode)); }
                },

                // debug

                'debug/toggle': {
                    get: function () { return app.isDebugMode(); },
                    set: function (state) { app.setDebugMode(state); }
                },
                'debug/sync': {
                    get: function () { return app.isSynchronizedMode(); },
                    set: function (state) { app.setSynchronizedMode(state); }
                },
                'debug/editable': {
                    get: function () { return editor.isEditMode(); },
                    set: function (state) { self.setEditMode(state); }
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

        // initialization -----------------------------------------------------

        // update GUI after operations or changed selection
        editor.on('operation selection', function () { self.update(); });

    } // class Controller

    // exports ================================================================

    // derive this class from class BaseController
    return BaseController.extend({ constructor: Controller });

});
