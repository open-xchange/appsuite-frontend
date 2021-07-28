/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/backbone/views/capture-media', [
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/media-devices',
    'gettext!io.ox/core',
    'less!io.ox/backbone/views/capture-media'
], function (ModalDialog, MiniViews, mediaDevices, gt) {

    'use strict';

    // chrome://settings/content/camera

    var MESSAGES = {
        'unspecified': gt('Please grant access to your webcam first.'),
        'pending': gt('Requesting device information. Please wait...'),
        'nodevices': gt('Currently there are no compatible webcams available on your device.')
    };

    function toDataURL(video) {
        video = video.get ? video.get(0) : video;
        var dimensions = {
                height: $(video).attr('data-height'),
                width: $(video).attr('data-width')
            },
            //video.getBoundingClientRect(),
            canvas = document.createElement('canvas');
        // ensure image looks exactly as the stream
        canvas.setAttribute('height', dimensions.height + 'px');
        canvas.setAttribute('width', dimensions.width + 'px');
        canvas.getContext('2d').drawImage(video, 0, 0);

        return canvas.toDataURL('image/png');
    }

    function stopTracks(stream) {
        if (stream) _.each(stream.getVideoTracks(), function (track) { track.stop(); });
    }

    return {

        getDialog: function () {
            return new ModalDialog({
                title: gt('Take a photo'),
                width: 500,
                point: 'io.ox/backbone/capture-media',
                model: new Backbone.Model(),
                async: true
            }).inject({
                updateDevices: function () {
                    var model = this.model;
                    return mediaDevices.getDevices('videoinput')
                        .then(function updateModel(devices) {
                            // ensure proper change event
                            model.unset('devices', { silent: true });
                            model.set({
                                'devices': devices,
                                'device': (_.first(devices) || {}).id
                            });
                        }, function (error) {
                            // usually listing of available devices not supported (IE)
                            model.set({
                                message: error.message,
                                devices: [],
                                device: undefined
                            });
                        });
                },
                setStream: function () {
                    var video = this.$('.stream'),
                        model = this.model,
                        data = model.toJSON(),
                        oldstream = model.get('stream');
                    this.$('button.btn-primary').attr('data-state', 'manual').prop('disabled', 'disabled').addClass('disabled');
                    if (_.isArray(data.devices) && data.devices.length === 0) return this.model.set('message', MESSAGES.nodevices);

                    // use generic or specific device constraints
                    var constraints = {
                        video: data.device ?
                            { optional: [{ sourceId: data.device }] } :
                            // prefer front camera
                            { width: { ideal: 400 }, height: { ideal: 400 }, facingMode: 'user' }
                    };
                    if (_.device('smartphone')) {
                        this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
                        constraints = { video: { facingMode: this.facingMode } };
                    }

                    // duck check: when deferred is pending user is asked for permission
                    var showPendingMessage = setTimeout(function () {
                        model.set('message', MESSAGES.unspecified);
                    }, 800);

                    video.addClass('hidden').attr('url', '').parent().busy({ immediate: true });
                    mediaDevices.getStream(constraints).then(function (stream) {
                        model.set({ 'access': true, 'stream': stream, 'message': '' });
                        video[0].srcObject = stream;
                        //video.attr('src', window.URL.createObjectURL(stream));
                    }, function (e) {
                        model.set({ 'access': false, 'stream': undefined, 'message': e.message });
                    }).always(function () {
                        clearTimeout(showPendingMessage);
                        // stop potentally running streams
                        stopTracks(oldstream);
                    });
                },
                onClose: function () {
                    stopTracks(this.model.get('stream'));
                },
                onApply: function () {
                    this.trigger('ready', toDataURL(this.$('.stream')));
                    this.onClose();
                    this.close();
                }
            }).extend({
                'init-start': function () {
                    this.$el.addClass('capture-media blank');
                    this.$('button.btn-primary').attr('data-state', 'manual').prop('disabled', 'disabled').addClass('disabled');
                    this.busy(true);
                },
                'hint': function () {
                    this.$body.append(
                        $('<div class="hint">').text(this.model.get('message'))
                    );
                    this.listenTo(this.model, 'change:message', function (model, message) {
                        // in case message is set: idle and hide other elements
                        this.$el.toggleClass('blank', !!message);
                        this.$('.hint').text(message);
                        this.idle();
                    });
                },
                'select-device': function () {
                    if (_.device('!desktop')) return;
                    var container = $('<div class="devices">'),
                        guid = _.uniqueId('form-control-label-');
                    this.$body.append(container);

                    // redraw
                    this.listenTo(this.model, 'change:devices', function (model, devices) {
                        container.toggleClass('hidden', (!devices || devices.length < 2))
                            .empty()
                            .append(
                                //#. label for a list of webcam devices currently available
                                $('<label class="control-label">').attr('for', guid).text(gt('Webcam')),
                                new MiniViews.SelectView({ name: 'device', model: this.model, list: devices, id: guid }).render().$el
                            );
                    });
                },
                'stream': function () {
                    var self = this;
                    this.$body.append(
                        $('<div class="stream-container">').append(
                            $('<video autoplay playsinline class="stream">').on('canplay', ready),
                            $('<button class="btn btn-link switchcamera" style="display:none;">').attr('title', gt('Switch camera')).append(
                                $('<i class="fa fa-refresh" aria-hidden="true">')
                            ).on('tap', function () { self.setStream(); })
                        )
                    );

                    this.listenTo(this.model, 'change:device', this.setStream);

                    function ready() {
                        self.$('.stream-container').idle();
                        self.$('button.btn-primary').removeAttr('disabled').removeClass('disabled');
                        // reset style to allow proper bound calculation
                        $(this).removeClass('hidden').removeAttr('style');
                        if (_.device('!desktop')) self.$('.switchcamera').show();
                        // first time we could gather reliable data
                        var bounds = this.getBoundingClientRect();
                        // gather basic information
                        var data = {
                            'data-height': bounds.height,
                            'data-width': bounds.width,
                            'ratio': bounds.width / bounds.height,
                            'orientation': bounds.width > bounds.height ? 'landscape' : 'portrait'
                        };
                        // get available space (side length of square 'viewport')
                        var length = Math.min(self.$('.stream-container').width(), self.$('.stream-container').height()),
                            // (usually) reduce size of video element
                            sizes = {
                                height: /landscape/.test(data.orientation) ? length : (length * data.ratio),
                                width: /landscape/.test(data.orientation) ? (length * data.ratio) : length
                            };
                        // store basic information as data attributes
                        $(this).attr(data);
                        if (_.device('!smartphone')) $(this).css(sizes);
                    }
                },
                'init-end': function () {
                    // register listeners
                    if (navigator.mediaDevices) navigator.mediaDevices.ondevicechange = this.updateDevices.bind(this);
                    this.updateDevices();
                }
            })
            .addCancelButton()
            .addButton({ label: gt('Take a photo'), action: 'apply' })
            .on({
                'apply': function () { this.onApply(); },
                'close': function () { this.onClose(); }
            });
        }
    };
});
