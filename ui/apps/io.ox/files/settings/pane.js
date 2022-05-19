/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/files/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/core/capabilities',
    'io.ox/backbone/mini-views',
    'io.ox/core/settings/util',
    'settings!io.ox/files',
    'gettext!io.ox/files'
], function (ext, ExtensibleView, capabilities, mini, util, settings, gt) {

    'use strict';

    // change events - test -

    settings.on('change', function () {
        settings.saveAndYell();
    });

    settings.on('change:showHidden', function () {
        require(['io.ox/core/folder/api'], function (folderAPI) {
            folderAPI.refresh();
        });
    });

    //
    // Extensible View
    //

    ext.point('io.ox/files/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/files/settings/detail/view', model: settings })
                .inject({
                    getUploadOptions: function () {
                        return [
                            { label: gt('Add new version'), value: 'newVersion' },
                            { label: gt('Add new version and show notification'), value: 'announceNewVersion' },
                            { label: gt('Add separate file'), value: 'newFile' }
                        ];
                    },
                    getAutoPlayOptions: function () {
                        return [
                            { label: gt('Show all images just once'), value: 'loopOnceOnly' },
                            { label: gt('Repeat slideshow'), value: 'loopEndlessly' }
                        ];
                    },
                    getAutoPlayPauseOptions: function () {
                        return _.map([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 35, 40, 50, 60], function (i) {
                            return {
                                value: String(i),
                                label: gt.ngettext('%1$d second', '%1$d seconds', i, i)
                            };
                        });
                    },
                    getRetentionDaysOptions: function (retentionDays) {
                        var entries = [
                            { label: gt('Forever'), value: 0 },
                            { label: gt('1 day'), value: 1 },
                            { label: gt('7 days'), value: 7 },
                            { label: gt('30 days'), value: 30 },
                            { label: gt('60 days'), value: 60 },
                            { label: gt('90 days'), value: 90 },
                            { label: gt('1 year'), value: 365 }
                        ];
                        var entry = _.findWhere(entries, { value: retentionDays });
                        if (!entry) {
                            entries.unshift({
                                label: gt.ngettext('%1$d day', '%1$d days', retentionDays, retentionDays),
                                value: retentionDays
                            });
                        }
                        return entries;
                    },
                    getMaxVersionsOptions: function (maxVersions) {
                        var entries = [
                            { label: gt('Keep all versions'), value: 0 },
                            { label: gt('1 version'), value: 2 },
                            { label: gt('5 versions'), value: 6 },
                            { label: gt('10 versions'), value: 11 },
                            { label: gt('20 versions'), value: 21 },
                            { label: gt('30 versions'), value: 31 },
                            { label: gt('40 versions'), value: 41 },
                            { label: gt('50 versions'), value: 51 },
                            { label: gt('60 versions'), value: 61 },
                            { label: gt('70 versions'), value: 71 },
                            { label: gt('80 versions'), value: 81 },
                            { label: gt('90 versions'), value: 91 },
                            { label: gt('100 versions'), value: 101 }
                        ];
                        var entry = _.findWhere(entries, { value: maxVersions });
                        if (!entry) {
                            entries.unshift({
                                label: gt.ngettext('%1$d version', '%1$d versions', maxVersions - 1, maxVersions - 1),
                                value: maxVersions
                            });
                        }
                        return entries;
                    }
                })
                .render().$el
            );
        }
    });

    var INDEX = 0;

    ext.point('io.ox/files/settings/detail/view').extend(
        //
        // Header
        //
        {
            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.addClass('io-ox-drive-settings').append(
                    util.header(gt.pgettext('app', 'Drive'))
                );
            }
        },
        //
        // Upload
        //
        {
            id: 'upload',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(
                        gt('Adding files with identical names'),
                        new mini.CustomRadioView({ name: 'uploadHandling', model: settings, list: this.getUploadOptions() }).render().$el
                    )
                );
            }
        },
        //
        // Autoplay
        //
        {
            id: 'autoplay',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(gt('Slideshow / Autoplay mode for images'),
                        $('<div class="form-group">').append(
                            new mini.CustomRadioView({ name: 'autoplayLoopMode', model: settings, list: this.getAutoPlayOptions() }).render().$el
                        )
                    ).css('margin-bottom', '0'),
                    $('<fieldset style="padding-top:0">').append(
                        util.compactSelect('autoplayPause', gt('Duration per image'), settings, this.getAutoPlayPauseOptions(), { width: 3 })
                    )
                );
            }
        },
        //
        // Advanced
        //
        {
            id: 'advanced',
            index: INDEX += 100,
            render: function () {

                if (!settings.isConfigurable('showHidden')) return;

                this.$el.append(
                    util.fieldset(
                        gt('Advanced settings'),
                        util.checkbox('showHidden', gt('Show hidden files and folders'), settings)
                    )
                );
            }
        },
        //
        // Automatic version cleanup
        //
        {
            id: 'versionCleanup',
            index: INDEX += 100,
            render: function () {

                var retentionDays = settings.get('features/autodelete/retentionDays'),
                    maxVersions = settings.get('features/autodelete/maxVersions'),
                    editable = settings.get('features/autodelete/editable');

                // disabled
                if (!capabilities.has('autodelete_file_versions')) {

                    // nothing configured
                    if (!retentionDays && !maxVersions) return;

                    // configured by admin
                    this.$el.append(
                        util.fieldset(
                            gt('File version history'),
                            $('<span>').append(gt('Timeframe')),
                            $('<ul>').append($('<li>').append((retentionDays <= 0) ?
                                gt('The timeframe is not limited.') :
                                //#. %1$d is the number of days
                                //#, c-format
                                gt.ngettext('The timeframe is limited to %1$d day.', 'The timeframe is limited to %1$d days.', retentionDays, retentionDays)
                            )),
                            $('<span>').append(gt('File version limit')),
                            $('<ul>').append($('<li>').append((maxVersions <= 0) ?
                                gt('The number of versions is not limited.') :
                                //#. %1$d is the number of versions
                                //#, c-format
                                gt.ngettext('The number of versions is limited to %1$d version.', 'The number of versions is limited to %1$d versions.', maxVersions - 1, maxVersions - 1)
                            ))
                        )
                    );

                    return;
                }

                var summaryContainer = $('<div>').addClass('help-block');

                this.getSummary = function () {
                    // appends legend list for explanation
                    var summaryList = $('<ul>'),
                        summary = $('<span>').text(gt('Summary')).append(summaryList);

                    if (maxVersions <= 0 && retentionDays <= 0) {
                        summaryList.append($('<li>').text(gt('All file versions are retained.')));
                        return summary;
                    }

                    if (retentionDays > 0) {
                        summaryList.append($('<li>').append(
                            //#. %1$d is the number of days
                            //#, c-format
                            gt.ngettext(
                                'All file versions older than %1$d day will be deleted after next login.',
                                'All file versions older than %1$d days will be deleted after next login.',
                                retentionDays, retentionDays
                            )
                        ));
                    }

                    if (maxVersions > 0) {
                        summaryList.append($('<li>').append(
                            //#. %1$d is the number of versions
                            //#, c-format
                            gt.ngettext(
                                'When a file has more than 1 additional version, older versions will be deleted when a new version is created.',
                                'When a file has more than %1$d additional versions, older versions will be deleted when a new version is created.',
                                maxVersions - 1, maxVersions - 1
                            )
                        ));
                    }

                    return summary;
                };

                this.$el.append(
                    util.fieldset(
                        gt('File version history'),
                        $('<span>').append(gt('Timeframe')),
                        util.compactSelect('features/autodelete/retentionDays', gt('Keep saved versions'), settings, this.getRetentionDaysOptions(retentionDays), { width: 4, integer: true }),
                        $('<span>').append(gt('File version limit')),
                        util.compactSelect('features/autodelete/maxVersions', gt('Keep number of recent versions'), settings, this.getMaxVersionsOptions(maxVersions), { width: 4, integer: true }),
                        summaryContainer.append(this.getSummary())
                    )
                );
                if (!editable) {
                    this.$el.find('#settings-features\\/autodelete\\/retentionDays').attr('disabled', true);
                    this.$el.find('#settings-features\\/autodelete\\/maxVersions').attr('disabled', true);
                }
                this.listenTo(settings, 'change:features/autodelete/maxVersions change:features/autodelete/retentionDays', function () {
                    retentionDays = settings.get('features/autodelete/retentionDays');
                    maxVersions = settings.get('features/autodelete/maxVersions');
                    summaryContainer.empty().append(this.getSummary());
                }).bind(this);
            }
        }
    );
});
