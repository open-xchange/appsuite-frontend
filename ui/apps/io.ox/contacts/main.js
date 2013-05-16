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
     "io.ox/core/extPatterns/actions",
     "io.ox/core/commons",
     "gettext!io.ox/contacts",
     "settings!io.ox/contacts",
     "less!io.ox/contacts/style.less"
    ], function (util, api, VGrid, hints, viewDetail, config, ext, actions, commons, gt, settings) {

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
        fullIndex = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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
        grid = new VGrid(gridContainer, {
            settings: settings
        });

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
                    if ((_.noI18n(util.getFullName(data)) + _.noI18n(util.getDescription(data))).trim().length === 0) {
                        // nothing is written down, add some text, so user isn’t confused
                        fields.name.addClass('bright-text').append(gt("Empty name and description found."));
                        fields.description.append(gt("Edit to set a name."));
                    }
                }
            }
        });

        // The label function can be overwritten by an extension.
        var getLabel = function (data) {
            return (data.sort_name || '#').slice(0, 1).toUpperCase();
        };
        ext.point('io.ox/contacts/getLabel').each(function (extension) {
            if (extension.getLabel) getLabel = extension.getLabel;
        });

        // add label template
        grid.addLabelTemplate({
            build: function () {
            },
            set: function (data, fields, index) {
                this.text(_.noI18n(getLabel(data)));
            }
        });

        // requires new label?
        grid.requiresLabel = function (i, data, current) {
            if (!data) { return false; }
            var prefix = getLabel(data);
            return (i === 0 || prefix !== current) ? prefix : false;
        };

        commons.wireGridAndAPI(grid, api);
        commons.wireGridAndSearch(grid, win, api);

        // LFO callback
        var showContact, drawContact, drawFail;

        showContact = function (obj) {
            // get contact
            right.busy(true);
            if (obj && obj.id !== undefined) {
                app.currentContact = api.reduce(obj);
                api.get(app.currentContact)
                    .done(_.lfo(drawContact))
                    .fail(_.lfo(drawFail, obj));
            } else {
                right.idle().empty();
            }
        };

        showContact.cancel = function () {
            _.lfo(drawContact);
            _.lfo(drawFail);
        };

        drawContact = function (data) {
            var baton = ext.Baton({ data: data, app: app });
            baton.disable('io.ox/contacts/detail', 'breadcrumb');
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
        function Thumb(opt) {
            if (this instanceof Thumb) {
                if (_.isString(opt)) {
                    this.text = opt;
                } else {
                    _.extend(this, opt || {});
                }
            } else {
                return new Thumb(opt);
            }
        }

        Thumb.prototype.draw = function (baton) {
            var node = $('<div>')
                .addClass('thumb-index border-bottom')
                .text(this.label || _.noI18n(this.text));
            if (this.enabled(baton)) {
                node.on('click', { text: this.text }, grid.scrollToLabelText);
            } else {
                node.addClass('thumb-index-disabled');
            }
            return node;
        };

        Thumb.prototype.enabled = function (baton) {
            return this.text in baton.labels;
        };

        // draw thumb index
        var baton = new ext.Baton({ app: app, data: [], Thumb: Thumb });

        grid.on('change:ids', function () {
            ext.point('io.ox/contacts/thumbIndex')
                .invoke('draw', thumbs, baton);
        });

        ext.point('io.ox/contacts/thumbIndex').extend({
            index: 100,
            id: 'draw',
            draw: function () {
                // get labels
                baton.labels = grid.getLabels().textIndex || {};
                // update thumb list
                ext.point('io.ox/contacts/thumbIndex')
                    .invoke('getIndex', thumbs, baton);

                thumbs.empty();
                _(baton.data).each(function (thumb) {
                    thumbs.append(thumb.draw(baton));
                });
            },
            getIndex: function (baton) {
                baton.data = _.map(fullIndex, baton.Thumb);
            }
        });

        commons.wireGridAndSelectionChange(grid, 'io.ox/contacts', showContact, right);
        commons.wireGridAndWindow(grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(grid, api, win);
        commons.addGridToolbarFolder(app, grid);

        api.on('update:image', function (evt, updated) {
            if (updated.folder === app.currentContact.folder_id && updated.id === app.currentContact.id) {
                showContact(app.currentContact);
            }
        });

        app.getGrid = function () {
            return grid;
        };

         // drag & drop
        win.nodes.outer.on('selection:drop', function (e, baton) {
            actions.invoke('io.ox/contacts/actions/move', null, baton);
        });

        // go!
        commons.addFolderSupport(app, grid, 'contacts', options.folder)
            .done(commons.showWindow(win, grid));
    });


    return {
        getApp: app.getInstance
    };
});

