/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2013
 * Mail: info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/core/tk/attachmentsUtil',
    ['io.ox/core/strings',
     'io.ox/preview/main',
     'io.ox/core/tk/dialogs',
     'gettext!io.ox/core/tk/attachments',
     'io.ox/core/extPatterns/links',
     'less!io.ox/core/tk/attachments.less'
    ], function (strings, pre, dialogs, gt, links) {

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
                        module: 'mail',
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
            //createPreview: function (file, app, rightside) {
            createPreview = function (file, rightside) {
                return !self.hasPreview(file) ? $() : $('<a href="#" class="attachment-preview">')
                            .data({
                                file: file,
                                //app: app,
                                rightside: rightside
                            })
                            .text(gt('Preview'));
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
                var data = self.get(file);
                // nested mail
                if (data.type === 'eml') {
                    return new pre.Preview({ mimetype: 'message/rfc822', parent: file.parent }).supportsPreview();
                // form input (IE9)
                } else if (data.group === 'input') {
                    return false;
                // vcard
                } else if (data.group === 'reference') {
                    return true;
                //local file via mimetype
                } else  if (window.FileReader && (/^image\/(png|gif|jpe?g|bmp)$/i).test(data.type)) {
                    return true;
                //stored file
                } else {
                    return (/(png|gif|jpe?g|bmp)$/i).test(data.type);
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
                    opt = $.extend(options, {
                            showpreview: true
                        }),
                    //normalisation
                    name = obj.name || obj.filename || obj.subject || '\u00A0',
                    size = obj.file_size || obj.size || 0;

                //prepare data
                size = size !== 0 ? gt.format('%1$s\u00A0 ', strings.fileSize(size)) : '';

                if (obj.group !== 'vcard') {
                    //default
                    icon = $('<i>').addClass('icon-paper-clip');
                    info = $('<span>').addClass('filesize').text(size);
                } else {
                    //vcard
                    icon = $('<i>').addClass('icon-list-alt');
                    info = $('<span>').addClass('filesize').text(gt.noI18n('vCard\u00A0'));
                    //lazy way; use contactsUtil.getFullName(attachment) for the perfect solution
                    name = obj.file.display_name || obj.file.email1 || '';
                }

                //create node
                return $('<div>')
                    .addClass(this.itemClasses)
                    .append(
                        //file
                        $('<div class="item file">')
                            .addClass(this.fileClasses)
                            .append(
                                icon,
                                $('<div class="row-1">').text(_.noI18n(name)),
                                $('<div class="row-2">').append(
                                    info,
                                    opt.showpreview  ? createPreview(obj.file, options.rightside) : $(),
                                    $.txt('\u00A0')
                                ),
                                 // remove
                                $('<a href="#" class="remove" tabindex="6">')
                                .attr('title', gt('Remove attachment'))
                                .append(
                                    $('<i class="icon-trash">')
                                )
                                .on('click', function (e) {
                                    e.preventDefault();
                                    if (!('remove' in caller))
                                        console.error('Caller should provide a remove function.');
                                    caller.remove(obj);
                                })
                        )
                );
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
                // inject image as data-url
                } else {
                    reader = new FileReader();
                    reader.onload = function (e) {
                        popup.css({ width: '100%', height: '100%' })
                        .append(
                            $('<div>')
                            .css({
                                width: '100%',
                                height: '100%',
                                backgroundImage: 'url(' + e.target.result + ')',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center center',
                                backgroundSize: 'contain'
                            })
                        );
                        reader = reader.onload = null;
                    };
                    reader.readAsDataURL(file);
                }
            }

        };
        return self;
    }
);
