/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/core/tk/attachmentsUtil',
    ['io.ox/core/strings',
     'io.ox/preview/main',
     'io.ox/core/tk/dialogs',
     'gettext!io.ox/core/tk/attachments',
     'io.ox/core/extPatterns/links',
     'io.ox/core/capabilities',
     'io.ox/core/extensions',
     'less!io.ox/core/tk/attachments'
    ], function (strings, pre, dialogs, gt, links, capabilities, ext) {

    'use strict';

    var self,
        /**
         * duck checks
         * @param  {object} file
         * @return {object} data
         */
        identify = function (file) {
            var data;
            if (file.disp && file.disp === 'attachment') {
                //mail attachment (server)
                data = {
                    type: file.type || file.content_type || '',
                    module: 'mail',
                    group: file.type ? 'file' : 'reference'
                };
            } else if (file.content_type && file.content_type === 'message/rfc822') {
                //forwarded mail (local/server)
                data = {
                    type: 'eml',
                    module: 'mail',
                    group: 'reference'
                };
            } else if (file.display_name || file.email1) {
                //contacts vcard referene (local)
                data = {
                    type: 'vcf',
                    module: 'contacts',
                    group: 'reference'
                };
            } else if (file.id && file.folder_id) {
                //infostore file reference(local)
                data = {
                    type: file.type || file.content_type || '',
                    module: 'infostore',
                    group: 'reference'
                };
            } else if (file instanceof $ && file[0].tagName === 'INPUT') {
                //file input: old mode for IE9 (local)
                data = {
                    type:  file.val().split('.').length > 1  ? file.val().split('.').pop() : '',
                    module: 'mail',
                    group: 'input'
                };
            } else if (window.File && file instanceof window.File) {
                //file api elem: upload or dnd (local)
                data = {
                    type:  file.type || file.content_type || '',
                    module: 'any',
                    group: 'file'
                };
            }
            return data || {};
        },
        /**
         * create preview node with attached file property
         * @param  {object} file (or wrapper object)
         * @param  {jquery} rightside (optional: needed for mail to let the popup check for events in the editor iframe)
         * @return {jquery} textnode
         */
        createPreview = function (file, rightside) {
            return !self.hasPreview(file) ? $() : $('<a href="#" class="attachment-preview">')
                        .data({
                            file: file,
                            //app: app,
                            rightside: rightside
                        })
                        .text(gt('Preview'));
        },
        updatePopup = function (popup, content, type) {
            if (type === 'text/plain') {
                //inject image as data-url
                popup.css({ width: '100%', height: '100%' })
                        .append(
                            $('<div>')
                            .css({
                                width: '100%',
                                height: '100%'
                            })
                            .html(_.escape(content).replace(/\n/g, '<br>'))
                        );

            } else {
                //use content
                popup.css({ width: '100%', height: '100%' })
                        .append(
                            $('<div>')
                            .css({
                                width: '100%',
                                height: '100%',
                                backgroundImage: 'url(' + content + ')',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center center',
                                backgroundSize: 'contain'
                            })
                        );
            }
        };

    self = {
        /**
         * get details
         * @param  {object} file (or wrapper object)
         * @param  {string} key (optional)
         * @return {any}
         */
        get: function (obj, key) {
            var file = obj.file ? obj.file : obj,
                data = identify(file);
            return key ? data[key] : data;
        },
        /**
         * checks for preview support
         * @param  {object} file (or wrapper object)
         * @return {boolean}
         */
        hasPreview : function (file) {

            var data = self.get(file),
                isImage = (/^image\/(png|gif|jpe?g|bmp)$/i).test(data.type),
                isText = (/^text\/(plain)$/i).test(data.type),
                isOffice = false;

            if (capabilities.has('text')) {
                // if we have office support let's check those files too
                if (file.file) {
                    isOffice = new pre.Preview({mimetype: file.file.content_type, filename: file.file.filename}).supportsPreview();
                } else {
                    isOffice = new pre.Preview({mimetype: file.content_type, filename: file.filename}).supportsPreview();
                }
            }

            // nested mail
            if (data.type === 'eml') {
                return new pre.Preview({ mimetype: 'message/rfc822', parent: file.parent }).supportsPreview();
            // form input (IE9)
            } else if (data.group === 'input') {
                return false;
            // vcard
            } else if (data.group === 'reference') {
                return true;
            //local file content via fileReader
            } else  if (window.FileReader && (isImage || isText)) {
                return true;
            //office
            } else if (isOffice) {
                return true;
            //stored file
            } else {
                return (/(png|gif|jpe?g|bmp)$/i).test(data.type) || (/(txt)$/i).test(data.type);
            }
        },
        /**
         * returns node
         * @param  {object} file wrapper object
         * @param  {object} options
         * @return {jquery} node
         */
        node: function (obj, options) {
            var caller = this,
                icon, info,
                opt = $.extend({
                        showpreview: true,
                        rightside: $(),
                        labelmax: 30
                    }, options),
                //normalisation
                name = obj.name || obj.filename || obj.subject || '\u00A0',
                size = obj.file_size || obj.size || 0,
                $node;

            //prepare data
            size = size !== 0 ? gt.format('%1$s\u00A0 ', strings.fileSize(size)) : '';

            if (obj.group !== 'vcard') {
                //default
                icon = $('<i class="fa fa-paperclip">');
                info = $('<span>').addClass('filesize').text(size);
            } else {
                //vcard
                icon = $('<i class="fa fa-list-alt">');
                info = $('<span>').addClass('filesize').text(gt.noI18n('vCard\u00A0'));
                //lazy way; use contactsUtil.getFullName(attachment) for the perfect solution
                name = obj.file.display_name || obj.file.email1 || '';
            }

            //create node
            $node = $('<div>')
                .addClass(this.itemClasses)
                .append(
                    //file
                    $('<div class="item file">')
                        .addClass(this.fileClasses)
                        .append(
                            icon,
                            $('<div class="row-1">').text(_.noI18n(_.ellipsis(name, {max: opt.labelmax, charpos: 'middel'}))),
                            $('<div class="row-2">').append(
                                info,
                                opt.showpreview  ? createPreview(obj.file, opt.rightside) : $(),
                                $.txt('\u00A0')
                            ),
                             // remove
                            $('<a href="#" class="remove" tabindex="6">')
                            .attr('title', gt('Remove attachment'))
                            .append(
                                $('<i class="fa fa-trash-o">')
                            )
                            .on('click', function (e) {
                                e.preventDefault();
                                if (!('remove' in caller))
                                    console.error('Caller should provide a remove function.');
                                caller.remove(obj);
                            })
                    )
            );

            if (options.ref) {
                var fileObj = JSON.parse(JSON.stringify(obj));
                fileObj.name = name;
                fileObj.size = size;
                ext.point(options.ref).invoke('customize', $node, fileObj);
            }

            return $node;
        },

        /**
         * preview handler
         * @param  {object} popup
         * @param  {object} e
         * @param  {object} target
         */
        preview: function (popup, e, target) {
            e.preventDefault();

            var file = target.data('file'),
                data = self.get(file),  preview, reader;

            //close if editor is selected (causes overlapping, bug 27875)
            if (target.data('rightside')) {
                (target.data('rightside') || $())
                    .find('iframe').contents().find('body')
                    .one('click', this.close);
            }

            // nested message
            if (data.type === 'eml')  {
                preview = new pre.Preview({
                        data: { nested_message: file },
                        mimetype: 'message/rfc822',
                        parent: file.parent
                    }, {
                        width: popup.parent().width(),
                        height: 'auto'
                    });
                if (preview.supportsPreview()) {
                    preview.appendTo(popup);
                    popup.append($('<div>').text(_.noI18n('\u00A0')));
                }
            // refereneced contact vcard
            } else if (data.module === 'contacts') {
                require(['io.ox/contacts/view-detail'], function (view) {
                    popup.append(view.draw(file));
                });
            // infostore
            } else if (data.module === 'infostore') {
                require(['io.ox/files/api'], function (filesAPI) {
                    var prev = new pre.Preview({
                        name: file.filename,
                        filename: file.filename,
                        mimetype: file.file_mimetype,
                        size: file.file_size,
                        dataURL: filesAPI.getUrl(file, 'bare'),
                        version: file.version,
                        id: file.id,
                        folder_id: file.folder_id
                    }, {
                        width: popup.parent().width(),
                        height: 'auto'
                    });
                    if (prev.supportsPreview()) {
                        popup.append(
                            $('<h4>').addClass('mail-attachment-preview').text(file.filename)
                        );
                        prev.appendTo(popup);
                        popup.append($('<div>').text('\u00A0'));
                    }
                });
            // attachments
            } else if (file.atmsgref) {
                require(['io.ox/mail/api'], function (mailAPI) {
                    var pos = file.atmsgref.lastIndexOf('/');
                    file.parent = {
                        folder_id: file.atmsgref.substr(0, pos),
                        id: file.atmsgref.substr(pos + 1)
                    };
                    var prev = new pre.Preview({
                        data: file,
                        filename: file.filename,
                        source: 'mail',
                        folder_id: file.parent.folder_id,
                        id: file.parent.id,
                        attached: file.id,
                        parent: file.parent,
                        mimetype: file.content_type,
                        dataURL: mailAPI.getUrl(file, 'view')
                    }, {
                        width: popup.parent().width(),
                        height: 'auto'
                    });
                    if (prev.supportsPreview()) {
                        popup.append(
                            $('<h4>').addClass('mail-attachment-preview').text(file.filename)
                        );
                        prev.appendTo(popup);
                        popup.append($('<div>').text('\u00A0'));
                    }
                });
            //file reader
            } else {
                reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        return updatePopup(popup, e.target.result, file.type);
                    } finally {
                        reader = reader.onload = null;
                    }
                };

                if (file.type === 'text/plain')
                    reader.readAsText(file);
                else
                    reader.readAsDataURL(file);
            }
        }

    };
    return self;
});
