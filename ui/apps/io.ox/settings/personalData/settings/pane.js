/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/settings/personalData/settings/pane', [
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/core',
    'io.ox/backbone/views/modal',
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/common',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/settings/personalData/api',
    'io.ox/core/yell',
    'io.ox/core/capabilities',
    'io.ox/core/strings',
    'less!io.ox/settings/personalData/settings/style'
], function (DisposableView, gt, ModalDialog, ext, mini, Dropdown, api, yell, capabilities, strings) {

    'use strict';

    if (!capabilities.has('dataexport')) return;

    // same structure as api response
    var modules = {
            'mail': {
                'label': gt('Email'),
                'description': gt('Includes all emails from your primary mail account as eml files.'),
                //#. header for a dropdown
                'header': gt('Included folders'),
                'includeTrash': {
                    //#. shown when a download of mail data is requested
                    'label': gt('Trash folder')
                },
                'subscribedOnly': {
                    //#. shown when a download of mail data is requested
                    'label': gt('Subscribed folders only')
                }
            },
            'calendar': {
                'label': gt('Calendar'),
                'description': gt('Includes all appointments from your calendars as ical files.'),
                //#. header for a dropdown
                'header': gt('Included calendars'),
                'includePublic': {
                    //#. shown when a download of calendar data is requested
                    'label': gt('Public calendars')
                },
                'includeShared': {
                    //#. shown when a download of calendar data is requested
                    'label': gt('Shared calendars')
                },
                'subscribedOnly': {
                    //#. shown when a download of calendar data is requested
                    'label': gt('Subscribed calendars only')
                }
            },
            'contacts': {
                'label': gt('Address book'),
                'description': gt('Includes all contact data from your address books as vcard files.'),
                //#. header for a dropdown
                'header': gt('Included address books'),
                'includePublic': {
                    //#. shown when a download of contact data is requested
                    'label': gt('Public address books')
                },
                'includeShared': {
                    //#. shown when a download of contact data is requested
                    'label': gt('Shared address books')
                },
                'includeDistributionLists': {
                    divider: true,
                    //#. shown when a download of contact data is requested
                    'label': gt('include distribution lists')
                }
            },
            'infostore': {
                'label': gt.pgettext('app', 'Drive'),
                //#. %1$s is usually "Drive" (product name; might be customized)
                'description': gt('Includes all files from %1$s.', gt.pgettext('app', 'Drive')),
                //#. header for a dropdown
                'header': gt('Included folders'),
                'includeTrash':  {
                    //#. shown when a download of (cloud) drive files is requested
                    'label': gt('Trash folder')
                },
                'includePublic':  {
                    //#. shown when a download of (cloud) drive files is requested
                    'label': gt('Public folders')
                },
                'includeShared': {
                    //#. shown when a download of (cloud) drive files is requested
                    'label': gt('Shared folders')
                },
                'includeAllVersions': {
                    divider: true,
                    //#. shown when a download of (cloud) drive files is requested
                    'label': gt('include all file versions')
                }
            },
            'tasks': {
                'label': gt('Tasks'),
                'description': gt('Includes all tasks as ical files.'),
                //#. header for a dropdown
                'header': gt('Included folders'),
                'includePublic':  {
                    //#. shown when a download of task data is requested
                    'label': gt('Public folders')
                },
                'includeShared': {
                    //#. shown when a download of task data is requested
                    'label': gt('Shared folders')
                }
            }
        },
        filesizelimits = [
            // 512mb (is hardcoded backend minimum)
            536870912,
            // 1gb
            1073741824
        ],
        deleteDialog = function (options) {
            var def = $.Deferred();
            new ModalDialog({ title: options.text })
                .addCancelButton({ left: true })
                .addButton({ className: 'btn-default', action: options.action, label: options.label })
                .on('action', def.resolve)
                .open();

            return def;
        },
        // displays a lot of checkboxes to select the data to download
        selectDataView = DisposableView.extend({
            className: 'personal-data-view',
            initialize: function (options) {
                var self = this;
                this.status = options.status;
                this.status.on('change:status', this.render.bind(this));
                // create one model for each submodule
                // makes it easier to use checkbox miniviews later on since data is not nested anymore
                this.models = {};
                _(_(modules).keys()).each(function (moduleName) {
                    if (!self.model.get(moduleName)) return;
                    self.models[moduleName] = new Backbone.Model(self.model.get(moduleName));
                    self.models[moduleName].on('change:enabled', function (model) {
                        self.$el.find('.' + moduleName + '-sub-option').toggleClass('disabled', !model.get('enabled')).find('input').attr('aria-disabled', true).prop('disabled', model.get('enabled') ? '' : 'disabled');
                    });
                });
            },
            render: function () {
                this.$el.empty();
                if (this.status.get('status') === 'PENDING') return this;

                var self = this, checkboxes,
                    supportedFilesizes = _(filesizelimits).filter(function (value) { return value <= self.model.get('maxFileSize'); });

                // data selection
                this.$el.append(checkboxes = $('<div class="form-group">').append($('<div>').text(gt('You can download a copy of your personal data from your account, if you want to save it or transfer it to a nother provider.'))));

                // build Checkboxes
                _(modules).each(function (data, moduleName) {
                    if (!self.model.get(moduleName)) return;
                    var dropdownView = new Dropdown({ caret: true, model: self.models[moduleName], label: gt('Options') })
                        .header(modules[moduleName].header);

                    // sub checkboxes (include trash folder etc)
                    _(_(data).keys()).each(function (subOption) {
                        if (subOption === 'label' || subOption === 'description' || subOption === 'header') return;
                        if (modules[moduleName][subOption].divider) dropdownView.divider();
                        dropdownView.option(subOption, true, modules[moduleName][subOption].label);
                    });

                    // main checkbox for the module
                    checkboxes.append(new mini.CustomCheckboxView({ name: 'enabled', label: modules[moduleName].label, model: self.models[moduleName] }).render().$el.addClass('main-option '),
                        $('<div>').text(modules[moduleName].description),
                        dropdownView.render().$el);
                });

                if (supportedFilesizes.length) {
                    this.$el.append(
                        $('<div class="form-group">').append(
                            $('<label>').attr('for', 'personaldata-filesizepicker').text(gt('Maximum file size')),
                            new mini.SelectView({ name: 'maxFileSize', id: 'personaldata-filesizepicker', model: self.model,
                                list: _(supportedFilesizes).map(function (fileSize) {
                                    return { label: strings.fileSize(fileSize), value: fileSize };
                                })
                            }).render().$el.val(supportedFilesizes[supportedFilesizes.length - 1])
                        )
                    );
                }

                return this;
            },
            getDownloadConfig: function () {
                var self = this;
                _(_(this.models).keys()).each(function (moduleName) {
                    self.model.set(moduleName, self.models[moduleName].toJSON());
                });

                return this.model.toJSON();
            }
        }),
        // used to display the current state if a download was requested
        downloadView = DisposableView.extend({
            className: 'personal-data-download-view',
            initialize: function () {
                var self = this;
                this.listenTo(api, 'updateStatus', function () {
                    api.getAvailableDownloads().then(function (downloadStatus) {
                        // update attributes
                        self.model.set(downloadStatus);
                        // remove attributes that are no longer there
                        _(self.model.keys()).each(function (key) {
                            if (!_(downloadStatus).has(key)) self.model.unset(key);
                        });
                        self.render();
                    });
                });
            },
            render: function () {
                this.$el.empty();

                if (this.model.get('status') === 'PENDING') {
                    //#. %1$s: date and time the download was requested
                    this.$el.append($('<div class="alert alert-info">')
                    .text(gt('Your requested archive is currently being created. Depending on the size of the requested data this may take hours or days. You will be informed via email when your download is ready.', moment(this.model.get('creationTime')).format('LLL'))));
                }

                if (this.model.get('status') === 'DONE' && this.model.get('results') && this.model.get('results').length) {
                    this.$el.append(
                        //#. %1$s: date and time when the download expires
                        $('<label>').text(gt('Your data archive is ready for download. The download is vailable until %1$s.', moment(this.model.get('avaiableUntil')).format('LLL'))),
                        $('<ul class="list-unstyled downloads">').append(
                            _(this.model.get('results')).map(function (file) {
                                return $('<li class="file">')
                                    .append(
                                        $('<span>').text(file.fileInfo),
                                        $('<button type="button" class="btn fa fa-download">')
                                            //#. %1$s: filename
                                            .attr('title', gt('Download %1$s.', file.fileInfo))
                                            .on('click', function () {
                                                api.downloadFile(file.taskId, file.number).fail(yell);
                                            })
                                    );
                            })
                        ));
                }

                return this;
            }
        }),
        // used to display the correct buttons depending on the current state
        buttonView = DisposableView.extend({
            className: 'personal-data-button-view',
            initialize: function (options) {
                this.selectView = options.selectView;
                this.model.on('change:status', this.render.bind(this));
            },
            render: function () {
                this.$el.empty();
                var self = this;
                // display the correct buttons depending on the current download state
                switch (this.model.get('status')) {
                    case 'none':
                        this.$el.append($('<button type="button" class="btn btn-primary">').text(gt('Request download'))
                            .on('click', function () {
                                api.requestDownload(self.selectView.getDownloadConfig()).fail(yell);
                            }));
                        break;
                    case 'PENDING':
                        this.$el.append($('<button type="button" class="btn btn-default">').text(gt('Cancel download request'))
                            .on('click', function () {
                                deleteDialog({ text: gt('Do you really want to cancel your download request?'), action: 'delete', label: gt('Cancel download request') }).then(function (action) {
                                    if (action === 'delete') api.cancelDownloadRequest().fail(yell);
                                });
                            }));
                        break;
                    case 'DONE':
                        this.$el.append($('<button type="button" class="btn btn-primary">').text(gt('Request new download'))
                            .on('click', function () {
                                deleteDialog({ text: gt('By requesting a new download, your currently available downloads will be deleted.'), action: 'delete', label: gt('Delete all avaliable downloads') }).then(function (action) {
                                    if (action === 'delete') {
                                        api.deleteAllFiles().then(function () {
                                            api.requestDownload(self.selectView.getDownloadConfig()).fail(yell);
                                        }, yell);
                                    }
                                });
                            }));
                        break;
                    // no default
                }

                return this;
            }
        });

    ext.point('io.ox/settings/pane/personalData').extend({
        id: 'personaldata',
        title: gt('Download personal data'),
        ref: 'io.ox/settings/personalData',
        index: 100
    });

    ext.point('io.ox/settings/personalData/settings/detail').extend({
        id: 'title',
        index: 100,
        draw: function () {
            this.addClass('io-ox-personal-data-settings');
            this.append(
                $('<h1>').text(gt('Download your personal data'))
            );
        }
    });

    ext.point('io.ox/settings/personalData/settings/detail').extend({
        id: 'select-view',
        index: 200,
        draw: function () {
            var node = this;
            $.when(api.getAvailableModules(), api.getAvailableDownloads()).then(function (availableModules, downloadStatus) {
                // check if this is [data, timestamp]
                downloadStatus = _.isArray(downloadStatus) ? downloadStatus[0] : downloadStatus;

                var availableModulesModel = new Backbone.Model(availableModules),
                    status = new Backbone.Model(downloadStatus),
                    sdView = new selectDataView({ model: availableModulesModel, status: status }),
                    dlView = new downloadView({ model: status }),
                    bView = new buttonView({ model: status, selectView: sdView });

                node.append(
                    sdView.render().$el,
                    dlView.render().$el,
                    bView.render().$el
                );

            }, yell);
        }
    });

    return true;
});
