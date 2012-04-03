/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) 2004-2012 Open-Xchange, Inc.
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/foldertree',
    ['io.ox/core/tk/selection',
     'io.ox/core/api/folder',
     'io.ox/core/extensions',
     'io.ox/core/event'], function (Selection, api, ext, Events) {

    'use strict';

    var PATH = ox.base + '/apps/themes/default/icons/',
        DEFAULT = PATH + 'folder-default.png',
        OPEN = 'url(' + PATH + 'folder-open.png)',
        CLOSE = 'url(' + PATH + 'folder-close.png)',

        tmplFolder = $('<div>').addClass('folder selectable').css('paddingLeft', '13px'),
        tmplSub = $('<div>').addClass('subfolders').hide(),

        refreshHash = {};

    /**
     * Tree node class
     */
    function TreeNode(tree, id, container, level) {

        // load folder data immediately
        var ready = api.get({ folder: id }),
            nodes = {},
            children = null,
            painted = false,
            open,
            self = this,
            data = {},

            // internal functions
            skip = function () {
                return tree.root === self && tree.options.skipRoot;
            },

            hasChildren = function () {
                return data.subfolders || data.subscr_subflds;
            },

            isOpen = function () {
                if (open === undefined) {
                    // TODO: save/restore tree state
                    open = data.id === 'default0/INBOX' ||
                        (tree.options.type === 'infostore' && (data.id === '9' || data.id === '10')) ||
                        (tree.options.type === 'contacts' && (data.id === '2'));
                    //open = (data.module === 'system' || data.module === tree.options.type);
                }
                return hasChildren() && (skip() || open);
            },

            drawChildren = function (reload, method) {
                return self.loadChildren(reload)
                    .pipe(function (children) {
                        // tricky one liner: we invoke 'paint' for all child nodes.
                        // invoke returns a nice array of all returns values which are deferred objects.
                        // we use this array to feed $.when(). Thus, we get a proper combined deferred object
                        // that will be resolved once all child nodes are resolved.
                        return $.when.apply(null, _(children).invoke(method, nodes.sub.busy().show()));
                    });
            },

            paintChildren = function () {
                return drawChildren(false, 'paint');
            },

            repaintChildren = function () {
                return drawChildren(true, 'repaint');
            },

            updateArrow = function () {
                var image = hasChildren() ? (isOpen() ? CLOSE : OPEN) : 'none';
                nodes.arrow.css('backgroundImage', image);
            },

            // open/close tree node
            toggleState = function (e) {
                e.preventDefault();
                if (hasChildren()) {
                    if (open) {
                        open = false;
                        nodes.sub.hide();
                        updateArrow();
                    } else {
                        open = true;
                        nodes.sub.show();
                        updateArrow();
                        if (children === null) {
                            paintChildren();
                        }
                    }
                }
            };

        // make accessible
        this.id = id;

        // get sub folders
        this.getChildren = function () {
            return children;
        };

        // update promise
        this.reload = function () {
            ready = api.get({ folder: id });
        };

        // load sub folders - creates instances of TreeNode - does not yet paint them
        this.loadChildren = function (reload) {
            var hash = {}, needsRefresh;
            if (children === null || reload === true) {
                // build hash?
                if (children !== null && reload === true) {
                    _(children).each(function (node) {
                        hash[node.id] = node.detach();
                    });
                }
                // check cache
                needsRefresh = refreshHash[id] === undefined && api.needsRefresh(id);
                // get sub folders
                return api.getSubFolders({ folder: id })
                    .done(function (list) {
                        // needs refresh?
                        if (needsRefresh) {
                            _.defer(function () {
                                // get fresh data
                                api.getSubFolders({ folder: id, cache: false })
                                    .done(function (freshList) {
                                        // compare
                                        if (!_.isEqual(list, freshList)) {
                                            self.reload();
                                            _(children).invoke('reload');
                                            self.repaint();
                                        }
                                        refreshHash[id] = false;
                                    });
                            });
                        }
                    })
                    .pipe(function (data) {
                        // create new children array
                        children = _.chain(data)
                            .select(function (folder) {
                                // ignore system folders without sub folders, e.g. 'Shared folders'
                                return folder.module !== 'system' || folder.subfolders;
                            })
                            .map(function (folder) {
                                if (reload && hash[folder.id] !== undefined) {
                                    // reuse
                                    var node = hash[folder.id];
                                    delete hash[folder.id];
                                    return node;
                                } else {
                                    // new node
                                    return new TreeNode(tree, folder.id, nodes.sub, skip() ? level : level + 1);
                                }
                            })
                            .value();
                        // destroy deprecated tree nodes
                        _(hash).each(function (child) {
                            child.destroy();
                        });
                        hash = null;
                        return children;
                    });
            } else {
                return $.Deferred().resolve(children);
            }
        };

        this.customize = function (nodes, data) {

            var src;

            switch (data.id) {
            case 'default0/INBOX':
                src = PATH + 'inbox.png';
                break;
            case 'default0/INBOX/Trash':
                src = PATH + 'trash.png';
                break;
            case 'default0/INBOX/Sent Items':
                src = PATH + 'outbox.png';
                break;
            case '6':
                src = PATH + 'user.png';
                break;
            default:
                src = DEFAULT;
                break;
            }

            // fade out?
            if (tree.options.type && tree.options.type !== data.module) {
                nodes.folder.addClass('greyed-out');
            }

            // set icon
            nodes.icon.attr('src', src);
            // set title
            nodes.label.text(data.title + '');
            // set counter (mail only)
            if (tree.options.type === 'mail' && data.total !== undefined) {
                nodes.counter.text(data.total || '');
            } else {
                nodes.counter.hide();
            }
        };

        this.detach = function () {
            nodes.folder.detach();
            nodes.sub.detach();
            return this;
        };

        this.destroy = function () {
            // remove DOM nodes
            _(nodes).each(function (node) {
                node.remove();
            });
            // recurse
            _(children).each(function (child) {
                child.destroy();
            });
            // clear
            ready = children = nodes = tree = self = container = data = null;
        };

        this.repaint = function () {
            if (painted) {
                // add now
                container.append(nodes.folder, nodes.sub);
                // get folder
                return ready
                    .pipe(function (promise) {
                        // get data
                        data = promise;
                        // re-add to index, customize, update arrow
                        tree.selection.addToIndex(data);
                        self.customize(nodes, data);
                        updateArrow();
                        // draw children
                        if (isOpen()) {
                            return repaintChildren();
                        } else {
                            nodes.sub.empty().hide();
                            return $.when();
                        }
                    })
                    .done(function () {
                        container.idle();
                    });
            } else {
                return this.paint();
            }
        };

        // paint tree node - loads and paints sub folder if open
        this.paint = function () {

            nodes.folder = tmplFolder.clone().on('dblclick', toggleState);

            if (level > 0) {
                nodes.folder.css('paddingLeft', (13 + level * 22) + 'px');
            }

            nodes.sub = tmplSub.clone();

            if (skip()) {
                nodes.folder.hide();
            }

            // we have to add nodes now! (otherwise we get an arbitrary order)
            container.append(nodes.folder, nodes.sub);

            return ready
                .pipe(function (promise) {
                    // store data
                    data = promise;
                    // create DOM nodes
                    nodes.arrow = $('<div>').addClass('folder-arrow').on('click', toggleState);
                    nodes.icon = $('<img>', { src: '', alt: '' }).addClass('folder-icon');
                    nodes.label = $('<span>').addClass('folder-label');
                    nodes.counter = $('<span>').addClass('folder-counter');
                    // work with selection
                    nodes.folder.attr('data-obj-id', data.id);
                    tree.selection.addToIndex(data);
                    // customize
                    self.customize(nodes, data);
                    // draw children
                    var def = isOpen() ? paintChildren() : $.when();
                    updateArrow();
                    // add to DOM
                    nodes.folder.append(nodes.arrow, nodes.icon, nodes.counter, nodes.label);
                    // Done
                    return def;
                })
                .done(function () {
                    container.idle();
                    painted = true;
                });
        };
    }

    /**
     * Folder tree class
     */
    function FolderTree(container, opt) {

        this.options = _.extend({
                id: 'default',
                rootFolderId: '1',
                skipRoot: true,
                type: null
            }, opt);

        // painting
        var painting = null,
            // ref
            self = this;

        $(container)
            .addClass('io-ox-foldertree')
            // add tree container
            .append(this.container = $('<div>'));

        // root tree node
        this.root = new TreeNode(this, this.options.rootFolderId, this.container, 0);

        // selection
        Selection.extend(this, container) // not this.container!
            .setMultiple(false)
            .setSerializer(function (obj) {
                return String(obj.id);
            });

        // add event hub
        Events.extend(this);

        this.paint = function () {
            if (painting === null) {
                this.trigger('beforepaint');
                this.selection.clearIndex();
                painting = this.root.paint();
                painting.always(function () {
                    self.selection.update();
                    self.trigger('paint');
                    painting = null;
                });
            }
            return painting || $.when();
        };

        this.repaint = function () {
            if (painting === null) {
                this.trigger('beforerepaint');
                this.selection.clearIndex();
                painting = this.root.repaint();
                painting.always(function () {
                    self.selection.update();
                    self.trigger('repaint');
                    painting = null;
                });
            }
            return painting || $.when();
        };

        this.busy = function () {
            this.container.parent().busy().children().hide();
            this.trigger('busy');
            return this;
        };

        this.idle = function () {
            this.container.parent().idle().children().show();
            this.trigger('idle');
            return this;
        };

        this.destroy = function () {
            this.events.destroy();
            this.selection.destroy();
            container.empty();
            container = this.container = this.selection = null;
        };
    }

    function fnCreateFolder(e) {
        e.preventDefault();
        require(['io.ox/core/tk/dialogs'], function (dialogs) {
            new dialogs.ModalDialog({
                width: 400,
                easyOut: true
            })
            .header(
                $('<h4>').text('Add new folder')
            )
            .append(
                $('<input>', { placeholder: 'Folder name', value: '' }).addClass('nice-input')
            )
            .addButton('cancel', 'Cancel')
            .addPrimaryButton('add', 'Add folder')
            .show(function () {
                this.find('input').focus();
            })
            .done(function (action) {
                if (action === 'add') {
                    // be responsive
                    e.data.tree.busy();
                    // call API
                    api.create({
                        folder: e.data.folder,
                        data: {
                            module: 'mail',
                            title: 'New folder ' + _.now()
                        }
                    })
                    .done(function (data) {
                        e.data.tree.idle().repaint()
                            .done(function () {
                                e.data.tree.selection.set(String(data));
                                e.data = null;
                            });
                    });
                }
            });
        });
    }

    function ApplicationFolderTree(container, opt) {
        // inherit from folder tree
        FolderTree.call(this, container, opt);
        // add link container
        $(container).append(this.links = $('<div>').addClass('foldertree-links'));
        // add extension point support
        this.on('paint', function () {
            // paint links
            ext.point('io.ox/application-foldertree/links').invoke('draw', this.links, {
                rootFolderId: this.options.rootFolderId,
                tree: this
            });
        });
    }

    // default extension point
    ext.point('io.ox/application-foldertree/links').extend({
        index: 100,
        id: 'create-folder',
        draw:  function (data) {
            this.append(
                $('<div>')
                .append(
                    $('<a>', { href: '#' })
                    .addClass('action-link')
                    .text('Add new folder ...')
                    .on('click', { folder: data.rootFolderId, tree: data.tree }, fnCreateFolder)
                )
            );
        }
    });

    return {
        FolderTree: FolderTree,
        ApplicationFolderTree: ApplicationFolderTree
    };

});
