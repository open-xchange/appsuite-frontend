/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/sidebar/fileversionsview', [
    'io.ox/core/viewer/views/sidebar/panelbaseview',
    'io.ox/core/extensions',
    'io.ox/backbone/views/action-dropdown',
    'io.ox/backbone/views/actions/util',
    'io.ox/files/api',
    'io.ox/core/api/user',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core/viewer'
], function (PanelBaseView, Ext, ActionDropdownView, actionsUtil, FilesAPI, UserAPI, Util, gt) {

    'use strict';

    var POINT = 'io.ox/core/viewer/sidebar/versions',
        Action = actionsUtil.Action,
        getSortedVersions = function (versions) {

            var versionSorter = function (version1, version2) {
                // current version always on top
                if (version1.current_version) {
                    return -versions.length;
                } else if (version2.current_version) {
                    return versions.length;
                }
                return version2.last_modified - version1.last_modified;
            };

            // avoid unnecessary model changes / change events
            return _.clone(versions).sort(versionSorter);
        };

    // Extensions for the file versions list
    Ext.point(POINT + '/list').extend({
        index: 10,
        id: 'versions-list',
        draw: function (baton) {
            var model = baton && baton.model,
                standalone = Boolean(baton && baton.standalone),
                isViewer = Boolean(baton && baton.isViewer),
                viewerEvents = baton && baton.viewerEvents,
                versions = model && model.get('versions'),
                panelHeading = this.find('.sidebar-panel-heading'),
                panelBody = this.find('.sidebar-panel-body'),
                versionCounter = 1,
                isUpToDate = _.contains(_.pluck(versions, 'version'), model.get('version')),
                tableNode,
                versionCounterSupport = !(/^(owncloud|webdav|nextcloud)$/.test(model.get('folder_id').split(':')[0]));

            function getVersionsTable() {

                var table = $('<table>').addClass('versiontable table').attr('data-latest-version', (versions.length > 0) && _.last(versions).version).append(
                    $('<caption>').addClass('sr-only').text(gt('File version table, the first row represents the current version.')),
                    $('<thead>').addClass('sr-only').append(
                        $('<tr>').append(
                            $('<th>').text(gt('File'))
                        )
                    )
                );

                _(getSortedVersions(versions)).each(function (version, id, versions) {
                    var entryRow = $('<tr class="version">').attr('data-version-number', version.version);
                    Ext.point(POINT + '/version').invoke('draw', entryRow, Ext.Baton({ data: version, viewerEvents: viewerEvents, isViewer: isViewer, standalone: standalone, latestVersion: versionCounter === versions.length, last_modified: id === 0 }));
                    table.append(entryRow);
                    versionCounter++;
                });
                return table;
            }

            if (versionCounterSupport) {
                if (!model || !_.isArray(versions)) {
                    panelBody.empty();
                    return;
                }
            }

            var def = isUpToDate ? $.when(versions) : FilesAPI.versions.load(model.toJSON(), { cache: false, adjustVersion: !versionCounterSupport });

            return def.then(function (allVersions) {
                versions = allVersions;
                tableNode = getVersionsTable();
                panelHeading.idle();
                panelBody.empty();
                panelBody.append(tableNode);
            });
        }
    });

    // View a specific version
    Ext.point('io.ox/files/versions/links/inline/current').extend({
        id: 'display-version',
        index: 100,
        prio: 'lo',
        mobile: 'lo',
        title: gt('View this version'),
        section: 'view',
        ref: 'io.ox/files/actions/viewer/display-version'
    });

    Ext.point('io.ox/files/versions/links/inline/older').extend({
        id: 'display-version',
        index: 100,
        prio: 'lo',
        mobile: 'lo',
        title: gt('View this version'),
        section: 'view',
        ref: 'io.ox/files/actions/viewer/display-version'
    });

    new Action('io.ox/files/actions/viewer/display-version', {
        capabilities: 'infostore',
        matches: function (baton) {
            var versionSpec = baton.first();
            if (!baton.isViewer) { return false; }
            // Spreadsheet supports display of current version only
            // for external storages: current_version = true, attribute not present -> current version
            if ((versionSpec.current_version === false) && FilesAPI.isSpreadsheet(versionSpec)) { return false; }
            return true;
        },
        action: function (baton) {
            if (!baton.viewerEvents) { return; }
            baton.viewerEvents.trigger('viewer:display:version', baton.data);
        }
    });

    // Open a specific version in Popout Viewer
    Ext.point('io.ox/files/versions/links/inline/current').extend({
        id: 'open-version-in-popout-viewer',
        index: 120,
        prio: 'lo',
        mobile: 'lo',
        title: gt('Open in pop out viewer'),
        section: 'view',
        ref: 'io.ox/files/actions/viewer/popout-version'
    });

    Ext.point('io.ox/files/versions/links/inline/older').extend({
        id: 'open-version-in-popout-viewer',
        index: 120,
        prio: 'lo',
        mobile: 'lo',
        title: gt('Open in pop out viewer'),
        section: 'view',
        ref: 'io.ox/files/actions/viewer/popout-version'
    });

    new Action('io.ox/files/actions/viewer/popout-version', {
        capabilities: 'infostore',
        device: '!smartphone',
        matches: function (baton) {
            var versionSpec = baton.first();
            if (!baton.isViewer) { return false; }
            if (baton.standalone) { return false; }
            // Spreadsheet supports display of current version only
            // for external storages: current_version = true, attribute not present -> current version
            if ((versionSpec.current_version === false) && FilesAPI.isSpreadsheet(versionSpec)) { return false; }
            return true;
        },
        action: function (baton) {
            actionsUtil.invoke('io.ox/core/viewer/actions/toolbar/popoutstandalone', Ext.Baton({
                data: baton.data,
                model: new FilesAPI.Model(baton.data),
                isViewer: baton.isViewer,
                openedBy: baton.openedBy,
                standalone: baton.standalone
            }));
        }
    });

    // Extensions for the version detail table
    Ext.point(POINT + '/version').extend({
        index: 10,
        id: 'filename',
        draw: function (baton) {
            // for external storages: current_version = true, attribute not present -> current version
            var isCurrentVersion = baton.data.current_version !== false;
            var versionPoint = isCurrentVersion ? 'io.ox/files/versions/links/inline/current' : 'io.ox/files/versions/links/inline/older';

            if (isCurrentVersion) {
                // fix for the files action edit it needs the model
                baton.models = [FilesAPI.pool.get('detail').get(_.cid(baton.data))];
            }

            var dropdown = new ActionDropdownView({ point: versionPoint });

            dropdown.once('rendered', function () {
                var $toggle = this.$('> .dropdown-toggle');

                if (isCurrentVersion) { $toggle.addClass('current'); }

                Util.setClippedLabel($toggle, baton.data['com.openexchange.file.sanitizedFilename'] || baton.data.filename);
            });

            dropdown.setSelection([baton.data], _(baton).pick('data', 'isViewer', 'viewerEvents', 'latestVersion', 'standalone', 'models'));

            this.append(
                $('<td class="version-content">').append(dropdown.$el)
            );
        }
    });

    // User name
    Ext.point(POINT + '/version').extend({
        id: 'created_by',
        index: 20,
        draw: function (baton) {
            var $node;
            this.find('td:last').append($node = $('<div class="createdby">'));

            UserAPI.getName(baton.data.created_by)
            .done(function (name) {
                Util.setClippedLabel($node, name);
            })
            .fail(function (err) {
                console.warn('UserAPI.getName() error ', err);
                $node.text(gt('unknown'));
            });
        }
    });

    // Modification date
    Ext.point(POINT + '/version').extend({
        id: 'last_modified',
        index: 30,
        draw: function (baton) {
            var isToday = moment().isSame(moment(baton.data.last_modified), 'day'),
                dateString = (baton.data.last_modified) ? moment(baton.data.last_modified).format(isToday ? 'LT' : 'l LT') : '-';

            this.find('td:last').append($('<div class="last_modified">').text(dateString));
        }
    });

    // File size
    Ext.point(POINT + '/version').extend({
        id: 'size',
        index: 40,
        draw: function (baton) {
            var size = (_.isNumber(baton.data.file_size)) ? _.filesize(baton.data.file_size) : '-';
            this.find('td:last').append($('<div class="size">').text(size));
        }
    });

    // Version comment
    Ext.point(POINT + '/version').extend({
        id: 'comment',
        index: 50,
        draw: function (baton) {
            var $node;

            if (!_.isEmpty(baton.data.version_comment)) {
                this.find('td:last').append(
                    $('<div class="comment">').append(
                        $node = $('<span class="version-comment">')
                    )
                );

                Util.setClippedLabel($node, baton.data.version_comment);
            }
        }
    });

    // since a file change redraws the entire view
    // we need to track the open/close state manually
    var open = {};

    /**
     * The FileVersionsView is intended as a sub view of the SidebarView and
     * is responsible for displaying the history of file versions.
     */
    var FileVersionsView = PanelBaseView.extend({

        className: 'viewer-fileversions',

        initialize: function (options) {
            PanelBaseView.prototype.initialize.apply(this, arguments);

            _.extend(this, {
                isViewer: Boolean(options && options.isViewer),
                viewerEvents: options && options.viewerEvents || _.extend({}, Backbone.Events),
                standalone: Boolean(options && options.standalone)
            });

            // initially hide the panel
            this.$el.hide();

            // use current version, if possible
            var currentVersion = FilesAPI.pool.get('detail').get(_.cid(this.model.toJSON()));
            this.model = currentVersion || this.model;

            // attach event handlers
            this.$el.on({
                open: this.onOpen.bind(this),
                close: this.onClose.bind(this)
            });
            this.listenTo(this.model, 'change:number_of_versions change:versions', this.render);
            this.listenTo(this.model, 'change:versions change:current_version change:number_of_versions change:version change:com.openexchange.file.sanitizedFilename', this.renderVersions);
        },

        onOpen: function () {
            var header = this.$('.sidebar-panel-heading').busy();
            // remember
            open[this.model.cid] = true;
            // loading versions will trigger 'change:version' which in turn renders the version list
            FilesAPI.versions.load(this.model.toJSON(), { cache: false })
                .always($.proxy(header.idle, header))
                .done($.proxy(this.renderVersionsAsNeeded, this))
                .fail(function (error) {
                    if (ox.debug) console.error('FilesAPI.versions.load()', 'error', error);
                });
        },

        onClose: function () {
            delete open[this.model.cid];
        },

        render: function () {
            if (!this.model) return this;
            var count = this.model.get('versions') ? this.model.get('versions').length : this.model.get('number_of_versions') || 0;
            this.setPanelHeader(gt('Versions (%1$d)', count));
            // show the versions panel only if we have at least 2 versions
            this.$el.toggle(count > 1);
            this.togglePanel(count > 1 && !!open[this.model.cid]);
            return this;
        },

        /**
         * Render the version list
         */
        renderVersions: function () {
            if (!this.model || !open[this.model.cid]) return this;
            var expectedVersionOrder = _(getSortedVersions(this.model.get('versions') || [])).pluck('version'),
                actualVersionOrder = this.$el.find('.version').map(function (index, node) { return node.getAttribute('data-version-number'); }).get();

            // if we already show the versionlist in exactly that order and length, we have nothing to do => avoid flickering because of needless redraw
            if (JSON.stringify(expectedVersionOrder) === JSON.stringify(actualVersionOrder)) return;
            Ext.point(POINT + '/list').invoke('draw', this.$el, Ext.Baton({ model: this.model, data: this.model.toJSON(), viewerEvents: this.viewerEvents, isViewer: this.isViewer, standalone: this.standalone }));
        },

        renderVersionsAsNeeded: function () {
            // might be disposed meanwhile
            if (!this.$el) return;
            // in case FilesAPI.versions.load will not indirectly triggers a 'change:version'
            // f.e. when a new office document is created and the model
            // is up-to-date when toggling versions pane
            var node = this.$('table.versiontable'),
                model = this.model, versions;
            // is empty
            if (!node.length) return this.renderVersions();
            // missing versions
            versions = model.get('versions') || [];
            if (!versions.length) return this.renderVersions();
            // added and removed same number of versions
            if (node.find('tr.version').length !== versions.length) return this.renderVersions();
            // has difference in version count
            if (node.attr('data-latest-version') !== _.last(versions).version) return this.renderVersions();
        },

        /**
         * Destructor function of this view.
         */
        onDispose: function () {
            this.model = null;
        }
    });

    return FileVersionsView;
});
