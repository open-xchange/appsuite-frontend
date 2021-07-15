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

define('io.ox/files/share/public-link', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/extensions',
    'io.ox/files/share/api',
    'io.ox/files/share/model',
    'io.ox/core/api/group',
    'io.ox/core/yell',
    'gettext!io.ox/files',
    'io.ox/backbone/mini-views/copy-to-clipboard',
    'static/3rd.party/polyfill-resize.js',
    'less!io.ox/files/share/style'
], function (DisposableView, ext, api, sModel, groupApi, yell, gt, CopyToClipboard) {

    'use strict';

    var INDEX = 0,
        POINT = 'io.ox/files/share/public-link';

    /*
     * extension point title text
     */
    ext.point(POINT + '/fields').extend({
        id: 'title',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<h5></h5>').text(gt('Public link'))
            );
        }
    });

    /*
     * extension point title text
     */
    ext.point(POINT + '/fields').extend({
        id: 'public-link-row',
        index: INDEX += 100,
        draw: function (baton) {
            var link = baton.model.get('url');

            var copyLinkButton = new CopyToClipboard({
                content: link,
                buttonStyle: 'link',
                buttonLabel: gt('Copy link'),
                events: {
                    'click': function () {
                        this.$el.tooltip('hide');
                        require(['io.ox/core/yell'], function (yell) {
                            yell({ type: 'success', message: gt('The link has been copied to the clipboard.') });
                        });
                    }
                }
            });

            var file = baton.model.get('files')[0];
            var linkLabel;
            if (file.isFile()) {
                linkLabel = gt('Anyone on the internet with the link can view the file.');
            } else if (file.get('module') === 'calendar') {
                linkLabel = gt('Anyone on the internet with the link can view the calendar.');
            } else {
                linkLabel = gt('Anyone on the internet with the link can view the folder.');
            }
            this.append(
                // input,
                $('<div class="row"></div>')
                .append(
                    $('<div class="col-sm-1 col-xs-2 text-center"><i class="fa fa-link" aria-hidden="true"></i></div>'),
                    $('<div class="col-sm-5 col-xs-6"></div>').text(linkLabel),
                    $('<div class="col-sm-6 col-xs-4 text-left"></div>').append(copyLinkButton.render().$el)
                )
            );

            baton.model.on('change:url', function (model) {
                var url = model.get('url');
                copyLinkButton.changeClipboardText(url);
            });
        }
    });

    /*
     * main view
     */
    var PublicLink = DisposableView.extend({

        className: 'public-link',
        hadUrl: false,

        initialize: function (options) {

            this.model = new sModel.WizardShare({ files: options.files });
            this.baton = ext.Baton({ model: this.model, view: this });
            this.listenTo(this.model, 'invalid', function (model, error) {
                yell('error', error);
            });
            this.hadUrl = !!this.model.hasUrl();
            this.originalAttributes = _.clone(this.model.attributes);
        },

        render: function () {
            this.$el.addClass(this.model.get('type'));
            // draw extensionpoints
            ext.point(POINT + '/fields').invoke('draw', this.$el, this.baton);
            if (!this.hasPublicLink()) {
                this.hide();
            }
            return this;
        },

        share: function () {
            var result;

            if (!this.hasChanges()) {
                return $.Deferred().resolve();
            }

            // function 'save' returns a jqXHR if validation is successful and false otherwise (see backbone api)
            result = this.model.save();

            //  to unify the return type for later functions, we must return a deferred
            if (result === false) {
                // no yell message needed, therefore return directly, the yell is called in the save function above
                return $.Deferred().reject();
            }
            this.hadUrl = false;

            return result.fail(yell);

        },

        cancel: function () {
            if (!this.hadUrl && this.model.hasUrl()) {
                this.removeLink();
            }
        },

        fetchLink: function () {
            if (!this.model.hasUrl()) {
                this.model.fetch();
            }
        },

        removeLink: function () {
            var model = this.model;
            return api.deleteLink(model.toJSON(), model.get('lastModified'))
                .done(function () {
                    // refresh the guest group (id = int max value)
                    groupApi.refreshGroup(2147483647);
                })
                .done(function () {
                    model.set('url', null);
                });
        },

        hide: function () {
            this.$el.hide();
        },

        show: function () {
            this.$el.show();
        },

        hasPublicLink: function () {
            return this.model.hasUrl();
        },

        getChanges: function () {
            var original = this.originalAttributes, changes = {};
            _(this.model.attributes).each(function (val, id) {
                if (!_.isEqual(val, original[id])) {
                    changes[id] = val;
                }
            });
            // limit to relevant attributes
            return _(changes).pick('expiry_date', 'includeSubfolders', 'password', 'temporary');
        },

        hasChanges: function () {
            return this.hadUrl !== this.hasPublicLink() || !_.isEmpty(this.getChanges());
        }
    });

    return PublicLink;
});
