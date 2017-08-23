/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicableƒ
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/mail/compose/sharing', [
    'io.ox/backbone/views/extensible',
    'io.ox/backbone/mini-views/common',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/extensions',
    'io.ox/core/yell',
    'gettext!io.ox/mail',
    'settings!io.ox/core',
    'static/3rd.party/jquery-ui.min.js'
], function (ExtensibleView, mini, Dropdown, ext, yell, gt, coreSettings) {

    ext.point('io.ox/mail/compose/sharing').extend({
        id: 'toggle',
        index: 100,
        render: function () {
            var message = gt('Attachment file size too large. You have to use %1$s or reduce the attachment file size.', this.settings.name);

            this.$el.append(
                $('<a href="#" class="toggle" aria-expanded="false" role="button">').append(
                    $('<i class="fa fa-fw" aria-hidden="true">'),
                    //#. %1$s is usually "Drive Mail" (product name; might be customized)
                    $('<span>').text(gt('Use %1$s', this.settings.name))
                ).on('click', function () {
                    //#. %1$s is usually "Drive Mail" (product name; might be customized)
                    if (this.model.get('thresholdExceeded')) return yell('info', message);
                    // only uncheck if allowed (server setting can enforce drivemail if attachments are to large)
                    this.model.set('enable', !this.model.get('enable'));
                }.bind(this))
            );
        }
    }, {
        id: 'expire',
        index: 200,
        render: function () {
            var now = _.now();

            this.dropdown = new Dropdown({
                model: this.model,
                label: getLabel.bind(this),
                tagName: 'div',
                caret: true
            });

            // option: timespan
            _(this.settings.expiryDates).each(function (seed) {
                var count = seed.slice(0, seed.length - 1),
                    unit = seed.slice(seed.length - 1, seed.length),
                    timestamp = moment(now).add(count, unit).valueOf(),
                    text = '';

                switch (unit) {
                    case 'd':
                        text = gt.format(gt.ngettext('%1$d day', '%1$d days', count), count);
                        break;
                    case 'w':
                        text = gt.format(gt.ngettext('%1$d week', '%1$d weeks', count), count);
                        break;
                    case 'M':
                        text = gt.format(gt.ngettext('%1$d month', '%1$d months', count), count);
                        break;
                    case 'y':
                        text = gt.format(gt.ngettext('%1$d year', '%1$d years', count), count);
                        break;
                    default:
                        break;
                }
                this.dropdown.option('expiry_date', timestamp, text);
                if (seed === this.settings.defaultExpiryDate) this.model.set('expiry_date', timestamp);
            }.bind(this));

            // option: none
            if (!this.settings.requiredExpiration && !this.settings.forceAutoDelete) {
                this.dropdown.option('expiry_date', '', gt('no expiry date'));
                if (this.settings.defaultExpiryDate === '') this.model.set('expiry_date', '');
            }

            // update dropdown label
            this.listenTo(this.model, 'change:expiry_date', function () {
                this.dropdown.$('.dropdown-label').empty().append(getLabel.bind(this));
            });

            function getLabel() {
                var value = this.model.get('expiry_date');
                if (_.isUndefined(value)) return gt('Expiration');
                var option = this.dropdown.$ul.find('[data-value="' + value + '"]').parent().text();
                //#. %1$d represents a time span like "1 month" or "no expire"
                return gt('Expiration: %1$d', option);
            }

            this.$el.append(this.dropdown.render().$el.addClass('expire'));
        }
    }, {
        index: 300,
        render: function () {
            var self = this;
            this.dropdown
                .divider()
                .option('autodelete', true, gt('delete if expired'));

            var node = this.dropdown.$ul.find('[data-name="autodelete"]');

            // disable when forced
            if (this.settings.forceAutoDelete) return node.prop('disabled', true).addClass('disabled');
            // hide option and divider when 'no expire' is used
            this.listenTo(this.model, 'change:expiry_date', updateVisibility);
            updateVisibility();

            function updateVisibility() {
                var noExpire = self.model.get('expiry_date') === '';
                node.toggleClass('hidden', noExpire)
                    .parent().prev().toggleClass('hidden', noExpire);
            }
        }
    }, {
        id: 'notifications',
        index: 400,
        render: function () {
            if (!this.settings.enableNotifications) return;

            this.notificationModel = new Backbone.Model();

            this.$el.append(
                new Dropdown({
                    model: this.notificationModel,
                    label: gt('Notification'),
                    tagName: 'div',
                    caret: true
                })
                .option('download', true, gt('when the receivers have finished downloading the files'))
                .option('expired', true, gt('when the link is expired'))
                .option('visit', true, gt('when the receivers have accessed the files'))
                .render().$el.addClass('notification')
            );

            this.listenTo(this.notificationModel, 'change', function () {
                this.model.set('notifications', _.allKeys(this.notificationModel.attributes));
            });
        }
    }, {
        id: 'password',
        index: 500,
        render: function () {
            var model = this.model, passContainer;

            function toggleState() {
                if (model.get('usepassword')) return passContainer.find('input').prop('disabled', false);
                passContainer.find('input').prop('disabled', true);
            }

            this.$el.append(
                $('<div class="input-group password">').append(
                    $('<span class="input-group-addon">').append(
                        new mini.CheckboxView({ name: 'usepassword', model: model }).render().$el
                    ),
                    passContainer = new mini.PasswordViewToggle({ name: 'password', model: model, placeholder: gt('Password'), autocomplete: false }).render().$el
                )
            );
            model.on('change:usepassword', toggleState);
            toggleState();
        }
    });

    var SharingView = ExtensibleView.extend({

        tagName: 'div',

        className: 'share-attachments',

        point: 'io.ox/mail/compose/sharing',

        initialize: function (options) {
            _.extend(this, options);

            this.model = new Backbone.Model({
                'instruction_language': coreSettings.get('language'),
                'enable': false,
                'thresholdExceeded': false,
                'autodelete': this.settings.forceAutoDelete
            });

            // show/hide
            this.listenTo(this.collection, 'update', this.updateVisibility);
            this.listenTo(this.model, 'change:enable change:thresholdExceeded', this.updateVisibility);

            // force
            if (this.settings.threshold > 0) {
                this.mailModel.get('attachments').on('add remove reset', function updateThreshold() {
                    var actualAttachmentSize = this.mailModel.get('attachments').getSize();
                    this.model.set('thresholdExceeded', actualAttachmentSize > this.settings.threshold);
                }.bind(this));
            }

            // update mail model onChange
            this.listenTo(this.model, 'change', function (model) {
                if (!model.get('enable')) return this.mailModel.unset('share_attachments');
                var blacklist = ['usepassword', 'thresholdExceeded'];
                // don't save password if the field is empty or disabled.
                if (!model.get('usepassword') || _.isEmpty(model.get('password'))) blacklist.push('password');
                this.mailModel.set('share_attachments', _.omit(model.attributes, blacklist));
            });
        },

        updateVisibility: function () {
            var isActive = !!this.getValidModels().length && (this.model.get('thresholdExceeded') || this.model.get('enable'));
            this.$el.toggleClass('active', isActive);
        },

        // TODO: move into attachment collection?
        getValidModels: function () {
            return this.collection.filter(function (model) {
                return model.isFileAttachment();
            });
        },

        render: function () {
            if (this.isRendered) return this;
            this.invoke('render');
            this.isRendered = true;
            return this;
        }
    });

    return SharingView;
});
