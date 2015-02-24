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
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/viewer/eventdispatcher',
    'io.ox/files/api',
    'io.ox/core/api/user',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core/viewer'
], function (Ext, LinksPattern, EventDispatcher, FilesAPI, UserAPI, Util, gt) {

    'use strict';

    var POINT = 'io.ox/core/viewer/sidebar/versions';

    // Extensions for the file versions view
    Ext.point(POINT).extend({
        index: 400,
        id: 'versions',
        draw: function (baton) {
            //console.info('FileVersionsView.draw()');
            var panel, panelBody,
                model = baton && baton.model,
                versions = model && model.get('versions'),
                numberOfVersions = model && model.get('numberOfVersions');

            this.empty();
            // mail and PIM attachments don't support versions
            // display versions panel only if number of versions > 2
            if (!model || !model.isDriveFile() || numberOfVersions < 2) { return; }

            // render panel
            panel = Util.createPanelNode({
                title: gt('Versions (%1$d)', _.noI18n(numberOfVersions)),
                collapsed: true
            });
            panelBody = panel.find('.panel-body');

            if (_.isArray(versions)) {
                Ext.point(POINT + '/list').invoke('draw', panelBody, Ext.Baton({ model: model, data: model.get('origData') }));
            }

            this.append(panel);
        }
    });

    // Extensions for the file versions list
    Ext.point(POINT + '/list').extend({
        index: 10,
        id: 'versions-list',
        draw: function (baton) {
            //console.info('FileVersionsView.draw()');
            var model = baton && baton.model,
                versions = model && model.get('versions'),
                table;

            function drawAllVersions(allVersions) {
                _.chain(allVersions)
                .sort(versionSorter)
                .each(function (version) {
                    var entryRow = $('<tr>').addClass('version').append(
                                $('<td>').addClass('version-label' + (version.current_version ? ' current' : '')).append(
                                    $('<div>').text(gt.noI18n(version.version)).attr('title', gt.noI18n(version.version))
                                )
                            );

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
                return version2.version - version1.version;
            }

            this.empty();
            if (!model) { return; }

            table = $('<table>').addClass('versiontable table');

            drawAllVersions(versions);

            this.append(table);
        }
    });

    // dropdown
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

            Util.setClippedLabel($node, baton.data.filename);
        }
    });

    // Basic Info Fields
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

    Ext.point(POINT + '/version').extend({
        id: 'last_modified',
        index: 30,
        draw: function (baton) {
            var d = Util.getDateFormated(baton.data.last_modified, { fulldate: true, filtertoday: false });
            this.find('td:last').append($('<div class="last_modified">').text(gt.noI18n(d)));
        }
    });

    Ext.point(POINT + '/version').extend({
        id: 'size',
        index: 40,
        draw: function (baton) {
            var size = (_.isNumber(baton.data.file_size)) ? _.filesize(baton.data.file_size) : '-';
            this.find('td:last').append($('<div class="size">').text(gt.noI18n(size)));
        }
    });

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
    var FileVersionsView = Backbone.View.extend({

        className: 'viewer-fileversions',

        events: {
            'click .toggle-panel': 'onTogglePanel'
        },

        onTogglePanel: function (event) {
            var model = this.model,
                panelHeading = this.$el.find('.panel>.panel-heading'),
                panelBody = this.$el.find('.panel>.panel-body');

            event.preventDefault();
            if (!model) { return; }

            if (panelBody.hasClass('panel-collapsed')) {
                // get file version history
                if (model.get('versions') === null) {
                    panelHeading.busy();
                    // get file versions
                    FilesAPI.versions({
                        id: model.get('id')
                    })
                    .done(function (versions) {
                        //console.info('FilesAPI.versions() ok ', versions);
                        model.set('versions', (_.isArray(versions) ? versions : []));
                    })
                    .fail(function (err) {
                        console.warn('FilesAPI.versions() error ', err);
                    })
                    .always(function () {
                        panelHeading.idle();
                    });

                } else {
                    // expand the panel
                    panelBody.slideDown().removeClass('panel-collapsed');
                }

            } else {
                // collapse the panel
                panelBody.slideUp().addClass('panel-collapsed');
            }
        },

        onModelChangeVersions: function (model) {
            //console.info('FileVersionsView.onModelChangeVersions() ', model);
            var panelBody = this.$el.find('.panel>.panel-body'),
                baton = Ext.Baton({ model: model, data: model.get('origData') });

            Ext.point(POINT + '/list').invoke('draw', panelBody, baton);

            // expand the panel
            panelBody.slideDown().removeClass('panel-collapsed');
        },

        initialize: function () {
            //console.info('FileVersionsView.initialize()');
            this.$el.on('dispose', this.dispose.bind(this));
            this.model = null;
        },

        render: function (data) {
            //console.info('FileVersionsView.render() ', data);
            if (!data || !data.model) { return this; }

            var baton = Ext.Baton({ model: data.model, data: data.model.get('origData') });

            // remove listener from previous model
            if (this.model) {
                this.stopListening(this.model, 'change:versions');
            }

            // add listener to new model
            this.model = data.model;
            this.listenTo(this.model, 'change:versions', this.onModelChangeVersions);

            Ext.point(POINT).invoke('draw', this.$el, baton);
            return this;
        },

        dispose: function () {
            //console.info('FileVersionsView.dispose()');

            this.stopListening();
            return this;
        }
    });

    return FileVersionsView;
});
