/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/contacts/main',
    ['io.ox/contacts/util',
     'io.ox/contacts/api',
     'io.ox/core/tk/vgrid',
     'io.ox/help/hints',
     'io.ox/contacts/view-detail',
     'io.ox/core/tk/dropdown-options',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/actions',
     'io.ox/core/commons',
     'gettext!io.ox/contacts',
     'settings!io.ox/contacts',
     'io.ox/core/api/folder',
     'less!io.ox/contacts/style'
    ], function (util, api, VGrid, hints, viewDetail, dropdownOptions, ext, actions, commons, gt, settings, folderAPI) {

    'use strict';

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

        var showSwipeButton = false,
            hasDeletePermission;
        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/contacts',
            search: true
        });

        app.setWindow(win);
        app.settings = settings;

        function thumbClick() {
            var text = $(this).data('text');
            if (text) grid.scrollToLabelText(text, /* silent? */ _.device('small'));
        }

        function thumbMove(e) {
            e.preventDefault();
            if (e.originalEvent && e.originalEvent.targetTouches) {
                var touches = e.originalEvent.targetTouches[0],
                    x = touches.clientX,
                    y = touches.clientY,
                    element = document.elementFromPoint(x, y),
                    text = $(element).data('text');
                if (text) grid.scrollToLabelText(text, /* silent? */ _.device('small'));
            }
        }

        var vsplit = commons.vsplit(win.nodes.main, app);
        left = vsplit.left;
        right = vsplit.right.addClass('default-content-padding f6-target').attr('tabindex', 1).scrollable();

        // left panel
        left.append(
            // grid container
            gridContainer = $('<div class="abs border-left border-right contact-grid-container">'),
            // thumb index
            thumbs = $('<div class="atb contact-grid-index">')
                .on('click', '.thumb-index', thumbClick)
                .on('touchmove', thumbMove)
        );

        // folder tree
        commons.addFolderView(app, { type: 'contacts', view: 'FolderList' });

        ext.point('io.ox/contacts/swipeDelete').extend({
            index: 666,
            id: 'deleteButton',
            draw: function (baton) {
                // remove old buttons first
                if (showSwipeButton) {
                    removeButton();
                }
                this.append(
                    $('<div class="mail cell-button swipeDelete fadein fast">')
                        .text(gt('Delete'))
                        .on('mousedown', function (e) {
                            // we have to use mousedown as the selection listens to this, too
                            // otherwise we are to late to get the event
                            e.stopImmediatePropagation();
                        }).on('tap', function (e) {
                            e.preventDefault();
                            removeButton();
                            showSwipeButton = false;
                            actions.invoke('io.ox/contacts/actions/delete', null, baton);
                        })
                );
                showSwipeButton = true;
            }
        });

        // swipe handler
        var swipeRightHandler = function (e, id, cell) {
            var obj = _.cid(id);

            if (hasDeletePermission === undefined) {
                folderAPI.get({folder: obj.folder_id, cache: true}).done(function (data) {
                    if (folderAPI.can('delete', data)) {
                        hasDeletePermission = true;
                        api.getList([obj]).done(function (list) {
                            ext.point('io.ox/contacts/swipeDelete').invoke('draw', cell, list[0]);
                        });
                    }
                });
            } else if (hasDeletePermission) {
                api.getList([obj]).done(function (list) {
                    ext.point('io.ox/contacts/swipeDelete').invoke('draw', cell, list[0]);
                });
            }
        };

        // grid
        grid = new VGrid(gridContainer, {
            settings: settings,
            swipeRightHandler: swipeRightHandler,
            showToggle: true
        });

        // helper to remove button from grid
        var removeButton = function () {
            if (showSwipeButton) {
                var g = grid.getContainer();
                $('.swipeDelete', g).remove();
                showSwipeButton = false;
            }
        };

        grid.selection.on('change', removeButton);

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
            set: function (data, fields) {
                var name, description;
                if (data.mark_as_distributionlist === true) {
                    name = data.display_name || '';
                    fields.name.text(_.noI18n(name));
                    fields.private_flag.toggle(!!data.private_flag);
                    fields.description.text(gt('Distribution list'));
                } else {
                    name = $.trim(util.getFullName(data) || data.yomiLastName || data.yomiFirstName || data.display_name);
                    description = $.trim(util.getDescription(data));
                    fields.name.text(_.noI18n(name));
                    fields.private_flag.toggle(!!data.private_flag);
                    fields.description.text(_.noI18n(description));
                    if (name === '' && description === '') {
                        // nothing is written down, add some text, so user isn’t confused
                        fields.name.addClass('bright-text').text(gt('Empty name and description found.'));
                        fields.description.text(gt('Edit to set a name.'));
                    } else {
                        fields.name.removeClass('bright-text');
                    }
                }
                this.attr({ 'aria-label': _.noI18n(name) });
            }
        });

        // The label function can be overwritten by an extension.
        var getLabel = function (data) {
            return (data.sort_name || '').slice(0, 1).toUpperCase();
        };
        ext.point('io.ox/contacts/getLabel').each(function (extension) {
            if (extension.getLabel) getLabel = extension.getLabel;
        });

        // add label template
        grid.addLabelTemplate({
            build: function () {
            },
            set: function (data) {
                this.text(_.noI18n(getLabel(data)));
            }
        });

        // requires new label?
        grid.requiresLabel = function (i, data, current) {
            if (!data) { return false; }
            var prefix = getLabel(data);
            prefix = prefix.replace(/[ÄÀÁÂÃÄÅ]/g, 'A')
                .replace(/[ÖÒÓÔÕÖ]/g, 'O')
                .replace(/[ÜÙÚÛÜ]/g, 'U');
            return (i === 0 || prefix !== current) ? prefix : false;
        };

        commons.wireGridAndAPI(grid, api);
        commons.wireGridAndSearch(grid, win, api);

        //
        grid.setAllRequest('search', function () {
            var options = win.search.getOptions();
            options.folder = grid.prop('folder');
            options.order = grid.prop('order');
            return api.advancedsearch(win.search.query, options);
        });
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
            if (grid.getMode() === 'all') {
                baton.disable('io.ox/contacts/detail', 'breadcrumb');
            }
            right.idle().empty().append(viewDetail.draw(baton));
        };

        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail(gt('Couldn\'t load contact data.'), function () {
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
            var node = $('<div class="thumb-index">')
                .text(this.label || _.noI18n(this.text));
            if (this.enabled(baton)) {
                node.data('text', this.text);
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

        grid.selection.on('change', function () {
            if (showSwipeButton) {
                removeButton();
            }
        });
        // folder change
        grid.on('change:ids', function () {
            hasDeletePermission = undefined;
            removeButton();
            if (true || _.device('!small')) {
                ext.point('io.ox/contacts/thumbIndex').invoke('draw', thumbs, baton);
            }
        });

        ext.point('io.ox/contacts/thumbIndex').extend({
            index: 100,
            id: 'draw',
            draw: function () {

                // get labels
                baton.labels = grid.getLabels().textIndex || {};

                // update thumb listf
                ext.point('io.ox/contacts/thumbIndex').invoke('getIndex', thumbs, baton);

                thumbs.empty();

                _(baton.data).each(function (thumb) {
                    thumbs.append(thumb.draw(baton));
                });
            },
            getIndex: function (baton) {
                baton.data = _.map(fullIndex, baton.Thumb);
            }
        });

        // extend search form

        ext.point('io.ox/contacts/search/defaults').extend({
            names: true,
            phones: false,
            addresses: false
        });

        ext.point('io.ox/contacts/search/checkboxes').extend({
            names: true,
            phones: true,
            addresses: true
        });

        var translations = { names: gt('Names and email addresses'), phones: gt('Phone numbers'), addresses: gt('Addresses')},
            checkboxes = ext.point('io.ox/contacts/search/checkboxes').options(),
            defaults = ext.point('io.ox/contacts/search/defaults').options(),
            data = {}, button;

        //normalise data
        _(checkboxes).each(function (flag, name) {
            if (flag === true) {
                data[name] = {
                    name: name,
                    label: translations[name] || name,
                    checked: defaults[name] || false
                };
            }
        });

        //add dropdown button
        button = $('<button type="button" data-action="search-options" class="btn btn-default search-options" aria-hidden="true">')
                .append('<i class="icon-gear">');
        win.nodes.search.find('.form-search > .input-group > .input-group-btn').prepend(button);

        //add dropdown menue
        dropdownOptions({
            id: 'contacts.search',
            anchor: button,
            defaults: data,
            settings: settings
        });

        commons.wireGridAndSelectionChange(grid, 'io.ox/contacts', showContact, right);
        commons.wireGridAndWindow(grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(grid, api, win);
        commons.addGridToolbarFolder(app, grid, 'CONTACTS');

        api.on('update:image', function (evt, updated) {
            if (updated.folder === app.currentContact.folder_id && updated.id === app.currentContact.id) {
                showContact(app.currentContact);
            }
        });

        api.on('create update delete refresh.all', function () {
            folderAPI.reload(app.folder.get());
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
