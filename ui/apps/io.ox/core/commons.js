/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/commons',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'gettext!io.ox/core',
     'io.ox/core/commons-folderview',
     'io.ox/core/api/folder'], function (ext, links, gt, folderview, folderAPI) {

    'use strict';

    var commons = {

        /**
         * Common show window routine
         */
        showWindow: function (win) {
            return function () {
                var def = $.Deferred();
                win.show(def.resolve);
                return def;
            };
        },

        /**
         * Handle multi-selection
         */
        multiSelection: (function () {

            var points = {};

            function draw(id, selection, grid) {
                // inline links
                var node = $('<div>');
                (points[id] || (points[id] = new links.InlineLinks({ id: 'inline-links', ref: id + '/links/inline' })))
                    .draw.call(node, {data: selection, grid: grid});//needs grid to add busy animations without using global selectors
                return $().add(
                    $('<div>').addClass('summary').html(
                        gt('<b>%1$d</b> elements selected', selection.length)
                    )
                )
                .add(node.children().first());
            }

            return function (id, node, selection, api, grid) {
                if (selection.length > 1) {
                    // draw
                    node.idle().empty().append(
                        (api ? $.createViewContainer(selection, api) : $('<div>'))
                        .on('redraw', function () {
                            $(this).empty().append(draw(id, selection, grid));
                        })
                        .addClass('io-ox-multi-selection')
                        .append(draw(id, selection, grid))
                        .center()
                    );
                }
            };
        }()),

        wireGridAndSelectionChange: function (grid, id, draw, node, api) {
            var last = '';
            grid.selection.on('change', function (e, selection) {
                var len = selection.length,
                    // work with reduced string-based set
                    flat = JSON.stringify(_([].concat(selection)).map(function (o) {
                        return { folder_id: String(o.folder_id || o.folder), id: String(o.id), recurrence_position: String(o.recurrence_position || 0) };
                    }));
                // has anything changed?
                if (flat !== last) {
                    if (len === 1) {
                        node.css('height', '');
                        draw(selection[0]);
                    } else if (len > 1) {
                        if (draw.cancel) draw.cancel();
                        node.css('height', '100%');
                        commons.multiSelection(id, node, this.unique(this.unfold()), api, grid);//grid is needed to apply busy animations correctly
                    } else {
                        if (draw.cancel) draw.cancel();
                        node.css('height', '').idle().empty();
                    }
                    // remember current selection
                    last = flat;
                }
            });
        },

        /**
         * Wire grid & API
         */
        wireGridAndAPI: function (grid, api, getAll, getList) {
            // all request
            grid.setAllRequest(function () {
                return api[getAll || 'getAll']({ folder: this.prop('folder') });
            });
            // list request
            grid.setListRequest(function (ids) {
                return api[getList || 'getList'](ids);
            });
            // clean up selection index on delete
            api.on('beforedelete', function (e, ids) {
                grid.selection.removeFromIndex(ids);
            });
        },

        /**
         * Wire grid & window
         */
        wireGridAndWindow: function (grid, win) {
            var top = 0, on = function () {
                    grid.keyboard(true);
                    if (grid.selection.get().length) {
                        // only retrigger if selection is not empty; hash gets broken if caches are empty
                        // TODO: figure out why this was important
                        grid.selection.retriggerUnlessEmpty();
                    }
                };

            grid.setApp(win.app);
            // show
            win.on('show idle', on)
                // hide
                .on('hide busy', function () {
                    grid.keyboard(false);
                })
                .on('beforeshow', function () {
                    if (top !== null) { grid.scrollTop(top); }
                })
                .on('beforehide', function () {
                    top = grid.scrollTop();
                });
            // publish grid
            if (win.app) {
                win.app.getGrid = function () {
                    return grid;
                };
            }
            // already visible?
            if (win.state.visible) { on(); }
        },

        addGridToolbarFolder: function (app, grid) {

            ext.point(app.get('name') + '/vgrid/toolbar').extend({
                id: 'info',
                index: 200,
                draw: function () {
                    this.append($('<div class="grid-info">'));
                }
            });

            function fnOpen(e) {
                e.preventDefault();
                app.showFolderView();
            }

            // right now, only mail folders support "total"
            var name = app.get('name'),
                supportsTotal = name === 'io.ox/mail',
                searchAcrossFolders = name !== 'io.ox/mail';

            function updateFolderCount(id, data) {
                var total = data.total,
                    node = grid.getToolbar().find('.folder-count[data-folder-id="' + id + '"]');

                //cannot use .show() .hide() here because in firefox this keeps adding display: block to the span instead of inline
                if (total > 0) {
                    node.css('display', 'inline');
                } else {
                    node.css('display', 'none');
                }
                node.text('(' + total + ')');
            }

            function drawFolderName(folder_id) {
                var link = $('<a href="#" data-action="open-folderview">')
                    .attr({ tabindex: 1 })
                    .append(folderAPI.getTextNode(folder_id))
                    .on('click', fnOpen);
                if (supportsTotal) {
                    link.after(
                        $.txt(' '),
                        $('<span class="folder-count">').attr('data-folder-id', folder_id).hide()
                    );
                }
                return link;
            }

            grid.on('change:prop:folder change:mode', function (e, value) {
                var folder_id = grid.prop('folder'), mode = grid.getMode(),
                    node = grid.getToolbar().find('.grid-info').empty();
                if (mode === 'all') {
                    // non-search; show foldername
                    node.append(
                        drawFolderName(folder_id)
                    );
                } else if (mode === 'search') {
                    // search across all folders
                    if (searchAcrossFolders) {
                        node.append(
                            $.txt(gt('Searched in all folders'))
                        );
                    } else {
                        node.append(
                            $.txt(
                                //#. Searched in: <folder name>
                                gt('Searched in')
                            ),
                            $.txt(': '),
                            folderAPI.getTextNode(folder_id)
                        );
                    }
                }
            });

            // unread counter for mail
            if (supportsTotal) {
                folderAPI.on('update:total', function (e, id, data) {
                    updateFolderCount(id, data);
                });
            }

            ext.point(app.get('name') + '/vgrid/toolbar').invoke('draw', grid.getToolbar());
        },

        /**
         * Wire first refresh
         */
        wireFirstRefresh: function (app, api) {
            // open (first show)
            app.getWindow().on('open', function () {
                if (api.needsRefresh(app.folder.get())) {
                    api.trigger('refresh^', app.folder.get());
                }
            });
        },

        /**
         * Wire grid and API refresh
         */
        wireGridAndRefresh: function (grid, api, win) {
            var refreshAll = function (e) {
                    grid.refresh(true);
                },
                refreshList = function () {
                    grid.repaint();
                    grid.selection.retrigger();
                },
                pending = function () {
                    grid.pending();
                },
                off = function () {
                    api.off('refresh.all refresh:all:local', refreshAll)
                        .off('refresh.pending', pending)
                        .off('refresh.list', refreshList);
                },
                on = function () {
                    off();
                    api.on('refresh.all refresh:all:local', refreshAll)
                        .on('refresh.pending', pending)
                        .on('refresh.list', refreshList)
                        .trigger('refresh.all');
                };
            win.on({ show: on, hide: off });
            // already visible?
            if (win.state.visible) { on(); }
        },

        /**
         * Wire Grid and window's search
         */
        wireGridAndSearch: function (grid, win, api) {
            // search: all request
            grid.setAllRequest('search', function () {
                var options = win.search.getOptions();
                options.folder = grid.prop('folder');
                options.sort = grid.prop('sort');
                options.order = grid.prop('order');
                return api.search(win.search.query, options);
            });
            // search: list request
            grid.setListRequest('search', function (ids) {
                return api.getList(ids);
            });
            // on search
            win.on('search', function () {
                grid.setMode('search');
            });
            // on cancel search
            win.on('search:clear cancel-search', function () {
                grid.setMode('all');
            });
        },

        wirePerspectiveEvents: function (app) {
            var win = app.getWindow();
            var oldPerspective = null;
            win.on('show', function () {
                oldPerspective = win.currentPerspective;
                if (win.currentPerspective) {
                    app.trigger('perspective:' + win.currentPerspective + ":show");
                }
            });

            win.on('hide', function () {
                oldPerspective = win.currentPerspective;
                if (win.currentPerspective) {
                    app.trigger('perspective:' + win.currentPerspective + ":hide");
                }
            });

            win.on('change:perspective', function (e, newPerspective) {
                if (oldPerspective) {
                    app.trigger('perspective:' + oldPerspective + ":hide");
                }
                oldPerspective = newPerspective;
                app.trigger('perspective:' + newPerspective + ":show");
            });

            win.on('change:initialPerspective', function (e, newPerspective) {
                oldPerspective = newPerspective;
                app.trigger('perspective:' + newPerspective + ":show");
            });
        },

        /**
         * Add folder support
         */
        addFolderSupport: function (app, grid, type, defaultFolderId) {

            app.folder
                .updateTitle(app.getWindow())
                .setType(type);
            if (grid) {
                app.folder.updateGrid(grid);
            }

            // hash support
            app.getWindow().on('show', function () {
                if (grid) {
                    grid.selection.retriggerUnlessEmpty();
                }
                _.url.hash('folder', app.folder.get());
            });

            defaultFolderId = _.url.hash('folder') || defaultFolderId;

            // explicit vs. default
            if (defaultFolderId !== undefined) {
                return app.folder.set(defaultFolderId).pipe(null, function () {
                    return app.folder.setDefault();
                });
            } else {
                return app.folder.setDefault();
            }
        },

        addGridFolderSupport: function (app, grid) {
            app.folder.updateGrid(grid);
            app.getWindow().on('show', function () {
                grid.selection.retriggerUnlessEmpty();
            });
        },

        addFolderView: folderview.add,

        vsplit: (function () {

            var click = function (e) {
                e.preventDefault();
                $(this).closest('.vsplit').addClass('vsplit-reverse').removeClass('vsplit-slide');
                if (e.data.app) {
                    e.data.app.getGrid().selection.clear();
                }
            };

            var select = function (e) {
                var node = $(this);
                setTimeout(function () {
                    node.closest('.vsplit').addClass('vsplit-slide').removeClass('vsplit-reverse');
                }, 100);
            };

            return function (parent, app) {
                var sides = {};
                parent.addClass('vsplit').append(
                    // left
                    sides.left = $('<div class="leftside">').on('select', select),
                    // navigation
                    $('<div class="rightside-navbar">').append(
                        $('<a href="#" class="btn">').append(
                            $('<i class="icon-chevron-left">'), $.txt(' '), $.txt(gt('Back'))
                        ).on('click', { app: app }, click)
                    ),
                    // right
                    sides.right = $('<div class="rightside">')
                );
                //
                return sides;
            };
        }())
    };

    /*
     * View container
     */

    // view container with dispose capability
    var originalCleanData = $.cleanData,
        triggerDispose = function (elem) {
            return $(elem).triggerHandler('dispose');
        };

    $.cleanData = function (list) {
        return originalCleanData(_(list).map(triggerDispose));
    };

    // factory
    $.createViewContainer = function (baton, api, getter) {

        var data = baton instanceof ext.Baton ? baton.data : baton,
            cid,
            node = $('<div>').attr('data-cid', _([].concat(data)).map(_.cid).join(',')),

            update = function () {
                if ((getter = getter || (api ? api.get : null))) {
                    // fallback for create trigger
                    if (!data.id) {
                        data.id = arguments[1].id;
                    }
                    getter(api.reduce(data)).done(function (data) {
                        if (baton instanceof ext.Baton) {
                            baton.data = data;
                        } else {
                            baton = data;
                        }
                        if (node) node.triggerHandler('redraw', baton);
                    });
                }
            },

            move = function (e, targetFolderId) {
                if (data) data.folder_id = targetFolderId;
                update();
            },

            // we use redraw directly if we're in multiple mode
            // each redraw handler must get the data on its own
            redraw = _.debounce(function () {
                if (node) node.triggerHandler('redraw', baton);
            }, 10),

            remove = function () {
                if (node) node.trigger('view:remove').remove();
            },

            checkFolder = function (e, folder, folderId, folderObj) {//checks if folder permissions etc. have changed, and triggers redraw. Important to update inline links
                if (folder === e.data.folder.toString() && api) {
                    api.trigger('update:' + e.data.cid);
                }
            };

        if (_.isArray(data)) {
            // multiple items - just listen to generic events.
            // otherweise "select all" of some thousands items freezes browser
            folderAPI.on('update',  redraw);
            api.on('delete', redraw);
            api.on('update', redraw);
            // ignore move case for multiple
        } else {
            // single item
            cid = _.cid(data);
            cid = encodeURIComponent(cid);
            folderAPI.on('update',  { cid: cid, folder: data.folder_id }, checkFolder);
            api.on('delete:' + cid, remove);
            api.on('update:' + cid, update);
            api.on('move:' + cid, move);
            api.on('create', update);
        }

        return node.one('dispose', function () {
                if (_.isArray(data)) {
                    folderAPI.off('update', redraw);
                    api.off('delete', redraw);
                    api.off('update', redraw);
                } else {
                    cid = _.cid(data);
                    cid = encodeURIComponent(cid);
                    folderAPI.off('update', checkFolder);
                    api.off('delete:' + cid, remove);
                    api.off('update:' + cid, update);
                    api.off('move:' + cid, move);
                    api.off('create', update);
                }
                api = update = data = node = getter = null;
            });
    };

    // located here since we need a translation for 'Retry'

    $.fail = function (msg, retry) {
        var tmp = $("<div>")
            .addClass('io-ox-fail')
            .append(
                $('<span>').text(msg)
            );
        if (retry) {
            tmp.append(
                $('<span>').text(' ')
            )
            .append(
                $('<a>', { href: '#' }).text(gt('Retry'))
                .on('click', function (e) {
                    e.preventDefault();
                    $(this).closest('.io-ox-center').remove();
                    retry.apply(this, arguments);
                })
            );
        }
        return tmp.center();
    };

    return commons;
});
