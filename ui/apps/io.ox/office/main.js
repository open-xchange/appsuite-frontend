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

define('io.ox/office/main',
    ['io.ox/files/api',
     'io.ox/office/editor',
     'gettext!io.ox/office/main',
     'less!io.ox/office/style.css'
    ], function (api, Editor, gt) {

    'use strict';

    // multi-instance pattern: on each call, create a new application
    // TODO: return open application per file
    function createInstance() {

        var // application object
            app = ox.ui.createApp({ name: 'io.ox/office', title: 'OXOffice' }),

            // options passed to 'load'
            appOptions = {},

            // application window
            win = null,

            // default window title
            winTitle = gt('OX Office'),

            // main application container
            container = $('<div>').addClass('container abs'),

            // the iframe representing the edited document
            iframe = $('<iframe>').addClass('io-ox-office-iframe'),

            // the top-level editing container
            editNode = $('<div>').attr('contenteditable', true).css('border', 'thin blue solid').append('<p>normal1 <span style="font-weight: bold">bold</span> normal <span style="font-style: italic">italic</span> normal</p>'),

            // text editor engine
            editor = null;

        var showError = function (data) {
            container.find('.alert').remove();
            $.alert(gt('Error'), data.error).insertBefore(editNode);
        };

        // launcher
        app.setLauncher(function () {

            // create the application window
            win = ox.ui.createWindow({
                name: 'io.ox/office',
                title: winTitle,
                close: true,
                search: false
            });
            app.setWindow(win);

            // we are using an iframe
            win.detachable = false;

            // initialize global application structure
            win.nodes.main.addClass('io-ox-office-main').append(container.append(iframe));
            setTimeout(function poll() {
                try {
                    var c = iframe.contents();
                    c.find('body').append(editNode);
                    editor = new Editor(editNode);
                } catch (ex) {
                    setTimeout(poll, 50);
                }
            }, 50);
        });

        // load document into editor
        app.load = function (options) {
            appOptions = options || {};

            // add filename to title
            if (appOptions.filename) {
                win.setTitle(winTitle + ' - ' + appOptions.filename);
                app.setTitle(appOptions.filename);
            }

            var def = $.Deferred();
            win.show(function () {
                // load file
                win.busy();
                $.when(
                    // get editor...
                    api.get(appOptions).fail(showError)//,
                    // $.ajax({ type: 'GET', url: api.getUrl(appOptions, 'view'), dataType: 'text' })
                )
                .done(function (/*editor, data, text*/) {
/*
 * init editor with data returned from loader
 */
                    if (editNode !== undefined) {
                        editNode.focus();
                    }
                    win.idle();
                    def.resolve();
                })
                .fail(function () {
                    win.idle();
                    def.reject();
                });
            });
            return def;
        };

        app.destroy = function () {
            app = win = container = iframe = editNode = editor = null;
        };

        // the function passed to setQuit will be called when the application
        // is about to be closed
        app.setQuit(function () {
            var def = $.Deferred();
            if (editor.isModified()) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog({ easyOut: true })
                    .text(gt('The document has been modified. Do you want to save your changes?'))
                    .addPrimaryButton('discard', gt('Discard'))
                    .addAlternativeButton('save', gt('Save'))
                    .addButton('cancel', gt('Cancel'))
                    .on('save', function () {
                        alert('Saving...');
                        app.destroy();
                        def.resolve();
                    })
                    .on('discard', function () {
                        app.destroy();
                        def.resolve();
                    })
                    .on('cancel', def.reject)
                    .show();
                });
            } else {
                app.destroy();
                def.resolve();
            }
            return def;
        });

        return app;
    }

    return {
        getApp: createInstance
    };
});
