/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/backbone/views/edit-picture', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'io.ox/backbone/views/capture-media',
    'io.ox/core/media-devices',
    'settings!io.ox/core',
    'io.ox/contacts/api',
    'gettext!io.ox/contacts',
    'static/3rd.party/croppie.min.js',
    'css!3rd.party/croppie/croppie.css',
    'less!io.ox/backbone/views/edit-picture'
], function (ext, ModalDialog, caputure, mediaDevices, coreSettings, api, gt) {

    'use strict';

    function getContent(file) {
        var def = $.Deferred(),
            reader = new FileReader();
        reader.onload = function (e) { def.resolve(e.target.result); };
        reader.onerror = function (e) { def.reject(undefined, e); };
        reader.readAsDataURL(file);
        return def;
    }

    function getButton(opt) {
        return $('<button type="button" class="btn btn-default" data-action="rotate">')
            .attr({
                'aria-label': opt.label,
                'title': opt.label,
                'data-action': opt.action,
                'data-toggle': 'tooltip',
                'data-placement': 'bottom',
                'data-animation': 'false',
                'data-trigger': 'hover',
                'data-container': 'body'
            })
            .tooltip()
            .append($('<i class="fa" aria-hidden="true">').addClass(opt.className));
    }

    function mapOrientation(num) {
        // 1 = 0°, 6: 90°, 3: 180°, 8: 270°
        var ids = [1, 6, 3, 8],
            index = Math.max(ids.indexOf(num), 0) + 1;
        return ids[index % 4];
    }

    return {

        getDialog: function (opt) {

            return new ModalDialog({
                title: opt.title || gt('Edit image'),
                point: 'io.ox/backbone/crop',
                width: 500,
                async: true,
                model: opt.model || new Backbone.Model(),
                focus: 'input.cr-slider'
            }).inject({
                load: function () {
                    var self = this;
                    return $.when()
                        .then(function () {
                            var file = self.model.get('pictureFile'),
                                imageurl = self.model.get('image1_url');
                            // add unique identifier to prevent caching bugs
                            if (imageurl) imageurl = imageurl + '&' + $.param({ uniq: _.now() });
                            // a) dataUrl (webcam photo)
                            if (_.isString(file)) return file;
                            // b) server image (or blank)
                            if (!file || !file.lastModified) return imageurl;
                            // c) local file
                            return getContent(file);
                        }).then(self.setImage.bind(self));
                },
                storeState: function (opt) {
                    var current = _.extend({}, this.model.get('crop'), this.$body.croppie('get'));
                    // degree value TO croppie's orientation ids
                    if (opt && opt.rotate) current.orientation = mapOrientation(current.orientation);
                    this.model.set('crop', current);
                },
                setImage: function (imageurl) {
                    // toggle class: empty state
                    this.$el.toggleClass('blank', !imageurl);
                    // restore latest state
                    var options = _.extend({ zoom: 0.0 }, this.model.get('crop'), { url: imageurl });
                    if (!imageurl) return;
                    this.$('.cr-boundary, .cr-slider-wrap').show();
                    return this.$body.croppie('bind', options);
                },
                onApply: function () {
                    var width = coreSettings.get('properties/contactImageMaxWidth', 500);
                    this.storeState();
                    this.$body
                        .croppie('result', { type: 'blob', size: { width: width }, format: 'jpeg', quality: 1.0 })
                        .then(function (blob) {
                            //store info
                            var scaled = new File([blob], 'cropped.jpeg', { type: 'image/jpeg' });
                            // trigger proper change events
                            this.model.unset('pictureFileEdited', { silent: true });
                            this.model.set('pictureFileEdited', scaled);
                            // dialog
                            this.idle();
                            this.close();
                        }.bind(this));
                },
                onCancel: function () {
                    this.model.unset('pictureFile');
                },
                onUserMedia: function () {
                    caputure.getDialog().open().on('ready', function (dataURL) {
                        this.model.set('pictureFile', dataURL);
                        this.setImage(dataURL);
                    }.bind(this));
                },
                onRotate: function () {
                    this.$body.croppie('rotate', 90);
                    this.storeState({ rotate: true });
                    this.idle();
                },
                onUpload: function () {
                    this.trigger('upload');
                }
            }).extend({
                'default': function () {
                    this.$el.addClass('edit-picture');
                    this.busy();
                    // reserve some more space for the stacked buttons on small devices
                    var dimension = Math.min(window.innerWidth - 64, window.innerHeight - 64, _.device('small') ? 322.25 : 466);
                    var options = {
                        viewport: { width: dimension - 100, height: dimension - 100, type: 'circle' },
                        boundary: { width: dimension, height: dimension },
                        showZoomer: true,
                        enableResize: false,
                        enableOrientation: true
                    };
                    this.$body.croppie(options);
                    this.load().done(this.idle);
                },
                'slider-label': function () {
                    var $body = this.$body;
                    // increase step size and add slider label
                    var id = _.uniqueId('slider-');
                    $body.on('update', update)
                        .find('input.cr-slider')
                        .attr({ 'id': id, 'step': '0.01' })
                        .before($('<label id="zoom" class="control-label">').attr('for', id));
                    // use percental values
                    function update() {
                        // update label
                        var $slider = $body.find('input.cr-slider'),
                            min = $slider.attr('min'),
                            max = $slider.attr('max'),
                            step = $slider.attr('step'),
                            current = $body.croppie('get').zoom,
                            zoom = ((current - min) * 100 / (max - min)),
                            //#. image zoom, %1$d is the zoomlevel of the previewpicture in percent
                            text = zoom ? gt.format('Zoom: %1$d%', zoom.toFixed(0)) :
                                //#. noun. label for the zoomslider in case the zoom is undefined or 0
                                gt('Zoom');
                        // remove 'blind spot' at range end (last step would exceed max)
                        $slider.attr('max', max = max - ((max - min) % step));
                        // maps absolute numbers to percental values
                        $body.find('#zoom').text(text);
                    }
                },
                'empty-state': function () {
                    this.$body.append(
                        $('<div class="empty-state">')
                    );
                },
                'croppie-focus': function () {
                    this.$body.find('.cr-boundary').on('mousedown click', function () {
                        $(this).find('.cr-viewport.cr-vp-circle').focus();
                    });
                },
                'inline-actions': function () {
                    this.$body.append(
                        $('<div class="inline-actions">').append(
                            getButton({ label: gt('Upload image'), action: 'upload', className: 'fa-upload' })
                                .on('click', this.onUpload.bind(this)),
                            !mediaDevices.isSupported() ? $() : getButton({ label: gt('Take photo'), action: 'usermedia', className: 'fa-camera' })
                                .on('click', this.onUserMedia.bind(this)),
                            getButton({ label: gt('Rotate image'), action: 'rotate', className: 'fa-repeat' })
                                .on('click', this.onRotate.bind(this))
                        ).on('click', 'button', function (e) {
                            $(e.currentTarget).tooltip('hide');
                        })
                    );
                    this.$('.empty-state').append(
                        $('<div class="inline-actions">').append(
                            getButton({ label: gt('Upload image'), action: 'upload', className: 'fa-upload' })
                                .addClass('btn-lg')
                                .on('click', this.onUpload.bind(this)),
                            !mediaDevices.isSupported() ? $() : getButton({ label: gt('Take photo'), action: 'usermedia', className: 'fa-camera' })
                                .addClass('btn-lg')
                                .on('click', this.onUserMedia.bind(this))
                        ).on('click', 'button', function (e) {
                            $(e.currentTarget).tooltip('hide');
                        })
                    );
                }
            })
            .addAlternativeButton({ label: gt('Remove image'), action: 'remove' })
            .addCancelButton()
            .addButton({ label: gt('Apply'), action: 'apply' })
            .on('remove', function () {
                this.onCancel();
            })
            .on('cancel', function () {
                this.onCancel();
            })
            .on('apply', function () {
                if (!this.$el.hasClass('blank')) return this.onApply();
                // simply cancel when no image was provided
                this.onCancel();
                return this.close();
            });
        }
    };
});
