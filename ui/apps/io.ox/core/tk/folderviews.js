/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
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
     'io.ox/core/folder/api',
     'io.ox/core/api/user',
     'io.ox/core/api/account',
     'io.ox/core/extensions',
     'io.ox/core/event',
     'io.ox/core/notifications',
     'io.ox/core/http',
     'io.ox/core/capabilities',
     'settings!io.ox/core',
     'gettext!io.ox/core'
    ], function (Selection, api, userAPI, accountAPI, ext, Events, notifications, http, capabilities, settings, gt) {

    'use strict';

    if (ox.debug) console.warn('Module "io.ox/core/tk/folderviews" is deprecated.');

    var OPEN = 'fa fa-chevron-right',
        CLOSE = 'fa fa-chevron-down',
        hasFolderIcons = settings.get('features/folderIcons', false),

        // for small devices like smartphons
        SMALL_FOLDER_PADDING = 15,
        // for mouse-based devices (could be smaller but irrelevant) and for fat finger support
        DESKTOP_FOLDER_PADDING = 30,
        SUB_PADDING = _.device('small') ? SMALL_FOLDER_PADDING : DESKTOP_FOLDER_PADDING,

        tmplFolder = $('<div class="folder selectable" role="treeitem" tabindex="-1">'),
        tmplFolderDisabled = $('<div class="folder disabled" tabindex="-1">'),
        tmplSub = $('<div class="subfolders"role="group">').hide(),

        TRUE = function () { return true; };

    /**
     * Tree node class
     */
    function TreeNode(tree, id, container, level, checkbox, all, storage) {
        // load folder data immediately
        var ready = api.get(id, { storage: storage }),
            nodes = {},
            children = null,
            childrenLoaded,
            painted = false,
            detached = true,
            loading = null,
            wasOpen = false,
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

                if (loading && loading.state() === 'pending') return loading;

                // remove potential fail messages from previous refreshes
                nodes.sub.find('.io-ox-fail').parent().remove();

                // be busy
                if (children === null && isOpen()) nodes.sub.busy().show();

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
                    .then(
                        function success(children) {
                            // tricky one liner: we invoke 'paint' for all child nodes.
                            // invoke returns a nice array of all return values which all are deferred objects.
                            // we use this array to feed $.when(). Thus, we get a proper combined deferred object
                            // that will be resolved once all child nodes are resolved.
                            if (!children || children.length === 0) {
                                // Robustness. Sometimes the folder interface seems unsure about subfolders.
                                nodes.sub.idle().hide();
                                hideArrow();
                                return $.when();
                            } else {
                                wasOpen = true;
                            }
                            return $.when.apply(null, _(children).invoke(method, nodes.sub));
                        },
                        function fail() {
                            // reset folder and show local error
                            nodes.sub.idle().empty().append(
                                $.fail(gt('Couldn\'t load subfolders.'), function () {
                                    drawChildren(reload, method);
                                })
                                .attr('data-folder-id', id)
                            );
                            return $.when();
                        }
                    )
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
                var className = hasChildren() ? (isOpen() ? CLOSE : OPEN) : 'fa fa-fw';
                if (hasChildren()) {
                    nodes.folder.attr('aria-expanded', isOpen() ? 'true' : 'false');
                } else {
                    nodes.folder.removeAttr('aria-expanded');
                }
                nodes.arrow.find('i').attr('class', className);
                if (hasFolderIcons) {
                    var folderClass = 'fa fa-';
                    if (accountAPI.is('trash', self.id)) {
                        folderClass += 'trash-o special';
                    } else if (accountAPI.is('inbox', self.id)) {
                        folderClass += 'inbox special';
                    } else if (accountAPI.is('sent', self.id)) {
                        folderClass += (hasChildren() ? 'send special' : 'send-o special');
                    } else if (accountAPI.is('drafts', self.id)) {
                        folderClass += 'file-o special';
                    } else {
                        folderClass += isOpen() ? 'folder-open-o' : 'folder-o';
                    }
                    nodes.icon.find('i').attr('class', folderClass);
                }
                if (childrenLoaded && !children) {
                    hideArrow();
                }
            },

            hideArrow = function () {
                nodes.arrow.find('i').attr('class', 'fa fa-fw');
            },

            openNode = function () {
                if (!hasChildren() || open) {
                    return $.when();
                }
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
                return $.when();
            },

            toggleNode = function () {
                if (!open) {
                    return openNode().then(function () {
                        return tree.repaint();
                    });
                } else {
                    closeNode();
                    return tree.repaint();
                }
            },

            // open/close tree node
            toggleState = function (e) {
                // not valid click?
                if (e.type === 'dblclick') return;
                var node = $(this);
                if (node.hasClass('folder-arrow') || (node.hasClass('folder-label') && node.closest('.folder').hasClass('unselectable'))) {
                    // avoid selection; allow for unreadable
                    e.preventDefault();
                    toggleNode();
                }
            };

        // make accessible
        this.id = String(id);

        // store in hash for quick access
        tree.treeNodes[this.id] = this;

        // open & close
        this.open = openNode;
        this.close = closeNode;
        this.toggle = toggleNode;

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

        this.refresh = function (newId) {
            // might have a new id
            id = newId;
            return $.when(
                ready = api.get(newId, { storage: storage }),
                this.loadChildren(true)
            )
            .pipe(function (data) {
                // repaint parent node since a changed title also changes the folder order
                tree.getNode(data.folder_id).repaint();
            });
        };

        // update promise
        this.reload = function () {
            return (ready = api.get(id, { storage: storage })).done(function (promise) {
                data = promise;
                children = _.isArray(children) && children.length === 0 ? null : children;
                updateArrow();
                self.customize();
            });
        };

        this.data = function (obj) {
            if (!arguments.length) {
                return data;
            } else {
                data = obj;
                return this;
            }
        };

        // load sub folders - creates instances of TreeNode - does not yet paint them
        this.loadChildren = function (reload) {

            var hash = {};

            if (children === null || reload === true) {
                // build hash?
                if (children !== null && reload === true) {
                    _(children).each(function (node) {
                        hash[node.id] = node;
                    });
                }
                childrenLoaded = false;
                // we assume that folder API takes care of clearing caches for periodic refreshes
                // get sub folders
                return api.list(id, { all: all, storage: storage }).then(function success(data) {
                    // create new children array
                    children = _.chain(data)
                        .filter(function (folder) {
                            // ignore system folders without sub folders, e.g. 'Shared folders'
                            return (folder.module !== 'system' || folder.subfolders) && filter(folder);
                        })
                        .map(function (folder) {
                            if (hash[folder.id] !== undefined) {
                                // reuse but update data
                                var node = hash[folder.id].data(folder);
                                delete hash[folder.id];
                                return node;
                            } else {
                                // new node
                                return new TreeNode(tree, folder.id, nodes.sub, skip() ? level : level + 1, checkbox, all, storage);
                            }
                        })
                        .value();
                    childrenLoaded = true;
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
                    // draw children? check wasOpen cause we might have to draw
                    // newly added subfolders (which won't appear for closed folders)
                    if (wasOpen || isOpen()) {
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
                nodes.folder.css('paddingLeft', (0 + level * SUB_PADDING) + 'px');
            }

            nodes.folder.attr('data-offset-left', level * SUB_PADDING);

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
                    nodes.arrow = $('<div class="folder-arrow" role="presentation"><i class="fa fa-chevron-right"></i></div>');
                    nodes.icon = hasFolderIcons ? $('<div class="folder-icon" role="presentation"><i class="fa fa-folder"></i></div>') : $();
                    nodes.label = $('<div class="folder-label">');
                    nodes.counter = $('<div class="folder-counter">').append('<span class="folder-counter-badge">');
                    nodes.subscriber = $('<input>').attr({ 'type': 'checkbox', 'name': 'folder', tabindex: -1, 'value': data.id });
                    if (data.subscribed) {
                        nodes.subscriber.prop('checked', true);
                    }
                }  else {
                    //potential workaround for bug 24377 (horizontal folder duplicates)
                    return isOpen() ? paintChildren() : $.when();
                }

                // draw children
                var def = isOpen() ? paintChildren() : $.when();
                updateArrow();
                // add to DOM
                // (data.own_rights & 0x3f80 /* read access */) || data.subscribed /* to get rid of folder */)
                if (checkbox) {
                    if (!(data.own_rights & 0x3f80) && !data.subscribed) {
                        nodes.subscriber.prop('disabled', true);
                        nodes.subscriber.prop('checked', false);
                    }
                    nodes.folder.append(nodes.arrow, nodes.icon, $('<div>').addClass('subscribe-wrapper').append(nodes.subscriber), nodes.label, nodes.counter);
                } else {
                    nodes.folder.append(nodes.arrow, nodes.icon, nodes.label, nodes.counter);
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

        this.getNodes = function () {
            return nodes;
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
            select: $.noop,
            tabindex: 1
        }, opt);

        this.internal = { destroy: $.noop };

        this.activeElement = null;

        // ref
        var self = this;

        $(container)
            .addClass('io-ox-foldertree f6-target' + (hasFolderIcons ? ' folder-icons' : ''))
            .attr({ role: 'tree', 'aria-label': gt('Folder view') })
            // add tree container
            .append(this.container = $('<div class="folder-root">'));

        // selection
        var selectionContainer = container.parent().is('.foldertree-container') ? container.parent() : container;
        // not this.container!
        Selection.extend(this, selectionContainer, { dropzone: true, dropType: 'folder', tabFix: this.options.tabindex })
            .setMultiple(false)
            .setSerializer(function (obj) {
                return obj ? String(obj.id) : '';
            });

        // add event hub
        Events.extend(this);

        this.selection.keyboard(container, true);

        this.paint = function () {
            var p = this.paint;
            if (p.running === null) {
                this.trigger('beforepaint');
                this.selection.clearIndex();
                p.running = this.internal.paint.call(this) || $.when();
                p.running.always(function () {
                    self.selection.updateIndex();
                    self.trigger('paint');
                    p.running = null;
                });
            }
            return p.running || $.when();
        };

        this.paint.running = null;

        this.repaint = function () {
            var p = this.paint;
            if ($.contains(container[0], document.activeElement)) {
                this.activeElement = $(document.activeElement);
            }
            if (p.running === null) {
                this.trigger('beforerepaint');
                this.selection.clearIndex();
                p.running = (this.internal.repaint || this.internal.paint).call(this) || $.when();
                p.running.always(function () {
                    self.selection.updateIndex();
                    self.trigger('repaint');
                    if (self.activeElement) {
                        var folderview = self.activeElement.parents('.foldertree-container'),
                            node, vertical, position;
                        //identify usage: folder view or dialog
                        node = (folderview.length ? folderview : self.activeElement.parents('.io-ox-foldertree')) || $();
                        //set data to restore state
                        vertical = node.scrollTop();
                        position = node.css('position');
                        //in some cases IE flickers without this hack
                        node.css('position', 'fixed');
                        self.activeElement.focus();
                        node.css('position', position)
                            .scrollTop(vertical);
                    }
                    p.running = self.activeElement = null;
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
            var self = this;
            return $.when(this.paint.running || $.when()).done(function () {
                self.events.destroy();
                self.selection.destroy();
                self.internal.destroy();
                container.empty();
                //trigger event so eventhandlers for repainting can be removed
                container.trigger('destroy');
                container = self.container = self.selection = self.internal = null;
            });
        };

        function fnKeyPress(e) {
            if (e.which === 13) {
                e.data.popup.invoke(e.data.action);
            }
        }

        function reloadTrash() {
            if (self.options.type === 'infostore') {
                require(['settings!io.ox/files'], function (fileSettings) {
                    var trash = fileSettings.get('folder/trash');
                    if (trash) {
                        api.reload(trash);
                        api.sync();
                    }
                });
            }
        }

        this.removeProcess = function (folder) {
            api.remove(folder.id)
               .always(reloadTrash)
               .fail(notifications.yell);
        };

        this.remove = function () {
            var self = this, folder_id = String(this.selection.get());
            if (!folder_id) return;
            $.when(
                api.get(folder_id),
                require(['io.ox/core/tk/dialogs'])
            ).done(function (folder, dialogs) {
                new dialogs.ModalDialog()
                .text(gt('Do you really want to delete folder "%s"?', api.getFolderTitle(folder.title, 30)))
                .addPrimaryButton('delete', gt('Delete'))
                .addButton('cancel', gt('Cancel'))
                .show()
                .done(function (action) {
                    if (action === 'delete') self.removeProcess(folder);
                });
            });
        };

        this.renameProcess = function (folder, changes) {

            var invalid = false;

            // check for valid folder name
            ext.point('io.ox/core/filename')
                .invoke('validate', null, changes.title, 'folder')
                .find(function (result) {
                    if (result !== true) {
                        notifications.yell('warning', result);
                        return (invalid = true);
                    }
                });

            if (invalid) return $.Deferred().reject();

            return api.update(folder, changes);
        };

        this.rename = function () {
            var self = this,
            folder_id = String(this.selection.get());
            if (folder_id) {
                $.when(
                    api.get(folder_id),
                    require(['io.ox/core/tk/dialogs'])
                )
                .done(function (folder, dialogs) {
                    if (folder.standard_folder) {
                        notifications.yell('error', gt('This is a standard folder, which can\'t be renamed.'));
                        return;
                    }
                    new dialogs.ModalDialog({
                        async: true,
                        width: 400
                    })
                    .header(
                        $('<h4>').text(gt('Rename folder'))
                    )
                    .build(function () {
                        this.getContentNode().append(
                            $('<form role="form">').append(
                                $('<input class="form-control">', { type: 'text' })
                                .val(folder.title)
                                .attr('placeholder', gt('Folder name'))
                                .on('keypress', { popup: this, action: 'rename' }, fnKeyPress)
                            )
                        );
                    })
                    .addPrimaryButton('rename', gt('Rename'))
                    .addButton('cancel', gt('Cancel'))
                    .on('rename', function () {
                        self.renameProcess(folder.id, { title: this.getContentNode().find('input').val() })
                            .then(this.close, this.idle);
                    })
                    .show(function () {
                        this.find('input').focus();
                    });
                });
            }
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
        })
        .on('keyboard', function (event, origEvent, key) {
            var id = this.get(),
                treeNode = self.getNode(id);
            switch (key) {
            case 39:
                origEvent.preventDefault();
                // cursor right
                if (treeNode && !treeNode.isOpen()) {
                    treeNode.open().done(function () {
                        self.selection.updateIndex();
                    });
                }
                break;
            case 37:
                // cursor left
                origEvent.preventDefault();
                if (treeNode && treeNode.isOpen()) {
                    treeNode.close().done(function () {
                        self.selection.updateIndex();
                    });
                }
                break;
            case 32:
                // space
                // disable space on checkbox option
                if (opt.checkbox) {
                    origEvent.preventDefault();
                    var chkbox = treeNode.getNodes().subscriber;
                    // toggle checkbox
                    chkbox
                        .prop('checked', !chkbox.prop('checked'))
                        .trigger('change');
                    return false;
                }
                treeNode.toggle();
                break;
            case 13:
                // enter
                // prevent toggle on contextmenu
                if (origEvent.target && $(origEvent.target).hasClass('folder-options-badge')) return;
                treeNode.toggle();
                break;
            }
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
            if (data) {
                // unpack array; pluck 'id'
                data = _.isArray(data) ? data[0] : data;
                data = _.isObject(data) ? String(data.id) : String(data);
                // get path
                return api.path(data).pipe(function (list) {
                    var def = $.Deferred();
                    deferredEach.call(self, _(list).pluck('id'), function () {
                        self.selection.set(data);
                        def.resolve();
                    });
                    return def;
                });
            } else {
                return $.when();
            }
        };
    }

    function ApplicationFolderTree(container, opt) {
        // inherit from folder tree
        FolderTree.call(this, container, opt);
        // add link container
        $(container).append(this.links = $('<div class="foldertree-links-deprecated">'));
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
                counter = this.find('.folder-counter'),
                // so: all folder that I can see
                isSelectable = !options.type || options.type === data.module,
                isReadable = isSelectable && api.can('read', data),
                isEnabled = !(options.targetmode && isReadable && !api.can('create', data)),
                labelTitle = data.title,
                cls = '';

            // add options (only if 'app' is defined; should not appear in modal dialogs, for example)
            if (options.app && this.find('.folder-options').length === 0) {
                (counter.length ? counter : label).after(
                    $('<span class="folder-options">').append(
                        $('<a href="#" class="folder-options-badge" tabindex="1">')
                        .attr('title', gt('Folder-specific actions'))
                        .append($('<i class="fa fa-cog"></i></span>'))
                    )
                );
            }

            // set counter (mail only)
            if (options.type === 'mail') {

                // set title
                var total = data.total && data.total !== 0 ? ' - ' + gt('total') + ' ' + data.total : '',
                    unread = data.unread && data.unread !== 0 ? ' - ' + gt('unread') + ' ' + data.unread : '';
                labelTitle = data.title + total + unread;

                // rename root
                if (options.skipRoot === false && data.module === 'system') {
                    // rename mail root folder
                    data.title = gt('Mail');
                }

                if (_.device('!small') && data.id === 'default0/INBOX' && (!data.unread  || data.unread === 0)) {
                    // remove new mail title if inbox new-mail counter is 0
                    require('io.ox/mail/api').newMailTitle(false);

                }
                if (data.unread && !options.checkbox) {
                    this.addClass('show-counter');
                    counter.find('span').text(gt.noI18n(data.unread || ''));
                } else {
                    this.removeClass('show-counter');
                }
            } else {
                this.removeClass('show-counter');
            }

            // add css classes
            if (!isEnabled) { cls += 'disabled '; isSelectable = false; }
            if (!!data.subfolders) { cls += 'expandable '; }
            if (!isReadable) { cls += 'unreadable '; }
            cls += (!isSelectable ? 'un' :'') + 'selectable';

            this.addClass(cls)
                .attr('aria-label', labelTitle);

            label.attr('title', labelTitle).empty().append(
                $('<span class="short-title">').text(_.noI18n(api.getFolderTitle(data.title, 20))),
                $('<span class="long-title">').text(_.noI18n(data.title))
            );
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
        customize: function (data, options) {

            this.find('.fa-cloud-download.folder-pubsub').remove();

            if (!options.app) return;
            if (!capabilities.has('publication') || !api.is('published|subscribed', data)) return;

            this.append(
                $('<i class="fa fa-cloud-download folder-pubsub">').attr('title', gt('This folder has publications and/or subscriptions'))
                .on('click', { folder: data }, openPubSubSettings)
            );
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
        customize: function (data, options) {

            this.find('.fa-unlock.folder-pubsub').remove();

            if (!options.app) return;
            if (!api.is('unlocked', data)) return;

            this.append(
                $('<i class="fa fa-unlock folder-pubsub">').attr('title', gt('You share this folder with other users'))
                .on('click', { folder: data.id }, openPermissions)
            );
        }
    });

    ext.point('io.ox/foldertree/folder').extend({
        index: 'last',
        id: 'shared-by',
        customize: function (data) {

            // add owner for shared folders
            if (!api.is('shared', data)) return;

            this.append(
                $('<div class="shared-by">').append(
                    userAPI.getLink(data.created_by, data['com.openexchange.folderstorage.displayName']).attr({ tabindex: -1 })
                )
            );
        }
    });

    var sections = { 'private': gt('Private'), 'public': gt('Public'), 'shared': gt('Shared'), 'hidden': gt('Hidden folders') };

    ext.point('io.ox/foldertree/section').extend({
        index: 100,
        id: 'headline',
        draw: function (baton) {
            // headline if more than one section contains elements and this section contains elements
            if (!baton.showHeadlines || !baton.data[baton.id] || baton.data[baton.id].length === 0) return;
            //hidden is a special section that has a dropdown link instead of a normal headline
            if (baton.id !== 'hidden') {
                this.append(
                    $('<div class="section-title">').text(sections[baton.id])
                );
            } else {
                var container = $('<div class="hidden-folders-container">').hide(),
                    arrow = $('<i class="hidden-folders-icon fa fa-caret-right">');
                this.append($('<div class="section-title hidden-folders-link">').text(sections[baton.id])
                    .on('click', function (e) {
                        e.preventDefault();
                        container.toggle();
                        arrow.toggleClass('fa-caret-right fa-caret-down');
                        //hidden items are not in the selection, so it must be updated
                        baton.selection.updateIndex();
                    }).append(arrow), container);
            }
        }
    });

    ext.point('io.ox/foldertree/section').extend({
        index: 200,
        id: 'folder-list',
        draw: function (baton) {
            // loop over folders
            _(baton.data[baton.id]).each(function (data) {
                ext.point('io.ox/foldertree/section/folder').invoke('draw', (baton.id === 'hidden' ? this.find('.hidden-folders-container'): this), baton.clone({ data: data }));
            }, this);
        }
    });

    ext.point('io.ox/foldertree/section/folder').extend({
        draw: function (baton) {
            var isEnabled = !(baton.options.targetmode && !api.can('create', baton.data)),
                folder = isEnabled ? tmplFolder.clone() : tmplFolderDisabled.clone();

            folder.append('<span class="folder-label">').attr('data-obj-id', baton.data.id);
            // update selection
            if (isEnabled) {
                baton.selection.addToIndex(baton.data.id);
            }
            // invoke extension points
            ext.point('io.ox/foldertree/folder').invoke('customize', folder, baton.data, baton.options);
            this.append(folder);
        }
    });

    ext.point('io.ox/foldertree/section').extend({
        index: 300,
        id: 'links',
        draw: function (baton) {
            var links = $('<div class="folder-section-links">');
            ext.point('io.ox/foldertree/section/links').invoke('draw', links, baton);
            this.append(links);
        }
    });

    function FolderList(container, opt) {

        FolderStructure.call(this, container, opt);

        var self = this;

        function paint(options) {

            options = $.extend({
                type: opt.type,
                module: opt.type
            }, options || {});

            self.busy();

            return api.flat(options).done(function (data) {
                var id,
                    section,
                    baton,
                    showHeadlines = Object.keys(data).length > 1;
                // idle
                self.idle();
                //apply blacklist to hide folders
                var hidden = [],
                    items,
                    blacklist = (!opt.app) ? {} : opt.app.settings.get('folderview/blacklist', {}),
                    blacklistCheck = function (folder) {
                        var check = blacklist[folder.id];
                        if (check) {
                            hidden.push(folder);
                        }
                        return !check;
                    };

                //not id in data here, too keep the same order
                for (items in sections) {
                    //exclude hidden and sections that are not present
                    if (items !== 'hidden' && data[items]) {
                        data[items] = _(data[items]).filter(blacklistCheck);
                    }
                }
                if (hidden.length > 0) {
                    data.hidden = hidden;
                }

                // loop over sections
                for (id in sections) {
                    if (data[id]) {
                        section = $('<div class="section">');
                        baton = new ext.Baton({
                            app: opt.app,
                            id: id,
                            data: data,
                            showHeadlines: showHeadlines,
                            selection: self.selection,
                            options: opt
                        });
                        ext.point('io.ox/foldertree/section').invoke('draw', section, baton);
                        self.container.append(section);
                    }
                }
            })
            .fail(function () {
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

        //wrapper function to bind and unbind repaint function
        function eventHandler() {
            self.repaint();
        }

        api.on('delete create', eventHandler);

        container.one('destroy', function () {
            api.off('delete create', eventHandler);
        });
    }

    return {
        FolderList: FolderList,
        FolderTree: FolderTree,
        ApplicationFolderTree: ApplicationFolderTree
    };

});
