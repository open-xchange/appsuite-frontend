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
     'io.ox/core/commons-folderview'], function (ext, links, gt, folderview) {

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

            function draw(id, selection) {
                // inline links
                var links = $('<div>');
                (points[id] || (points[id] = new links.InlineLinks({ id: 'inline-links', ref: id + '/links/inline' })))
                    .draw.call(links, selection);
                return $().add(
                    $('<div>').addClass('summary').html(
                        gt('<b>%1$d</b> elements selected', selection.length)
                    )
                )
                .add(links.children().first());
            }

            return function (id, node, selection, api) {
                if (selection.length > 1) {
                    // draw
                    node.idle().empty().append(
                        (api ? $.createViewContainer(selection, api) : $('<div>'))
                        .on('redraw', function () {
                            $(this).empty().append(draw(id, selection));
                        })
                        .addClass('io-ox-multi-selection')
                        .append(draw(id, selection))
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
                        commons.multiSelection(id, node, this.unfold(), api);
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
            // handle 'not-found'
            api.on('not-found', function () {
                grid.selection.selectFirst();
            });
        },

        /**
         * Wire grid & window
         */
        wireGridAndWindow: function (grid, win) {
            var top = 0;
            // show
            win.on('show idle', function () {
                    grid.selection.keyboard(true);
                    if (grid.selection.get().length) {
                        // only retrigger if selection is not empty; hash gets broken if caches are empty
                        // TODO: figure out why this was important
                        grid.selection.retriggerUnlessEmpty();
                    }
                })
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
                    grid.repaint().done(function () {
                        grid.selection.retrigger();
                    });
                },
                on = function () {
                    api.on('refresh.all refresh:all:local', refreshAll)
                    .on('refresh.list', refreshList)
                    .trigger('refresh.all');
                },
                off = function () {
                    api.off('refresh.all refresh:all:local', refreshAll)
                    .off('refresh.list', refreshList);
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
                return api.search(win.search.query);
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

        /**
         * Add folder support
         */
        addFolderSupport: function (app, grid, type, defaultFolderId) {

            app.folder
                .updateTitle(app.getWindow())
                .updateGrid(grid)
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
                return app.folder.set(defaultFolderId);
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
            };

            var select = function (e) {
                var node = $(this);
                setTimeout(function () {
                    node.closest('.vsplit').addClass('vsplit-slide').removeClass('vsplit-reverse');
                }, 100);
            };

            return function (parent) {
                var sides = {};
                parent.addClass('vsplit').append(
                    // left
                    sides.left = $('<div class="leftside">').on('select', select),
                    // navigation
                    $('<div class="rightside-navbar">').append(
                        $('<a href="#" class="btn">').append(
                            $('<i class="icon-chevron-left">'), $.txt(' '), $.txt(gt('Back'))
                        ).on('click', click)
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
                node.remove();
            };

        if (_.isArray(data)) {
            // multiple items
            _.chain(data).map(_.cid).each(function (cid) {
                api.on('delete:' + cid, redraw);
                api.on('update:' + cid, redraw);
            });
        } else {
            // single item
            cid = _.cid(data);
            api.on('delete:' + cid, remove);
            api.on('update:' + cid, update);
        }

        return node.on('dispose', function () {
                if (_.isArray(data)) {
                    _.chain(data).map(_.cid).each(function (cid) {
                        api.off('delete:' + cid, redraw);
                        api.off('update:' + cid, redraw);
                    });
                } else {
                    cid = _.cid(data);
                    api.off('delete:' + cid, remove);
                    api.off('update:' + cid, update);
                }
                api = update = data = node = getter = null;
            });
    };

    return commons;
});
