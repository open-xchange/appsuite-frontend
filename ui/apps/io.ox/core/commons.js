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
                        node.css('height', '100%');
                        commons.multiSelection(id, node, this.unique(this.unfold()), api, grid);//grid is needed to apply busy animations correctly
                    } else {
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
        },

        /**
         * Wire grid & window
         */
        wireGridAndWindow: function (grid, win) {
            var top = 0, on = function () {
                    grid.selection.keyboard(true);
                    if (grid.selection.get().length) {
                        // only retrigger if selection is not empty; hash gets broken if caches are empty
                        // TODO: figure out why this was important
                        grid.selection.retriggerUnlessEmpty();
                    }
                };
            // show
            win.on('show idle', on)
                // hide
                .on('hide busy', function () {
                    grid.selection.keyboard(false);
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

            function fnCancel(e) {
                e.preventDefault();
                app.getWindow().search.stop();
            }

            // disable for 7.0.1
            var isMail = false && app.get('name') === 'io.ox/mail';

            function updateUnreadCount(id, data) {
                var unread = data.unread,
                    node = grid.getToolbar().find('.folder-unread-count[data-folder-id="' + id + '"]');
                node[unread > 0 ? 'show' : 'hide']().text(unread);
            }

            function drawFolderName(folder_id) {
                var link = $('<a href="#" data-action="open-folderview">')
                    .append(folderAPI.getTextNode(folder_id))
                    .on('click', fnOpen);
                if (isMail) {
                    folderAPI.get({ folder: folder_id }).done(function (data) {
                        link.after(
                            $.txt(' '),
                            $('<b class="label folder-unread-count">').attr('data-folder-id', folder_id).hide()
                        );
                    });
                }
                return link;
            }

            grid.on('change:prop:folder change:mode', function (e, value) {
                var folder_id = grid.prop('folder'), mode = grid.getMode(),
                    node = grid.getToolbar().find('.grid-info').empty();
                if (mode === 'all') {
                    node.append(drawFolderName(folder_id));
                } else if (mode === 'search') {
                    node.append(
                        $('<a href="#" data-action="cancel-search">')
                        .addClass('btn btn-danger')
                        .text(gt('Cancel search'))
                        .on('click', fnCancel)
                    );
                }
            });

            // unread counter for mail
            if (isMail) {
                folderAPI.on('update:unread', function (e, id, data) {
                    updateUnreadCount(id, data);
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
            var refreshAll = function () {
                    grid.refresh(true);
                },
                refreshList = function () {
                    grid.repaint();
                    grid.selection.retrigger();
                },
                off = function () {
                    api.off('refresh.all refresh:all:local', refreshAll)
                        .off('refresh.list', refreshList);
                },
                on = function () {
                    off();
                    api.on('refresh.all refresh:all:local', refreshAll)
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
            win.on('cancel-search', function () {
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

            // we use redraw directly if we're in multiple mode
            // each redraw handler must get the data on its own
            redraw = _.debounce(function () {
                if (node) node.triggerHandler('redraw', baton);
            }, 10),

            remove = function () {
                if (node) node.remove();
            };

        if (_.isArray(data)) {
            // multiple items
            _.chain(data).map(_.cid).each(function (cid) {
                cid = encodeURIComponent(cid);
                api.on('delete:' + cid, redraw);
                api.on('update:' + cid, redraw);
            });
        } else {
            // single item
            cid = _.cid(data);
            cid = encodeURIComponent(cid);
            api.on('delete:' + cid, remove);
            api.on('update:' + cid, update);
            api.on('create', update);
        }

        return node.one('dispose', function () {
                if (_.isArray(data)) {
                    _.chain(data).map(_.cid).each(function (cid) {
                        cid = encodeURIComponent(cid);
                        api.off('delete:' + cid, redraw);
                        api.off('update:' + cid, redraw);
                    });
                } else {
                    cid = _.cid(data);
                    cid = encodeURIComponent(cid);
                    api.off('delete:' + cid, remove);
                    api.off('update:' + cid, update);
                    api.off('create', update);
                }
                api = update = data = node = getter = null;
            });
    };

    return commons;
});
