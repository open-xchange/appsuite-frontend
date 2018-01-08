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
    'settings!io.ox/core',
    'gettext!io.ox/contacts',
    'static/3rd.party/croppie.min.js',
    'css!3rd.party/croppie/croppie.css',
    'less!io.ox/backbone/views/edit-picture'
], function (ext, ModalDialog, coreSettings, gt) {

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
        return $('<button class="btn btn-default" data-action="rotate">')
            .attr({
                'aria-label': opt.label,
                'title': opt.label,
                'data-action': opt.action,
                'data-toggle': 'tooltip',
                'data-placement': 'bottom',
                'data-animation': 'false',
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
                title: gt('Edit picture'),
                width: 560,
                point: 'io.ox/backbone/crop',
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
                            // server image url vs. local file
                            if (!file || !file.lastModified) return imageurl;
                            return getContent(file);
                        }).then(function (imageurl) {
                            // restore latest state
                            var history = _.extend({}, self.model.get('crop'));
                            //history.orientation = mapOrientation(history.orientation);
                            self.$body.croppie('bind', _.extend(history, { url: imageurl }));
                        });
                },
                storeState: function (opt) {
                    var current = _.extend({}, this.model.get('crop'), this.$body.croppie('get'));
                    // degree value TO croppie's orientation ids
                    if (opt && opt.rotate) current.orientation = mapOrientation(current.orientation);
                    this.model.set('crop', current);
                },
                onApply: function () {
                    var width = coreSettings.get('properties/contactImageMaxWidth', 500);
                    this.storeState();
                    this.$body
                        .croppie('result', { type: 'blob', size: { width: width }, format: 'png', quality: 0.9 })
                        .then(function (blob) {
                            //store info
                            var scaled = new File([blob], 'cropped.png', { type: 'image/png' });
                            // trigger proper change events
                            this.model.unset('pictureFileEdited', { silent: true });
                            this.model.set('pictureFileEdited', scaled);
                            // dialog
                            this.idle();
                            this.close();
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
                    var dimension = Math.min(window.innerWidth - 64, window.innerHeight - 64, _.device('small') ? 300 : 400);
                    var options = {
                        viewport: { width: dimension - 100, height: dimension - 100, type: 'square' },
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
                        .after($('<output id="zoom">').attr('for', id));
                    // use percental values
                    function update() {
                        // update label
                        var $slider = $body.find('input.cr-slider'),
                            min = $slider.attr('min'),
                            max = $slider.attr('max'),
                            step = $slider.attr('step'),
                            current = $body.croppie('get').zoom;
                        // remove 'blind spot' at range end (last step would exceed max)
                        $slider.attr('max', max = max - ((max - min) % step));
                        // maps absolute numbers to percental values
                        $body.find('#zoom').text(((current - min) * 100 / (max - min)).toFixed(0) + '%');
                    }
                },
                'croppie-focus': function () {
                    this.$body.find('.cr-boundary').on('mousedown click', function () {
                        $(this).find('.cr-viewport.cr-vp-square').focus();
                    });
                },
                'inline-actions': function () {
                    this.$body.append(
                        $('<div class="inline-actions">').append(
                            getButton({ label: gt('Upload image'), action: 'upload', className: 'fa-upload' })
                                .on('click', this.onUpload.bind(this)),
                            getButton({ label: gt('Rotate image'), action: 'rotate', className: 'fa-repeat' })
                                .on('click', this.onRotate.bind(this))
                        )
                    );
                }
            })
            .addCancelButton()
            .addButton({ label: gt('Ok'), action: 'apply' })
            .on('apply', function () {
                this.onApply();
            });
        }
    };
});
