/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/sidebar/fileversionsview', [
    'io.ox/core/viewer/views/sidebar/panelbaseview',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/files/api',
    'io.ox/core/api/user',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core/viewer'
], function (PanelBaseView, Ext, LinksPattern, FilesAPI, UserAPI, Util, gt) {

    'use strict';

    var POINT = 'io.ox/core/viewer/sidebar/versions';

    // Extensions for the file versions list
    Ext.point(POINT + '/list').extend({
        index: 10,
        id: 'versions-list',
        draw: function (baton) {
            var model = baton && baton.model,
                versions = model && model.get('versions'),
                panelHeading = this.find('.sidebar-panel-heading'),
                panelBody = this.find('.sidebar-panel-body'),
                table;

            function drawAllVersions(allVersions) {
                _.chain(allVersions)
                .sort(versionSorter)
                .each(function (version) {
                    var entryRow = $('<tr class="version">');

                    Ext.point(POINT + '/version').invoke('draw', entryRow, Ext.Baton({ data: version }));
                    table.append(entryRow);
                });
            }

            function versionSorter (version1, version2) {
                // current version always on top
                if (version1.current_version) {
                    return -versions.length;
                } else if (version2.current_version) {
                    return versions.length;
                }
                return version2.last_modified - version1.last_modified;
            }

            panelBody.empty();
            if (!model || !_.isArray(versions)) { return; }

            table = $('<table>').addClass('versiontable table').append(
                        $('<caption>').addClass('sr-only').text(gt('File version table, the first row represents the current version.')),
                        $('<thead>').addClass('sr-only').append(
                            $('<tr>').append(
                                $('<th>').text(gt('File'))
                            )
                        )
                    );

            drawAllVersions(versions);

            panelHeading.idle();
            panelBody.append(table);
        }
    });

    // Version drop-down
    Ext.point(POINT + '/version/dropdown').extend(new LinksPattern.Dropdown({
        index: 10,
        label: '',
        ref: 'io.ox/files/versions/links/inline'
    }));

    // Extensions for the version detail table
    Ext.point(POINT + '/version').extend({
        index: 10,
        id: 'filename',
        draw: function (baton) {
            baton.label = '';   // the label is set via CSS
            var row,
                $node;

            this.append(
                row = $('<td>').addClass('version-content')
            );

            Ext.point(POINT + '/version/dropdown').invoke('draw', row, baton);
            $node = row.find('div.dropdown > a');
            if (baton.data.current_version) {
                $node.addClass('current');
            }
            Util.setClippedLabel($node, baton.data.filename);
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

            this.find('td:last').append($('<div class="last_modified">').text(gt.noI18n(dateString)));
        }
    });

    // File size
    Ext.point(POINT + '/version').extend({
        id: 'size',
        index: 40,
        draw: function (baton) {
            var size = (_.isNumber(baton.data.file_size)) ? _.filesize(baton.data.file_size) : '-';
            this.find('td:last').append($('<div class="size">').text(gt.noI18n(size)));
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
                        ($node = $('<span class="version-comment">'))
                    )
                );

                Util.setClippedLabel($node, baton.data.version_comment);
            }
        }
    });

    /**
     * The FileVersionsView is intended as a sub view of the SidebarView and
     * is responsible for displaying the history of file versions.
     */
    var FileVersionsView = PanelBaseView.extend({

        className: 'viewer-fileversions',

        initialize: function () {
            // initially hide the panel
            this.$el.hide();
            // attach event handlers
            this.on('dispose', this.disposeView.bind(this));
            this.$el.on('open', this.onOpen.bind(this));
            this.listenTo(this.model, 'change:number_of_versions', this.render);
            this.listenTo(this.model, 'change:versions change:current_version change:number_of_versions change:version change:filename', this.renderVersions);
        },

        onOpen: function () {
            this.$('.sidebar-panel-heading').busy();
            FilesAPI.versions.load(this.model.toJSON(), { cache: false })
            .fail(function (err) {
                console.error('FilesAPI.versions.load()', 'error', err);
            });
            this.renderVersions();
        },

        render: function () {
            if (!this.model) {
                return this;
            }
            var count = this.model.get('number_of_versions') || 0;
            this.setPanelHeader(gt('Versions (%1$d)', _.noI18n(count)));
            // show the versions panel only if we have at least 2 versions
            this.$el.toggle(count > 1);
            return this;
        },

        /**
         * Render the version list
         */
        renderVersions: function () {
            Ext.point(POINT + '/list').invoke('draw', this.$el, Ext.Baton({ model: this.model, data: this.model.toJSON() }));
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            if (this.model) {
                this.model.off().stopListening();
                this.model = null;
            }
        }
    });

    return FileVersionsView;
});
