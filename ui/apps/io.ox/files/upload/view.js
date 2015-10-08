/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/files/upload/view', [
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/files',
    'io.ox/files/upload/main',
    'io.ox/core/extensions',
    'io.ox/core/strings',
    'less!io.ox/files/upload/style'
], function (dialogs, gt, fileUpload, ext, strings) {

    'use strict';

    var INDEX = 0,
        UploadEntry = Backbone.View.extend({
            initialize: function (baton) {
                var self = this;

                this.dialog = baton.dialog;
                this.model = baton.model;
                this.index = baton.index;

                this.model.on('change:progress', function (object, val) {
                    var val = Math.round(self.model.get('progress') * 100);

                    if (self.model.get('progress') === 1) {
                        //upload is finished
                        self.$el.find('.progress').addClass('invisible');
                        self.$el.find('.remove-icon')
                            .off('click')
                            .empty()
                            .append(
                                $('<i class="fa fa-lg fa-check">')
                            );
                    } else {
                        var progress = self.$el.find('.progress-bar');
                        progress
                            .css({ 'width': val + '%' })
                            .attr({ 'aria-valuenow': val });
                        progress.find('.sr-only').text(
                            //#. %1$s progress of currently uploaded files in percent
                            gt('%1$s completed', val + '%')
                        );
                    }
                });

                this.model.on('change:abort', function (object, val) {
                    if (val) {
                        var parent = self.$el.parent(),
                            list;

                        self.remove();

                        list = parent.find('.upload-entry');
                        list.each(function (counter, el) {
                            $(el).attr({ index: counter });
                        });

                        if (list.length === 0) {
                            self.dialog.close();
                        }
                    }
                });
            },
            render: function () {
                var val = Math.round(this.model.get('progress') * 100),
                    removeIcon = $('<div class="remove-icon">');

                this.$el.addClass('upload-entry').attr({ index: this.index });
                this.$el.append(
                    $('<div class="file-name">').text(this.model.get('file').name),
                    $('<div class="file-size">').text(gt.format('%1$s\u00A0', strings.fileSize(this.model.get('file').size))),
                    removeIcon,
                    $('<div class="progress">').addClass(this.model.get('progress') < 1 ? '' : 'invisible').append(
                        $('<div class="progress-bar progress-bar-striped active">')
                            .attr({
                                'role': 'progressbar',
                                'aria-valuenow': val,
                                'aria-valuemin': '0',
                                'aria-valuemax': '100'
                            })
                            .css({ 'width': val + '%' })
                            .append(
                                $('<span class="sr-only">').text(
                                    //#. %1$s progress of currently uploaded files in percent
                                    gt('%1$s completed', val + '%')
                                )
                            )
                    )
                );

                if (this.model.get('progress') < 1) {
                    removeIcon.append(
                        $('<a href=# class="remove-link">').text('Cancel')
                    );
                } else {
                    removeIcon.append(
                        $('<i class="fa fa-lg fa-check">')
                    );
                }
            },
            events: {
                'click .remove-link': 'removeEntry'
            },
            removeEntry: function (e) {
                e.preventDefault();

                var index = this.$el.attr('index');

                fileUpload.abort(index);
            }
        }),
        show = function () {
            var container = $('<div class="view-upload-wrapper">'),
                dialog = new dialogs.CreateDialog({ width: 450, center: true, async: true, container: $('.io-ox-files-window'), 'tabTrap': true });

            ext.point('io.ox/files/upload/files').invoke('draw', container, { collection: fileUpload.collection, dialog: dialog });

            dialog.header($('<h4>').text(gt('Upload progress')));
            dialog.getBody().append(container);
            dialog
                .addButton('cancel', gt('Close'), 'close',  { 'tabIndex': '1' })
                .on('close', function () {
                    fileUpload.collection.each(function (model) {
                        //remove all change listeners from the models in the collection
                        model.off('change:progress');
                    });
                })
                .show();
        };

    ext.point('io.ox/files/upload/files').extend({
        index: INDEX += 100,
        id: 'files',
        draw: function (baton) {
            baton.container = this;

            baton.collection.each(function (model, index) {
                var entry = new UploadEntry(
                    _.extend(baton, { model: model, index: index })
                );

                entry.render();
                baton.container.append(entry.el);
            });
        }
    });

    return { show: show };
});
