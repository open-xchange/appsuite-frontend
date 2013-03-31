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

define('io.ox/core/tk/folderviews',
    ['io.ox/core/tk/selection',
     'io.ox/core/api/folder',
     'io.ox/core/api/account',
     'io.ox/core/api/user',
     'io.ox/core/extensions',
     'io.ox/core/event',
     'io.ox/core/config',
     'io.ox/core/notifications',
     'io.ox/core/http',
     'io.ox/core/cache',
     'io.ox/core/capabilities',
     'gettext!io.ox/core'
    ], function (Selection, api, account, userAPI, ext, Events, config, notifications, http, cache, capabilities, gt) {

    'use strict';

    var OPEN = 'icon-chevron-right',
        CLOSE = 'icon-chevron-down',

        tmplFolder = $('<div class="folder selectable">').append('<div class="folder-row">'),
        tmplSub = $('<div>').addClass('subfolders').hide(),
        MOBILEFOLDERPADDING = 15,
        DESKTOPFOLDERPADDING = 30,
        SUBFOLDERPADDING = _.device('small') ? MOBILEFOLDERPADDING : DESKTOPFOLDERPADDING,
        refreshHash = {},

        TRUE = function () { return true; };

    /**
     * Tree node class
     */
    function TreeNode(tree, id, container, level, checkbox, all, storage) {
        // load folder data immediately
        var ready = api.get({ folder: id, storage: storage }),
            nodes = {},
            children = null,
            painted = false,
            detached = true,
            loading = null,
            open,
            self = this,
            data = {},

            // custom filter
            filter = _.isFunction(tree.options.filter) ? tree.options.filter : TRUE,

            // internal functions
            skip = function () {
                return tree.root === self && tree.options.skipRoot;
            },

            hasChildren = function () {
                var isCut = _([].concat(tree.options.cut)).contains(data.id);
                return !isCut && (children === null ? (data.subfolders || data.subscr_subflds) : !!children.length);
            },

            isOpen = function () {
                if (open === undefined) {
                    open = _(tree.options.open || []).contains(data.id);
                }
                return hasChildren() && (skip() || open);
            },

            drawChildren = function (reload, method) {

                if (loading) return $.Deferred().resolve([]);

                // remove potential fail messages from previous refreshes
                nodes.sub.find('.io-ox-fail').parent().remove();

                // be busy
                nodes.sub.busy().show();

                // load
                return (
                    loading = self.loadChildren(reload)
                    // next pipe() makes it slow for debugging
                    // .pipe(function (children) {
                    //    var def = $.Deferred();
                    //    setTimeout(function () {
                    //        def.resolve(children);
                    //    }, 1000);
                    //    return def;
                    // })
                    .fail(function (error) {
                        // reset folder and show local error
                        nodes.sub.idle().empty().append(
                            $.fail(gt('Couldn\'t load subfolders.'), function () {
                                drawChildren(reload, method);
                            })
                            .attr('data-folder-id', id)
                        );
                    })
                    .then(function (children) {
                        // tricky one liner: we invoke 'paint' for all child nodes.
                        // invoke returns a nice array of all return values which all are deferred objects.
                        // we use this array to feed $.when(). Thus, we get a proper combined deferred object
                        // that will be resolved once all child nodes are resolved.
                        if (!children || children.length === 0) {
                            nodes.sub.idle().hide(); // Robustness. Sometimes the folder interface seems unsure about subfolders.
                            hideArrow();
                            return $.when();
                        }
                        return $.when.apply(null, _(children).invoke(method, nodes.sub));
                    })
                    .always(_.defer(function () {
                        // need to use defer here, otherwise tree selection gets broken
                        // with second repaint (visually ok but lacks addToIndex calls)
                        loading = null;
                    }))
                );
            },

            paintChildren = function () {
                return drawChildren(false, 'paint');
            },

            repaintChildren = function () {
                return drawChildren(true, 'repaint').done(function () {
                    // fix changed orders by re-appending all children
                    _(children).each(function (child) {
                        child.append(true);
                    });
                });
            },

            updateArrow = function () {
                var className = hasChildren() ? (isOpen() ? CLOSE : OPEN) : 'icon-none';
                nodes.arrow.find('i').attr('class', className);
            },

            hideArrow = function () {
                nodes.arrow.find('i').attr('class', 'icon-none');
            },

            openNode = function () {
                if (!hasChildren() || open) { return $.when(); }
                open = true;
                nodes.sub.show();
                updateArrow();
                tree.toggle();
                return children === null ? paintChildren() : $.when();
            },

            closeNode = function () {
                if (!hasChildren() || !open) { return; }
                open = false;
                nodes.sub.hide();
                updateArrow();
                tree.toggle();
            },

            // open/close tree node
            toggleState = function (e) {
                // not valid click?
                if (e.type !== 'dblclick') {
                    var node = $(this),
                        isArrow = node.hasClass('folder-arrow'),
                        isLabel = node.hasClass('folder-label'),
                        folder = node.closest('.folder'),
                        isUnselectable = folder.hasClass('unselectable');
                    if (isArrow || (isLabel && isUnselectable)) {
                        // avoid selection; allow for unreadable
                        e.preventDefault();
                        if (!open) { openNode(); } else { closeNode(); }
                    }
                }
            };

        // make accessible
        this.id = String(id);

        // store in hash for quick access
        tree.treeNodes[this.id] = this;

        // open & close
        this.open = openNode;
        this.close = closeNode;

        this.isOpen = function () {
            return hasChildren() && (open === true || (tree.options.skipRoot && tree.options.rootFolderId === id));
        };

        this.getOpenNodes = function () {
            if (isOpen()) {
                return [id].concat(_(children || []).invoke('getOpenNodes'));
            } else {
                return [];
            }
        };

        // get sub folders
        this.getChildren = function () {
            return children;
        };

        this.removeChild = function (treeNode) {
            children = _(children).without(treeNode);
            updateArrow();
        };

        this.refresh = function (newId, changed) {
            // might have a new id
            id = newId;
            return $.when(
                ready = api.get({ folder: newId, storage: storage }),
                this.loadChildren(true)
            )
            .pipe(function (data) {
                // repaint parent node since a changed title also changes the folder order
                tree.getNode(data.folder_id).repaint();
            });
        };

        // update promise
        this.reload = function () {
            return (ready = api.get({ folder: id, storage: storage})).done(function (promise) {
                data = promise;
                children = _.isArray(children) && children.length === 0 ? null : children;
                updateArrow();
                self.customize();
            });
        };

        // load sub folders - creates instances of TreeNode - does not yet paint them
        this.loadChildren = function (reload) {

            var hash = {}, needsRefresh;

            if (children === null || reload === true) {
                // build hash?
                if (children !== null && reload === true) {
                    _(children).each(function (node) {
                        hash[node.id] = node;
                    });
                }
                // we assume that folder API takes care of clearing caches for periodic refreshes
                // get sub folders
                return api.getSubFolders({ folder: id, all: all, storage: storage }).then(function (data) {
                    // create new children array
                    children = _.chain(data)
                        .filter(function (folder) {
                            // ignore system folders without sub folders, e.g. 'Shared folders'
                            return (folder.module !== 'system' || folder.subfolders) && filter(folder);
                        })
                        .map(function (folder) {
                            if (hash[folder.id] !== undefined) {
                                // reuse
                                var node = hash[folder.id];
                                delete hash[folder.id];
                                return node;
                            } else {
                                // new node
                                return new TreeNode(tree, folder.id, nodes.sub, skip() ? level : level + 1, checkbox, all, storage);
                            }
                        })
                        .value();
                    // destroy remaining and thus deprecated tree nodes
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

        this.append = function (force) {
            if (detached || force) {
                container.append(nodes.folder, nodes.sub);
                detached = false;
            }
        };

        this.destroy = function () {
            // remove from parent node
            var node = data && tree.getNode(data.folder_id);
            if (node) {
                node.removeChild(this);
            }
            // traverse children
            _(children).each(function (child) {
                child.destroy();
            });
            // remove DOM nodes
            _(nodes).each(function (node) {
                node.remove();
            });
            // remove from hash
            delete tree.treeNodes[this.id];
            // clear
            ready = children = nodes = tree = self = container = data = null;
        };

        this.repaint = function () {
            if (painted) {
                // add?
                self.append();
                // get folder
                return this.reload().pipe(function () {
                    // reload resets promise, calls customize & updateArrow
                    if (nodes.folder.hasClass('selectable')) {
                        tree.selection.addToIndex(data.id);
                    }
                    // draw children?
                    if (isOpen()) {
                        return repaintChildren();
                    } else {
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

            nodes.folder = tmplFolder.clone().on('dblclick mousedown', '.folder-arrow, .folder-label', toggleState);

            if (level > 0) {
                nodes.folder.css('paddingLeft', (0 + level * SUBFOLDERPADDING) + 'px');
            }

            nodes.sub = tmplSub.clone();

            if (skip()) {
                nodes.folder.hide();
            }

            // we have to add nodes now! (otherwise we get an arbitrary order)
            this.append();

            return ready.pipe(function (promise) {
                // store data
                data = promise;

                if (nodes && nodes.arrow === undefined) {
                    // create DOM nodes
                    nodes.arrow = $('<div class="folder-arrow"><i class="icon-chevron-right"></i></div>');
                    nodes.label = $('<div class="folder-label">');
                    nodes.counter = $('<div class="folder-counter">').append('<span class="folder-counter-badge">');
                    nodes.subscriber = $('<input>').attr({ 'type': 'checkbox', 'name': 'folder', 'value': data.id }).css('float', 'right');
                    if (data.subscribed) {
                        nodes.subscriber.attr('checked', 'checked');
                    }
                }  else {
                    //potential workaround for bug 24377 (horizontal folder duplicates)
                    return isOpen() ? paintChildren() : $.when();
                }

                // draw children
                var def = isOpen() ? paintChildren() : $.when();
                updateArrow();
                // add to DOM
                if (checkbox && (data.own_rights & 0x3f80)) {
                    nodes.folder.find('.folder-row').append(nodes.arrow, nodes.label, nodes.counter, nodes.subscriber);
                } else {
                    nodes.folder.find('.folder-row').append(nodes.arrow, nodes.label, nodes.counter);
                }
                // customize
                self.customize();
                // work with selection
                nodes.folder.attr('data-obj-id', data.id);
                if (nodes.folder.hasClass('selectable')) {
                    tree.selection.addToIndex(data.id);
                }
                // Done
                return def;
            })
            .done(function () {
                container.idle();
                painted = true;
            });
        };

        this.customize = function () {
            // invoke extension points
            ext.point('io.ox/foldertree/folder').invoke('customize', nodes.folder, data, tree.options);
            if (_.isFunction(tree.options.customize)) {
                tree.options.customize.call(nodes.folder, data, tree.options);
            }
        };
    }

    /**
     * Abstract folder structure class
     */
    function FolderStructure(container, opt) {

        this.options = _.extend({
            id: 'default',
            rootFolderId: '1',
            skipRoot: true,
            type: null,
            open: [],
            toggle: $.noop,
            select: $.noop
        }, opt);

        this.internal = { destroy: $.noop };

        // ref
        var self = this;

        $(container)
            .addClass('io-ox-foldertree')
            // add tree container
            .append(this.container = $('<div class="folder-root">'));

        // selection
        Selection.extend(this, container, { dropzone: true, dropType: 'folder' }) // not this.container!
            .setMultiple(false)
            .setSerializer(function (obj) {
                return String(obj.id);
            });

        // add event hub
        Events.extend(this);

        this.paint = function () {
            var p = this.paint;
            if (p.running === null) {
                this.trigger('beforepaint');
                this.selection.clearIndex();
                p.running = this.internal.paint.call(this) || $.when();
                p.running.always(function () {
                    self.selection.update();
                    self.trigger('paint');
                    p.running = null;
                });
            }
            return p.running || $.when();
        };

        this.paint.running = null;

        this.repaint = function () {
            var p = this.paint;
            if (p.running === null) {
                this.trigger('beforerepaint');
                this.selection.clearIndex();
                p.running = (this.internal.repaint || this.internal.paint).call(this) || $.when();
                p.running.always(function () {
                    self.selection.update();
                    self.trigger('repaint');
                    p.running = null;
                });
            }
            return p.running || $.when();
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

        this.getNode = $.noop;
        this.removeNode = $.noop;
        this.reloadNode = $.noop;
        this.repaintNode = $.noop;

        this.destroy = function () {
            this.events.destroy();
            this.selection.destroy();
            this.internal.destroy();
            container.empty();
            container = this.container = this.selection = this.internal = null;
        };

        function fnKeyPress(e) {
            if (e.which === 13) {
                e.data.popup.invoke(e.data.action);
            }
        }

        /**
         * @param folder {string} (optional) folder id
         * @param title {string} (optional) title
         * @param opt {object} (optional) options object can contain only
         * a module name, for now
         */
        this.addProcess = function (folder, title, opt) {
            var self = this,
            opt = opt || {};
            // call API
            return api.create({
                folder: folder,
                data: {
                    title: $.trim(title) || gt('New folder'),
                    module: opt.module
                }
            });
        };

        /**
         * @param folder {string} (optional) folder id
         * @param opt {object} (optional) options object - will be forwarded
         * to folder API
         */
        this.add = function (folder, opt) {
            var self = this,
            folder = folder || String(this.selection.get()),
            opt = opt || {};
            if (folder) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog({
                        async: true,
                        easyOut: true,
                        width: 400
                    })
                    .header(
                        $('<h4>').text(folder === '1' ? gt('Add new folder') : gt('Add new subfolder'))
                    )
                    .build(function () {
                        this.getContentNode().append(
                            $('<div class="row-fluid">').append(
                                folder !== '1' ? api.getBreadcrumb(folder, { subfolders: false }) : [],
                                $('<input>', { type: 'text' })
                                .attr('placeholder', gt('Folder name'))
                                .addClass('span12')
                                .on('keypress', { popup: this, action: 'add' }, fnKeyPress)
                            )
                        );
                    })
                    .addPrimaryButton('add', gt('Add folder'))
                    .addButton('cancel', gt('Cancel'))
                    .on('add', function () {
                        var popup = this;
                        self.addProcess(folder, this.getContentNode().find('input').val(), opt).always(function () {
                            popup.close();
                        });
                    })
                    .show(function () {
                        this.find('input').focus();
                    });
                });
            }
        };

        this.removeProcess = function (folder) {
            api.remove({ folder: folder.id });
        };

        this.remove = function (folder) {
            var self = this,
            folder_id = String(this.selection.get());
            if (folder_id) {
                $.when(
                    api.get({ folder: folder_id }),
                    require(['io.ox/core/tk/dialogs'])
                ).done(function (folder, dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt('Do you really want to delete folder "%s"?', folder.title))
                        .addPrimaryButton('delete', gt('Delete'))
                        .addButton('cancel', gt('Cancel'))
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                self.removeProcess(folder);
                            }
                        });
                });
            }
        };

        this.renameProcess = function (folder, changes) {
            return api.update({ folder: folder, changes: changes });
        };

        this.rename = function (folder) {
            var self = this,
            folder_id = String(this.selection.get());
            if (folder_id) {
                $.when(
                    api.get({ folder: folder_id }),
                    require(['io.ox/core/tk/dialogs'])
                )
                .done(function (folder, dialogs) {
                    if (folder.standard_folder) {
                        notifications.yell('error', gt('This is a standard folder, which can\'t be renamed.'));
                        return;
                    }
                    new dialogs.ModalDialog({
                        async: true,
                        easyOut: true,
                        width: 400
                    })
                    .header(
                        $('<h4>').text(gt('Rename folder'))
                    )
                    .build(function () {
                        this.getContentNode().append(
                            $('<div class="row-fluid">').append(
                                api.getBreadcrumb(folder.id, { subfolders: false }),
                                $('<input>', { type: 'text' })
                                .val(folder.title)
                                .attr('placeholder', gt('Folder name'))
                                .addClass('span12')
                                .on('keypress', { popup: this, action: 'rename' }, fnKeyPress)
                            )
                        );
                    })
                    .addPrimaryButton('rename', gt('Rename'))
                    .addButton('cancel', gt('Cancel'))
                    .on('rename', function () {
                        self.renameProcess(folder.id, { title: this.getContentNode().find('input').val() })
                            .always(this.close);
                    })
                    .show(function () {
                        this.find('input').focus();
                    });
                });
            }
        };

        this.subscribe = function (data) {

            var name = data.app.getName(),
                POINT = name + '/folderview',
                folderCache = new cache.SimpleCache('folder-all', false),
                subFolderCache = new cache.SimpleCache('subfolder-all', false),
                storage = {
                folderCache: folderCache,
                subFolderCache: subFolderCache
            };

            var options;
            _(ext.point(POINT + '/options').all()).each(function (obj) {
                options = _.extend(obj, options || {});
            });

            var container = $('<div>'),
                tree = new ApplicationFolderTree(container, {
                type: options.type,
                rootFolderId: options.rootFolderId,
                checkbox: true,
                all: true,
                storage: storage
            });

            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                var pane = new dialogs.ModalDialog({
                    width: 500,
                    addclass: 'subscribe-imap-folder',
                    easyOut: true
                });
                var changesArray = [];

                pane.header(
                    $('<h4>').text(gt('Subscribe IMAP folders'))
                )
                .build(function () {
                    this.getContentNode().append(container);
                })
                .addPrimaryButton('save', gt('Save'))
                .addButton('cancel', gt('Cancel'))
                .show(function () {
                    tree.paint();
                })
                .done(function (action) {

                    if (action === 'save') {
                        _(changesArray).each(function (change) {
                            api.update(change, storage);
                        });

                        tree.destroy();
                        tree = pane = null;
                    }
                    if (action === 'cancel') {
                        tree.destroy();
                        tree = pane = null;
                    }
                });

                tree.container.on('change', 'input', function () {
                    var folder = $(this).val(),
                        checkboxStatus = $(this).is(':checked'),
                        changes = {subscribed: checkboxStatus},
                        tobBePushed = { folder: folder, changes: changes};
                    changesArray.push(tobBePushed);
                });
            });
        };
    }

    /**
     * Folder tree class
     */
    function FolderTree(container, opt) {

        var self = this;

        // add hard filter for trees (e.g. just show mail folders)
        opt = $.extend({
            filter: function (obj) {
                return obj.module === opt.type || (opt.type === 'mail' && (/^default\d+(\W|$)/i).test(obj.id));
                    // module == type? plus: special handling for external mail accounts
            }
        }, opt);

        FolderStructure.call(this, container, opt);

        // tree node hash
        this.treeNodes = {};
        // root tree node
        this.root = new TreeNode(this, this.options.rootFolderId, this.container, 0, opt.checkbox, opt.all, opt.storage);

        this.internal.paint = function () {
            return this.root.paint();
        };

        this.internal.repaint = function () {
            return this.root.repaint();
        };

        this.toggle = function () {
            var open = _(this.root.getOpenNodes()).flatten();
            this.options.toggle(open);
        };

        this.getNode = function (id) {
            id = String(id);
            return this.treeNodes[id];
        };

        this.removeNode = function (id) {
            id = String(id);
            if (id in this.treeNodes) {
                this.treeNodes[id].destroy();
            }
        };

        this.reloadNode = function (id) {
            id = String(id);
            if (id in this.treeNodes) {
                this.treeNodes[id].reload();
            }
        };

        this.repaintNode = function (id) {
            id = String(id);
            return id in this.treeNodes ? this.treeNodes[id].repaint() : $.when();
        };

        this.selection.on('change', function (e, selection) {
            var id = _(selection).first();
            if (id) { self.options.select(id); }
        });

        function deferredEach(list, done) {
            var top = list.shift(), node;
            if (list.length && top && (node = this.getNode(top))) {
                node.open().done(function () {
                    deferredEach.call(self, list, done);
                });
            } else {
                done();
            }
        }

        this.select = function (data) {
            // unpack array; pluck 'id'
            data = _.isArray(data) ? data[0] : data;
            data = _.isString(data) ? data : String(data.id);
            // get path
            return api.getPath({ folder: data }).pipe(function (list) {
                var def = $.Deferred();
                deferredEach.call(self, _(list).pluck('id'), function () {
                    self.selection.set(data);
                    def.resolve();
                });
                return def;
            });
        };
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

    // customization extension point
    ext.point('io.ox/foldertree/folder').extend({
        index: 100,
        id: 'default',
        customize: function (data, options) {

            var label = this.find('.folder-label'),
                counter = this.find('.folder-counter');

            // selectable?
            var hasProperType = !options.type || options.type === data.module,
                isSelectable = hasProperType, // so: all folder that I can see
                isReadable = isSelectable && api.can('read', data),
                isExpandable = !!data.subfolders;

            if (isExpandable) { this.addClass('expandable'); }
            if (!isReadable) { this.addClass('unreadable'); }
            if (!isSelectable) { this.removeClass('selectable').addClass('unselectable'); }

            // set title
            label.text(_.noI18n(data.title));
            // set counter (mail only)
            if (options.type === 'mail' && data.unread && !options.checkbox) {
                this.addClass('show-counter');
                counter.find('span').text(gt.noI18n(data.unread || ''));
            } else {
                this.removeClass('show-counter');
            }
        }
    });

    function openPubSubSettings(e) {
        var options = { id: 'io.ox/core/pubsub', folder: e.data.folder.id, data: e.data.folder };
        ox.launch('io.ox/settings/main', options).done(function () {
            this.setSettingsPane(options);
        });
    }

    ext.point('io.ox/foldertree/folder').extend({
        index: 200,
        id: 'published',
        customize: function (data) {
            if (capabilities.has('publication') && api.is('published|subscribed', data)) {
                this.find('.folder-label').append(
                    $('<i class="icon-cloud-download folder-pubsub">').attr('title', gt('This folder has publications and/or subscriptions'))
                    .on('click', { folder: data }, openPubSubSettings)
                );
            }
        }
    });

    function openPermissions(e) {
        require(['io.ox/core/permissions/permissions'], function (controller) {
            controller.show(e.data.folder);
        });
    }

    ext.point('io.ox/foldertree/folder').extend({
        index: 300,
        id: 'shared',
        customize: function (data) {
            if (api.is('unlocked', data)) {
                this.find('.folder-label').append(
                    $('<i class="icon-unlock folder-pubsub">').attr('title', gt('You share this folder with other users'))
                    .on('click', { folder: data.id }, openPermissions)
                );
            }
        }
    });

    var sections = { 'private': gt('Private'), 'public': gt('Public'), 'shared': gt('Shared') };

    function FolderList(container, opt) {

        FolderStructure.call(this, container, opt);

        var self = this;

        function drawFolder(data) {

            var folder = tmplFolder.clone()
                .append(
                    $('<span>').addClass('folder-label')
                )
                .attr('data-obj-id', data.id);

            // add owner for shared folders
            if (api.is('shared', data)) {
                folder.append(
                    $('<div>').addClass('shared-by').append(
                        userAPI.getLink(data.created_by, data['com.openexchange.folderstorage.displayName'])
                    )
                );
            }

            // update selection
            self.selection.addToIndex(data.id);

            // invoke extension points
            ext.point('io.ox/foldertree/folder').invoke('customize', folder, data, opt);

            return folder;
        }

        function paint(options) {
            options = $.extend({
                type: opt.type
            }, options || {});

            self.busy();

            return api.getVisible(options).done(function (data) {
                var id, section,
                    drawSection = function (node, list) {
                        // loop over folders
                        _(list).each(function (data) {
                            node.append(drawFolder(data));
                        });
                    };
                // idle
                self.idle();
                // loop over sections
                for (id in sections) {
                    if (data[id]) {
                        self.container.append(
                            section = $('<div>').addClass('section')
                            .append(
                                $('<div>').addClass('section-title').text(sections[id])
                            )
                        );
                        drawSection(section, data[id]);
                    }
                }
            })
            .done(function () {
                self.selection.update();
            })
            .fail(function (error) {
                self.container.append(
                    $.fail(gt('Couldn\'t load folders.'), function () {
                        self.internal.repaint();
                    })
                );
                self.idle();
            });
        }

        this.internal.paint = function () {
            return paint();
        };

        this.internal.repaint = function () {
            self.container.empty();
            return paint({ cache: false });
        };

        // removeNode should not trigger repaint; just be busy
        this.removeNode = function () {
            this.busy();
        };

        this.select = function (data) {
            this.selection.set(data);
            return $.when();
        };

        api.on('delete', function () {
            self.repaint();
        });
    }

    return {
        FolderList: FolderList,
        FolderTree: FolderTree,
        ApplicationFolderTree: ApplicationFolderTree
    };

});
