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

define('io.ox/core/download', [
    'io.ox/files/api',
    'io.ox/mail/api',
    'io.ox/core/capabilities',
    'io.ox/backbone/views/modal',
    'gettext!io.ox/core',
    'io.ox/core/extensions'], function (api, mailAPI, capabilities, ModalDialog, gt, ext) {

    /* global blankshield:true */

    'use strict';

    // export global callback; used by server response
    window.callback_antivirus = showAntiVirusPopup;

    /* errors related to scanning
        FILE_DOES_NOT_EXIST - 8
        FILE_TOO_BIG - 9
        FILE_INFECTED - 11
    */
    var scanErrors = _(['0008', '0009', '0011']).map(function (value) { return 'ANTI-VIRUS-SERVICE-' + value; });

    function map(o) {
        return { id: o.id, folder_id: o.folder || o.folder_id };
    }

    function returnJSON(o) {
        return JSON.stringify(_.map(o, function (o) { return o.managedId ? o.managedId : o.id; }));
    }

    // simple iframe download (see bug 29276)
    // window.open(url); might leave open tabs or provoke popup-blocker
    // window.location.assign(url); has a weird impact on ongoing uploads (see Bug 27420)
    //
    // Note: This does not work for iOS as Safari will show the content of the download in the iframe as a preview
    // for the most known file types like MS Office, pictures, plain text, pdf, etc.!
    function iframe(url) {
        url += (url.indexOf('?') === -1 ? '?' : '&') + 'callback=antivirus';
        if (capabilities.has('antivirus')) {
            url += '&scan=true';
        }
        $('#tmp').append(
            $('<iframe>', { src: url, 'class': 'hidden download-frame' })
        );
    }

    // works across all browsers (except mobile safari) for multiple items (see bug 29408)
    function form(options) {

        options = options || {};

        if (capabilities.has('antivirus')) {
            options.url += '&scan=true';
        }

        var name = _.uniqueId('iframe'),
            iframe = $('<iframe>', { src: 'blank.html', name: name, 'class': 'hidden download-frame' }),
            form = $('<form>', { iframeName: name, action: options.url, method: 'post', target: name }).append(
                $('<input type="hidden" name="body" value="">').val(options.body)
            );

        // except for iOS we use a hidden iframe
        // iOS will open the form in a new window/tab
        if (!_.device('ios')) $('#tmp').append(iframe);
        $('#tmp').append(form);
        form.submit();
    }

    // two different extension points for unscanned and virus found, so behavior can be customized individually
    ext.point('io.ox/core/download/antiviruspopup').extend({
        index: 100,
        id: 'buttonThreatFound',
        render: function (baton) {
            // error code 0011: virus found
            if (baton.model.get('code') !== 'ANTI-VIRUS-SERVICE-0011') return;
            var opt = {
                action: 'ignore',
                label: gt('Download infected file'),
                className: 'btn-default'
            };

            // special treatment for desktop safari to avoid frame load interrupted error
            if (_.device('!ios && safari')) {
                this.addDownloadButton(_.extend(opt, { href: baton.model.get('dlFrame').src.replace('&scan=true', '') }));
                return;
            }
            this.addButton(opt);
            this.addButton({ action: 'cancel', label: gt('Cancel'), className: 'btn-primary' });
        }
    });

    ext.point('io.ox/core/download/antiviruspopup').extend({
        index: 200,
        id: 'buttonNotScanned',
        render: function (baton) {
            // error code 11 is virus found
            if (baton.model.get('code') === 'ANTI-VIRUS-SERVICE-0011') return;
            var opt = {
                action: 'ignore',
                label: gt('Download unscanned file'),
                className: 'btn-default'
            };
            // special treatment for desktop safari to avoid frame load interrupted error
            if (_.device('!ios && safari')) {
                this.addDownloadButton(_.extend(opt, { href: baton.model.get('dlFrame').src.replace('&scan=true', '') }));
                return;
            }
            this.addButton({ action: 'cancel', label: gt('Cancel'), className: 'btn-default' });
            this.addButton(opt);
        }
    });

    ext.point('io.ox/core/download/antiviruspopup').extend({
        index: 300,
        id: 'message',
        render: function (baton) {
            var text = baton.model.get('error'),
                type = baton.model.get('code') === 'ANTI-VIRUS-SERVICE-0011' ? 'av-danger' : 'av-warning';
            // generic error message for internal errors (I/O error, service unreachable, service not running etc)
            if (scanErrors.indexOf(baton.model.get('code')) === -1) {
                text = gt('Unable to perform Anti-Virus check for the requested file(s)');
            }

            this.$body
                .addClass('av-dialog')
                .addClass(type)
                .append($('<i class="fa fa-warning" aria-hidden="true">'),
                    $('<div>').text(text)
                );
        }
    });

    function showAntiVirusPopup(error) {
        // no error
        if (!error) return;
        // not virus related
        if (error.code.indexOf('ANTI-VIRUS-SERVICE') !== 0) {
            require(['io.ox/core/yell'], function (yell) {
                yell(error);
            });
            return;
        }

        // find correct download iframe (needed to retrigger the download without scan parameter)
        _($('#tmp iframe.hidden.download-frame')).each(function (dlFrame) {
            // use indexOf and not includes... ie doesn't support that
            if (dlFrame.contentDocument.head.innerHTML.indexOf(error.error_id) !== -1) error.dlFrame = dlFrame;
        });

        new ModalDialog({
            title: error.code.match(/0011/) ? gt('Malicious file detected') : gt('Anti-Virus warning'),
            point: 'io.ox/core/download/antiviruspopup',
            model: new Backbone.Model(error)
        })
        .on('ignore', function () {

            // download in new window instead of iframe (ios only)
            if (error.url) {
                var win = blankshield.open('blank.html', '_blank');
                win.callback_antivirus = function (error) {
                    showAntiVirusPopup(error);
                    win.close();
                };
                win.location = error.url.replace('&scan=true', '');
                return;
            }

            // trigger download again, but without scan parameter
            // form download (used for multiple files)
            if (error.dlFrame.src.indexOf('blank.html') !== -1) {
                var form = $('#tmp form[iframeName="' + error.dlFrame.name + '"]');
                if (!form.length) return;
                form[0].action = form[0].action.replace('&scan=true', '');
                form.submit();
                return;
            }
            // safari has a special donwload link button
            if (_.device('safari')) return;
            // iframe download
            error.dlFrame.src = error.dlFrame.src.replace('&scan=true', '');
        })
        .on('cancel', function () {
            if (error.dlFrame) $(error.dlFrame).remove();
        })
        .open();
    }

    return {

        // publish utility functions for general use
        url: iframe,
        multiple: form,

        // actually only for ios
        window: function (url, options) {
            options = options || {};
            // check if url attributes and antivirus callback should be added (needed for attachments)
            if (options.antivirus) {
                url += (url.indexOf('?') === -1 ? '?' : '&') + 'callback=antivirus';
                if (capabilities.has('antivirus')) {
                    url += '&scan=true';
                }
                var win = blankshield.open(url, '_blank');

                win.callback_antivirus = function (error) {
                    error.url = url;
                    showAntiVirusPopup(error);
                    win.close();
                };
                return win;
            }
            return blankshield.open(url, '_blank');
        },

        // download single file
        file: function (options) {

            // on iOS we need a new window, so open this right now
            var win = _.device('ios') && this.window('blank.html');

            api.get(options).done(function (file) {
                if (options.version) {
                    file = _.extend({}, file, { version: options.version });
                }
                if (options.filename) {
                    file = _.extend(file, { filename: options.filename });
                }

                var url = api.getUrl(file, 'download', { params: options.params });
                if (_.device('ios')) {
                    url += (url.indexOf('?') === -1 ? '?' : '&') + 'callback=antivirus';
                    if (capabilities.has('antivirus')) {
                        url += '&scan=true';
                    }
                    win.callback_antivirus = function (error) {
                        error.url = url;
                        showAntiVirusPopup(error);
                        win.close();
                    };
                    win.location = url;
                } else {
                    iframe(url);
                }
            });
        },

        // export list of ids or a complete folder
        exported: function (options) {
            if (!/^(VCARD|ICAL|CSV)$/i.test(options.format)) return;
            var opt = _.extend({ include: true }, options),
                isSelective = !opt.folder && opt.list;
            form({
                url: ox.apiRoot + '/export?' +
                    'action=' + opt.format.toUpperCase() +
                    (isSelective ? '' : '&folder=' + opt.folder) +
                    '&export_dlists=' + (opt.include ? 'true' : 'false') +
                    '&content_disposition=attachment' +
                    (opt.columns && opt.format.toUpperCase() === 'CSV' ? '&columns=' + opt.columns : '') +
                    '&session=' + ox.session,
                body: (isSelective ? JSON.stringify(_.map(opt.list, map)) : '')
            });
        },

        // download multiple files as zip file
        files: function (list) {
            form({
                url: ox.apiRoot + '/files?action=zipdocuments&callback=antivirus&session=' + ox.session,
                // this one wants folder_id
                body: JSON.stringify(_.map(list, map))
            });
        },

        // all attachments of an appointment
        chronosMultiple: function (appointmentModel) {
            var url = ox.apiRoot + '/chronos?' + $.param({
                session: ox.session,
                action: 'zipAttachments',
                folder: appointmentModel.get('folder'),
                id: appointmentModel.get('id')
            });
            form({
                url: url,
                body: returnJSON(appointmentModel.get('attachments'))
            });
        },

        // download multiple attachments as zip file
        pimAttachments: function (list, paramValues) {
            var url = ox.apiRoot + '/attachment?action=zipDocuments&callback=antivirus&session=' + ox.session + '&folder=' + paramValues.folder + '&attached=' + paramValues.attached + '&module=' + paramValues.module;
            form({
                url: url,
                body: returnJSON(list)
            });
        },

        // download single email as EML
        mail: function (options) {
            var url = mailAPI.getUrl(options, 'eml');
            iframe(url);
        },

        composeAttachment: function (options) {
            var spaceId = options.space,
                attachmentId = options.id,
                url = ox.apiRoot + '/mail/compose/' + spaceId + '/attachments/' + attachmentId + '?session=' + ox.session;
            iframe(url);
        },

        // download multiple emails (EML) as zip file
        mails: function (list) {
            form({
                url: ox.apiRoot + '/mail?action=zip_messages&session=' + ox.session,
                // this one wants folder - not folder_id
                body: JSON.stringify(_.map(list, mailAPI.reduce))
            });
        }
    };
});
