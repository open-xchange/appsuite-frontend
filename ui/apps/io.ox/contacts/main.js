/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define("io.ox/contacts/main",
    ["io.ox/contacts/util",
     "io.ox/contacts/api",
     "io.ox/core/tk/vgrid",
     "io.ox/help/hints",
     "io.ox/contacts/view-detail",
     "io.ox/core/config",
     "io.ox/core/extensions",
     "io.ox/core/commons",
     "gettext!io.ox/contacts",
     "settings!io.ox/contacts",
     "less!io.ox/contacts/style.css"
    ], function (util, api, VGrid, hints, viewDetail, config, ext, commons, gt, settings) {

    "use strict";

    // application object
    var app = ox.ui.createApp({
            name: 'io.ox/contacts',
            title: 'Address Book'
        }),
        // app window
        win,
        // grid
        grid,
        // nodes
        left,
        thumbs,
        gridContainer,
        right,
        fullIndex =
            //#. Address book thumb index
            //#. (guess translation is only needed for Asian languages)
            //#. This string is simply split at spaces (can be more or less than 26 characters)
            gt('A B C D E F G H I J K L M N O P Q R S T U V W X Y Z');

    // we have to fix the string first, otherwise we get false positives during i18n debug
    fullIndex = _.noI18n.fix(fullIndex).split(' ');

    // launcher
    app.setLauncher(function (options) {

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/contacts',
            search: true
        });

        app.setWindow(win);
        app.settings = settings;

        var vsplit = commons.vsplit(win.nodes.main, app);
        left = vsplit.left;
        right = vsplit.right.addClass('default-content-padding').scrollable();

        // left panel
        left.append(
            // grid container
            gridContainer = $('<div class="abs border-left border-right contact-grid-container">'),
            // thumb index
            thumbs = $('<div class="atb contact-grid-index border-right">')
        );

        // folder tree
        commons.addFolderView(app, { type: 'contacts', view: 'FolderList' });

        // grid
        grid = new VGrid(gridContainer);

        // add template
        grid.addTemplate({
            build: function () {
                var name, description, private_flag;
                this.addClass('contact').append(
                    private_flag = $('<i class="icon-lock private_flag">').hide(),
                    name = $('<div class="fullname">'),
                    description = $('<div class="bright-text">')
                );
                return { name: name, private_flag: private_flag, description: description };
            },
            set: function (data, fields, index) {
                if (data.mark_as_distributionlist === true) {
                    fields.name.text(_.noI18n(data.display_name || ''));
                    if (data.private_flag) {
                        fields.private_flag.show();
                    } else {
                        fields.private_flag.hide();
                    }
                    fields.description.text(gt('Distribution list'));
                } else {
                    fields.name.text(_.noI18n(util.getFullName(data)));
                    if (data.private_flag) {
                        fields.private_flag.show();
                    } else {
                        fields.private_flag.hide();
                    }
                    fields.description.text(_.noI18n(util.getDescription(data)));
                }
            }
        });

        // add label template
        grid.addLabelTemplate({
            build: function () {
            },
            set: function (data, fields, index) {
                var name = data.last_name || data.display_name || "#";
                this.text(_.noI18n(name.substr(0, 1).toUpperCase()));
            }
        });

        // requires new label?
        grid.requiresLabel = function (i, data, current) {
            var name = data.last_name || data.display_name || "#",
                prefix = _.noI18n(name.substr(0, 1).toUpperCase());
            return (i === 0 || prefix !== current) ? prefix : false;
        };

        commons.wireGridAndAPI(grid, api);
        commons.wireGridAndSearch(grid, win, api);

        // LFO callback
        var showContact, drawContact, drawFail;

        showContact = function (obj) {
            // get contact
            right.busy(true);
            app.currentContact = obj;
            if (obj && obj.id !== undefined) {
                api.get(api.reduce(obj))
                    .done(_.lfo(drawContact))
                    .fail(_.lfo(drawFail, obj));
            } else {
                console.error('showContact', obj);
            }
        };

        drawContact = function (data) {
            var baton = ext.Baton({ data: data, app: app });
            right.idle().empty().append(viewDetail.draw(baton));
        };

        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail(gt("Couldn't load contact data."), function () {
                    showContact(obj);
                })
            );
        };

        /**
         * Thumb index
         */
        function drawThumb(char, enabled) {
            var node = $('<div>')
                .addClass('thumb-index border-bottom' + (enabled ? '' : ' thumb-index-disabled'))
                .text(_.noI18n(char));
            if (enabled) {
                node.on('click', { text: char }, grid.scrollToLabelText);
            }
            return node;
        }

        // draw thumb index
        grid.on('change:ids', function () {
            // get labels
            thumbs.empty();
            var textIndex = grid.getLabels().textIndex || {};
            _(fullIndex).each(function (char) {
                // add thumb
                thumbs.append(drawThumb(char, char in textIndex));
            });
        });

        commons.wireGridAndSelectionChange(grid, 'io.ox/contacts', showContact, right);
        commons.wireGridAndWindow(grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(grid, api, win);
        commons.addGridToolbarFolder(app, grid);

        api.on("edit", function (evt, updated) {
            if (updated.folder === app.currentContact.folder_id && updated.id === app.currentContact.id) {
                // Reload
                showContact(app.currentContact);
            }
        });

        app.getGrid = function () {
            return grid;
        };

        // go!
        commons.addFolderSupport(app, grid, 'contacts', options.folder)
            .done(commons.showWindow(win, grid));
    });


    return {
        getApp: app.getInstance
    };
});

