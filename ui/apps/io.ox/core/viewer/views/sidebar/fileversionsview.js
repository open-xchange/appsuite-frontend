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
            console.info('FileVersionsView.draw()');
            var panel, panelHeader, panelBody,
                model = baton && baton.model,
                versions = model && model.get('versions');

            baton.$el.empty();
            if (!model) { return; }

            // render panel
            panel = $('<div>').addClass('panel panel-default');
            panelHeader = $('<div>').addClass('panel-heading').append(
                $('<h3>').addClass('panel-title').text(gt('Versions')),
                $('<a>', { href: '#', role: 'button', tabindex: 1 }).addClass('toggle-panel panel-heading-button btn').append(
                    $('<i>').addClass('fa fa-chevron-down')
                )
            );
            panelBody = $('<div>').addClass('panel-body panel-collapsed').css('display', 'none');

            if (_.isArray(versions)) {
                Ext.point(POINT + '/list').invoke('draw', panelBody, Ext.Baton({ $el: panelBody, model: model, data: model.get('origData') }));
            }

            panel.append(panelHeader, panelBody);
            baton.$el.append(panel);
        }
    });

    // Extensions for the file versions list
    Ext.point(POINT + '/list').extend({
        index: 10,
        id: 'versions-list',
        draw: function (baton) {
            console.info('FileVersionsView.draw()');
            var model = baton && baton.model,
                versions = model && model.get('versions'),
                table;

            function drawAllVersions(allVersions) {
                _.chain(allVersions)
                .sort(versionSorter)
                .each(function (version) {
                    var entryRow = $('<tr>').addClass('version').append(
                                $('<td>').addClass('versionLabel').append(
                                    $('<div>').text(gt.noI18n(version.version)).attr('title', gt.noI18n(version.version)),
                                    (version.current_version ? $('<i>').addClass('fa fa-check-square-o').attr('title', gt('current version')) : '')
                                )
                            );

                    Ext.point(POINT + '/version').invoke('draw', entryRow, Ext.Baton({ data: version }));
                    table.append(entryRow);
                });
            }

            function versionSorter (version1, version2) {
                return version2.version - version1.version;
            }

            this.empty();
            if (!model) { return; }

            table = $('<table>').addClass('versiontable table');

            drawAllVersions(versions);

            this.append($('<div class="row">')
                .append($('<div class="col-xs-12 col-md-12">')
                    .append(table)));
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
            baton.label = _.noI18n(_.ellipsis(baton.data.filename, { max: 40, charpos: 'middle' }));
            var row;

            this.append(
                row = $('<td>').addClass('row')
            );

            Ext.point(POINT + '/version/dropdown').invoke('draw', row, baton);

            row.children('div.dropdown').addClass('col-xs-12 col-md-12')
                .children('a').attr('title', baton.data.filename);
        }
    });

    // Basic Info Fields
    Ext.point(POINT + '/version').extend({
        id: 'created_by',
        index: 20,
        draw: function (baton) {
            var $node;
            this.find('td:last').append($node = $('<div class="col-xs-12 col-md-12 createdby">'));

            UserAPI.getName(baton.data.created_by)
            .done(function (name) {
                var clippedName = _.ellipsis(name, { max: 40, charpos: 'middle' });
                $node.text(_.noI18n(clippedName)).attr('title', name);
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
            this.find('td:last').append($('<div class="col-xs-8 col-md-8 last_modified">').text(gt.noI18n(d)));
        }
    });

    Ext.point(POINT + '/version').extend({
        id: 'size',
        index: 40,
        draw: function (baton) {
            var size = (_.isNumber(baton.data.file_size)) ? _.filesize(baton.data.file_size) : '-';
            this.find('td:last').append($('<div class="col-xs-4 col-md-4 size">').text(gt.noI18n(size)));
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

        onTogglePanel: function () {

            var model = this.model,
                panelBody = this.$el.find('.panel>.panel-body'),
                panelIcon = this.$el.find('.panel>.panel-heading i');

            if (!model) { return; }

            if (panelBody.hasClass('panel-collapsed')) {
                // switch panel icon
                panelIcon.removeClass('fa-chevron-down').addClass('fa-chevron-up');

                // get file version history
                if (model.get('versions') === null) {
                    FilesAPI.versions({
                        id: model.get('id')
                    })
                    .done(function (versions) {
                        console.info('FilesAPI.versions() ok ', versions);
                        model.set('versions', (_.isArray(versions) ? versions : []));
                    })
                    .fail(function (err) {
                        console.info('FilesAPI.versions() error ', err);
                    });
                } else {
                    // expand the panel
                    panelBody.slideDown();
                    panelBody.removeClass('panel-collapsed');
                }

            } else {
                // collapse the panel
                panelBody.slideUp();
                panelBody.addClass('panel-collapsed');
                panelIcon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
            }
        },

        onModelChangeVersions: function (model) {
            //console.info('FileVersionsView.onModelChangeVersions() ', model);
            var panelBody = this.$el.find('.panel>.panel-body'),
                baton = Ext.Baton({ $el: panelBody, model: model, data: model.get('origData') });

            Ext.point(POINT + '/list').invoke('draw', panelBody, baton);

            // expand the panel
            panelBody.slideDown();
            panelBody.removeClass('panel-collapsed');
        },

        initialize: function () {
            //console.info('FileVersionsView.initialize()');
            this.$el.on('dispose', this.dispose.bind(this));
            this.model = null;
        },

        render: function (data) {
            //console.info('FileVersionsView.render() ', data);
            if (!data || !data.model) { return this; }

            var baton = Ext.Baton({ $el: this.$el, model: data.model, data: data.model.get('origData') });

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
            console.info('FileVersionsView.dispose()');

            this.stopListening();
            return this;
        }
    });

    return FileVersionsView;
});
