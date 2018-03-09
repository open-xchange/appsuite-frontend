/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/folder-select-support', [
    'io.ox/core/folder/api',
    'settings!io.ox/calendar'
], function (folderAPI, settings) {

    'use strict';

    function setFolders(list, opt) {
        var self = this;
        opt = opt || {};
        this.folders = _(list).unique();
        sort.call(this);
        _.defer(function () {
            if (opt.silent !== true) self.app.trigger('folders:change', self.folders);
            settings.set('selectedFolders', self.folders).save();
        });
    }

    function sort() {
        var base = _(folderAPI.pool.models).keys().length,
            failed = [],
            sorted = _(this.folders).sortBy(function (folderId) {
                var folder = folderAPI.pool.models[folderId];
                if (!folder) return failed.push(folderId);
                if (folderAPI.is('private', folder.attributes)) return folder.get('index/flat/event/private');
                if (folderAPI.is('public', folder.attributes)) return folder.get('index/flat/event/public') + base;
                if (folderAPI.is('shared', folder.attributes)) return folder.get('index/flat/event/shared') + base * base;
            });
        if (failed.length === 0) this.folders = sorted;
        // Keep this for debugging purposes
        // else console.error('Sort was impossible due to missing folders in cache. ', failed);
    }

    function FolderSelection(app) {
        _.extend(this, {
            folders: [],
            prevFolders: undefined,
            singleSelection: false,
            app: app
        });

        var initialList = settings.get('selectedFolders');
        if (!initialList || initialList.length === 0) initialList = [folderAPI.getDefaultFolder('calendar')];
        setFolders.call(this, initialList);
    }

    FolderSelection.prototype.isSingleSelection = function () {
        return this.singleSelection;
    };

    FolderSelection.prototype.getData = function () {
        var self = this;
        return $.when.apply($, this.folders.map(function (folder) {
            return folderAPI.get(folder).then(function (folder) {
                if (!folder.subscribed) return;
                return folder;
            }, function () {
                self.remove(folder);
            });
        })).then(function () {
            var data = _(arguments).chain().toArray().compact().value();
            return _.indexBy(data, 'id');
        });
    };

    FolderSelection.prototype.isSelected = function (id) {
        var list = this.prevFolders ? this.prevFolders : this.folders;
        if (_.isObject(id)) id = id.id;
        return list.indexOf(id) >= 0;
    };

    FolderSelection.prototype.list = function () {
        return this.folders;
    };

    FolderSelection.prototype.add = function (folder, opt) {
        if (this.singleSelection) this.reset();
        var list = [].concat(this.folders);
        list.push(folder);
        this.repaintNode(folder);
        setFolders.call(this, list, opt);
    };

    FolderSelection.prototype.remove = function (folder, opt) {
        if (this.singleSelection) this.reset();
        var list = _(this.folders).filter(function (f) {
            return String(f) !== String(folder);
        });
        this.repaintNode(folder);
        setFolders.call(this, list, opt);
    };

    FolderSelection.prototype.setOnly = function (folder) {
        this.singleSelection = true;
        if (!this.prevFolders) this.prevFolders = this.folders;
        this.folders = [].concat([folder]);
        this.app.folderView.tree.$el.addClass('single-selection');
        _.defer(this.app.trigger.bind(this.app, 'folders:change', this.folders));
    };

    FolderSelection.prototype.reset = function () {
        this.singleSelection = false;
        if (!this.prevFolders) return;
        this.folders = this.prevFolders;
        this.prevFolders = undefined;
        this.app.folderView.tree.$el.removeClass('single-selection');
        _.defer(this.app.trigger.bind(this.app, 'folders:change', this.folders));
    };

    FolderSelection.prototype.repaintNode = _.debounce(function (id) {
        var nodes = this.app.treeView.$('[data-id="' + id + '"]');
        nodes.each(function () {
            var node = $(this).data('view');
            if (!node) return;
            node.repaint();
        });
    }, 10);

    return function (app) {
        app.folders = new FolderSelection(app);
    };

});
