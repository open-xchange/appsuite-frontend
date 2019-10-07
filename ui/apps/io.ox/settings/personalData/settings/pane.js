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
                'includeTrash': {
                    //#. header for a dropdown
                    'header': gt('Included folders'),
                    //#. shown when a download of mail data is requested
                    'label': gt('Trash folder')
                },
                'includeUnsubscribed': {
                    //#. shown when a download of mail data is requested (has header "Included folders ...")
                    'label': gt('Unsubscribed folders')
                }
            },
            'calendar': {
                'label': gt('Calendar'),
                'description': gt('Includes all appointments from your calendars as ical files.'),
                'includePublic': {
                    //#. header for a dropdown
                    'header': gt('Included calendars'),
                    //#. shown when a download of calendar data is requested
                    'label': gt('Public calendars')
                },
                'includeShared': {
                    //#. shown when a download of calendar data is requested
                    'label': gt('Shared calendars')
                },
                'includeUnsubscribed': {
                    //#. shown when a download of calendar data is requested (has header "Included folders ...")
                    'label': gt('Unsubscribed calendars')
                }
            },
            'contacts': {
                'label': gt('Address book'),
                'description': gt('Includes all contact data from your address books as vcard files.'),
                'includePublic': {
                    //#. header for a dropdown
                    'header': gt('Included address books'),
                    //#. shown when a download of contact data is requested
                    'label': gt('Public address books')
                },
                'includeShared': {
                    //#. shown when a download of contact data is requested
                    'label': gt('Shared address books')
                },
                'includeDistributionLists': {
                    //#. header for a dropdown
                    'header': gt('Additional options'),
                    divider: true,
                    //#. shown when a download of contact data is requested
                    'label': gt('Include distribution lists')
                }
            },
            'infostore': {
                'label': gt.pgettext('app', 'Drive'),
                //#. %1$s is usually "Drive" (product name; might be customized)
                'description': gt('Includes all files from %1$s.', gt.pgettext('app', 'Drive')),
                'includeTrash':  {
                    //#. header for a dropdown
                    'header': gt('Included folders'),
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
                    //#. header for a dropdown
                    'header': gt('Additional options'),
                    divider: true,
                    //#. shown when a download of (cloud) drive files is requested
                    'label': gt('Include all file versions')
                }
            },
            'tasks': {
                'label': gt('Tasks'),
                'description': gt('Includes all tasks as ical files.'),
                'includePublic':  {
                    //#. header for a dropdown
                    'header': gt('Included folders'),
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
            1073741824,
            // 2gb
            2147483648
        ],
        ignoredErrors = [
            // data export cancelled by user. (why does this error message exist? thats no error);
            'GDPR-EXPORT-0013',
            // no data export or it has already been completed (why does this error message exist? thats also no error)
            'GDPR-EXPORT-0009'
        ],
        handleApiResult = function (apiResponse) {

            // check if this is [data, timestamp]
            apiResponse = _.isArray(apiResponse) ? apiResponse[0] : apiResponse;

            // error, failed, aborted. Behavior is the same in all cases, just display view, so user can try again.
            if (apiResponse.error || apiResponse.status === 'FAILED' || apiResponse.status === 'ABORTED') {
                if (!_(ignoredErrors).contains(apiResponse.code)) {
                    yell(apiResponse);
                }
                // in case of error set status to NONE, so user can retry
                apiResponse = { status: 'NONE' };
            }

            return apiResponse;
        },
        deleteDialog = function (options) {
            var def = $.Deferred();
            new ModalDialog({ title: options.title })
                .build(function () {
                    this.$body.append($('<div>').text(options.text));
                })
                .addCancelButton({ left: true })
                .addButton({ className: 'btn-primary', action: options.action, label: options.label })
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
                this.$el.removeClass('disabled').empty();

                var self = this, checkboxes,
                    supportedFilesizes = _(filesizelimits).filter(function (value) { return value <= self.model.get('maxFileSize'); });

                // data selection
                this.$el.append(
                    $('<h1>').text(gt('Download your personal data')),
                    checkboxes = $('<div class="form-group">').append($('<div>').text(gt('You can download a copy of your personal data from your account, if you want to save it or transfer it to another provider.')))
                );

                // build Checkboxes
                _(modules).each(function (data, moduleName) {
                    if (!self.model.get(moduleName)) return;
                    var dropdownView = new Dropdown({ caret: true, model: self.models[moduleName], label: gt('Options') });
                    self.models[moduleName].on('change:enabled', function () {
                        dropdownView.$toggle.attr('aria-disabled', !self.models[moduleName].get('enabled')).toggleClass('disabled', !self.models[moduleName].get('enabled'));
                    });

                    // sub options as dropdown (include trash folder etc)
                    _(_(data).keys()).each(function (subOption) {
                        if (subOption === 'label' || subOption === 'description') return;
                        if (modules[moduleName][subOption].divider) dropdownView.divider();
                        if (modules[moduleName][subOption].header) dropdownView.header(modules[moduleName][subOption].header);
                        dropdownView.option(subOption, true, modules[moduleName][subOption].label);
                    });

                    // main checkbox for the module
                    // a11y does not like it when multiple nodes have the same name attribute, so despite all having the attribute name in the model ("enabled") we use different name attributes for the nodes
                    checkboxes.append(new mini.CustomCheckboxView({ name: 'enabled', nodeName: moduleName, label: modules[moduleName].label, model: self.models[moduleName] }).render().$el.addClass('main-option '),
                        $('<div class="description">').text(modules[moduleName].description),
                        dropdownView.render().$el);
                });

                if (supportedFilesizes.length) {
                    this.$el.append(
                        $('<div class="form-group row">').append(
                            $('<div class="col-md-12">').append(
                                $('<label>').attr('for', 'personaldata-filesizepicker').text(gt('Maximum file size')),
                                $('<div class="filepicker-description">').text(gt('Archives larger than the selected size will be split into multiple files.'))
                            ),
                            $('<div class="col-md-6">').append(
                                new mini.SelectView({ name: 'maxFileSize', id: 'personaldata-filesizepicker', model: self.model,
                                    list: _(supportedFilesizes).map(function (fileSize) {
                                        return { label: strings.fileSize(fileSize), value: fileSize };
                                    })
                                }).render().$el.val(supportedFilesizes[supportedFilesizes.length - 1])
                            )
                        )
                    );
                }

                // display the correct buttons depending on the current download state
                switch (this.status.get('status')) {
                    case 'NONE':
                        this.$el.append($('<button type="button" class="btn btn-primary">').text(gt('Request download'))
                            .on('click', function () {
                                api.requestDownload(self.getDownloadConfig(), true).done(function () {
                                    yell('success', gt('Download requested'));
                                }).fail(yell);
                            }));
                        break;
                    case 'PENDING':
                    case 'RUNNING':
                    case 'PAUSED':
                        this.$el.addClass('disabled').find('.checkbox,a').addClass('disabled');
                        this.$el.find('input,select').attr('aria-disabled', true).prop('disabled', 'disabled');
                        this.$el.append($('<button type="button" class="btn btn-primary">').prop('disabled', 'disabled').text(gt('Request download')));
                        break;
                    case 'DONE':
                        this.$el.append($('<button type="button" class="btn btn-primary">').text(gt('Request new download'))
                            .on('click', function () {
                                deleteDialog({ title: gt('Request new download'), text: gt('There is currently an archive download available. By requesting a new download the current archive will be deleted and is no longer available.'), action: 'delete', label: gt('Request new download') }).then(function (action) {
                                    if (action === 'delete') {
                                        api.requestDownload(self.getDownloadConfig(), true).done(function () {
                                            yell('success', gt('Download requested'));
                                        }).fail(yell);
                                    }
                                });
                            }));
                        break;
                    // no default
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
            className: 'personal-data-download-view row',
            initialize: function () {
                var self = this;
                this.listenTo(api, 'updateStatus', function () {
                    api.getAvailableDownloads().always(function (downloadStatus) {
                        downloadStatus = handleApiResult(downloadStatus);
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
                this.$el.empty().toggle(this.model.get('status') !== 'NONE');

                //#. header for zip archive download list
                this.$el.append($('<h1 class="col-xs-12">').text(gt('Your archive')));

                if (this.model.get('status') === 'PENDING' || this.model.get('status') === 'RUNNING' || this.model.get('status') === 'PAUSED') {
                    //#. %1$s: date and time the download was requested
                    this.$el.append(
                        $('<div class="col-xs-12">')
                            .text(gt('Your requested archive is currently being created. Depending on the size of the requested data this may take hours or days. You will be informed via email when your download is ready.')),
                        $('<button type="button" class="cancel-button btn btn-primary">').text(gt('Cancel download request'))
                            .on('click', function () {
                                deleteDialog({ title: gt('Cancel download request'), text: gt('Do you really want to cancel the current download request?'), action: 'delete', label: gt('Cancel download request') }).then(function (action) {
                                    if (action === 'delete') api.cancelDownloadRequest().fail(yell);
                                });
                            })
                    );
                }

                if (this.model.get('status') === 'DONE' && this.model.get('results') && this.model.get('results').length) {
                    this.$el.append(
                        //#. %1$s: date and time when the download expires
                        //#. %1$s: date when the download was requested
                        $('<label class="col-xs-12">').text(gt('Your data archive from %2$s is ready for download. The download is available until %1$s.', moment(this.model.get('availableUntil')).format('L'), moment(this.model.get('creationTime')).format('L'))),
                        $('<ul class="col-md-8 list-unstyled downloads">').append(
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
        });

    ext.point('io.ox/settings/pane/personalData').extend({
        id: 'personaldata',
        title: gt('Download personal data'),
        ref: 'io.ox/settings/personalData',
        index: 100
    });

    ext.point('io.ox/settings/personalData/settings/detail').extend({
        id: 'select-view',
        index: 100,
        draw: function () {
            this.addClass('io-ox-personal-data-settings');
            var node = this;
            //no when here, behavior in always callback would not work correctly.
            api.getAvailableModules().then(function (availableModules) {
                api.getAvailableDownloads().always(function (downloadStatus) {

                    downloadStatus = handleApiResult(downloadStatus);

                    var availableModulesModel = availableModulesModel || new Backbone.Model(availableModules),
                        status = new Backbone.Model(downloadStatus),
                        sdView = new selectDataView({ model: availableModulesModel, status: status }),
                        dlView = new downloadView({ model: status });

                    node.append(
                        dlView.render().$el,
                        sdView.render().$el
                    );

                });
            }, yell);
        }
    });

    return true;
});
