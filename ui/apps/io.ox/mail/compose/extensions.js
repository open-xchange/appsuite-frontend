/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/compose/extensions', [
    'io.ox/contacts/api',
    'io.ox/mail/sender',
    'io.ox/backbone/mini-views/common',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/tk/tokenfield',
    'io.ox/core/dropzone',
    'io.ox/core/capabilities',
    'io.ox/mail/actions/attachmentQuota',
    'io.ox/core/util',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'io.ox/core/extPatterns/links',
    'settings!io.ox/core',
    'settings!io.ox/contacts',
    'static/3rd.party/jquery-ui.min.js'
], function (contactAPI, sender, mini, Dropdown, ext, actions, Tokenfield, dropzone, capabilities, attachmentQuota, util, settings, gt, links, coreSettings, settingsContacts) {

    var POINT = 'io.ox/mail/compose';

    //make strings accessible to translators
    var tokenfieldTranslations = {
        to: gt('To'),
        //#. %1$s is the name of the inputfield (To, CC, BCC)
        ariato: gt('%1$s autocomplete token field. Use left and right Arrowkeys to navigate between the tokens', gt('To')),
        cc: gt('CC'),
        //#. %1$s is the name of the inputfield (To, CC, BCC)
        ariacc: gt('%1$s autocomplete token field. Use left and right Arrowkeys to navigate between the tokens', gt('CC')),
        bcc: gt('BCC'),
        //#. %1$s is the name of the inputfield (To, CC, BCC)
        ariabcc: gt('%1$s autocomplete token field. Use left and right Arrowkeys to navigate between the tokens', gt('BCC')),
        reply_to: /*#. Must not exceed 8 characters. e.g. German would be: "Antworten an", needs to be abbreviated like "Antw. an" as space is very limited */ gt.pgettext('compose', 'Reply to')
    };

    var extensions = {

        header: function (baton) {
            if (!baton.view.app.getWindow()) return;
            var header = $('<div data-extension-id="header">');
            baton.$header = header;
            ext.point(POINT + '/header').invoke('draw', header, baton);
            baton.view.app.getWindow().setHeader(header);
        },

        title: function () {
            this.append(
                $('<h1 class="sr-only">').text(gt('Compose new mail'))
            );
        },

        buttons: {
            discard: function (baton) {
                return (
                    $('<button type="button" class="btn btn-default" data-action="discard">')
                        .on('click', function () { baton.view.app.quit(); })
                        .text(baton.model.keepDraftOnClose() ? gt('Delete') : gt('Discard'))
                        .appendTo(this)
                );
            },
            save: function (baton) {
                this.append($('<button type="button" class="btn btn-default" data-action="save">')
                    .on('click', function () {
                        if (baton.view.isSaving === true) return false;
                        baton.view.isSaving = true;
                        baton.view.saveDraft().always(function () {
                            baton.view.isSaving = false;
                        });
                    })
                    .text(gt('Save')));
            },
            send: function (baton) {
                this.append($('<button type="button" class="btn btn-primary" data-action="send">')
                    .on('click', function () { baton.view.send(); })
                    .on('keyup', function (e) {
                        if (e.which === 27) baton.view.focusEditor();
                    })
                    .text(gt('Send')));
            }
        },

        inlineYell: function () {
            // role log is a special kind of live region for status messages, errors etc.
            this.append($('<div role="log" aria-live="polite" class="inline-yell">'));
        },

        sender: function (baton) {

            function editNames() {
                require(['io.ox/mail/compose/names'], function (names) {
                    names.open();
                });
            }

            var node = $('<div class="row sender" data-extension-id="sender">'),
                render = function () {

                    function renderFrom(array) {
                        if (!array) return;
                        var name = array[0], address = array[1];
                        return [
                            $('<span class="name">').text(name ? name + ' ' : ''),
                            $('<span class="address">').text(name ? '<' + address + '>' : address)
                        ];
                    }

                    var defaultSender = _(baton.model.get('from')).first(),
                        dropdown = new Dropdown({
                            model: baton.model,
                            label: renderFrom(defaultSender),
                            aria: gt('From'),
                            caret: true
                        });

                    sender.drawDropdown().done(function (list) {

                        function toggleNames() {
                            var value = !!settings.get('sendDisplayName', true);
                            settings.set('sendDisplayName', !value).save();
                            baton.model.set('sendDisplayName', !value);
                            ox.trigger('change:customDisplayNames');
                            // stop propagation to keep drop-down open
                            return false;
                        }

                        function redraw() {
                            var from = _(baton.model.get('from')).first();
                            dropdown.$('ul').empty();
                            drawOptions();
                            dropdown.$('.dropdown-label').empty().append(renderFrom(from));
                            // re-focus element otherwise the bootstap a11y closes the drop-down
                            dropdown.$ul.find('[data-name="toggle-display"]').focus();
                        }

                        function applyDisplayName(item) {
                            // consider custom settings
                            var name = item[0], address = item[1];
                            if (!settings.get('sendDisplayName', true)) {
                                name = null;
                            } else if (settings.get(['customDisplayNames', address, 'overwrite'])) {
                                name = settings.get(['customDisplayNames', address, 'name'], '');
                            }
                            return [name, address];
                        }

                        function drawOptions() {

                            if (!list.sortedAddresses.length) return;

                            var defaultAddress = sender.getDefaultSendAddress();

                            var sortedAddresses = _(list.sortedAddresses)
                                .chain()
                                .map(function (address) {
                                    var array = applyDisplayName(address.option);
                                    return { key: _(array).compact().join(' ').toLowerCase(), array: array };
                                })
                                .sortBy('key')
                                .pluck('array')
                                .value();

                            // draw default address first
                            sortedAddresses = _(sortedAddresses).filter(function (item) {
                                if (item[1] !== defaultAddress) return true;
                                dropdown.option('from', [item], function () {
                                    return renderFrom(item);
                                });
                                if (sortedAddresses.length > 1) dropdown.divider();
                                return false;
                            });

                            _(sortedAddresses).each(function (item) {
                                dropdown.option('from', [item], function () {
                                    return renderFrom(item);
                                });
                            });

                            if (_.device('smartphone')) return;

                            // append options to toggle and edit names
                            var state = !!settings.get('sendDisplayName', true);
                            dropdown
                                .divider()
                                .link('toggle-display', state ? gt('Hide names') : gt('Show names'), toggleNames)
                                .link('edit-real-names', gt('Edit names'), editNames);
                        }

                        drawOptions();

                        node.append(
                            $('<label class="maillabel col-xs-1">').text(gt('From')),
                            $('<div class="col-xs-11">').append(
                                dropdown.render().$el.attr({ 'data-dropdown': 'from' })
                            )
                        );

                        ox.on('change:customDisplayNames', function () {
                            // fix current value
                            var from = baton.model.get('from');
                            if (from) baton.model.set('from', [applyDisplayName(from[0])]);
                            // redraw drop-down
                            redraw();
                        });
                        baton.view.listenTo(baton.model, 'change:from', redraw);
                    });
                };

            if (!baton.model.get('from')) {
                baton.model.once('change:from', function () {
                    render();
                });
            } else {
                render();
            }

            this.append(node);
        },

        // TODO: only used by search
        tokenPicture: function (model) {
            // add contact picture
            $(this).prepend(
                contactAPI.pictureHalo(
                    $('<div class="contact-image">'),
                    model.toJSON(),
                    { width: 16, height: 16, scaleType: 'contain' }
                )
            );
        },

        recipientActionLink: function (type) {
            return function () {
                var node = $('<a href="#" data-action="add" role="checkbox" aria-checked="false">');
                if (type === 'cc') {
                    node.attr({ 'data-type': 'cc', 'aria-label': gt('Show carbon copy input field') }).text(gt('CC'));
                } else {
                    node.attr({ 'data-type': 'bcc', 'aria-label': gt('Show blind carbon copy input field') }).text(gt('BCC'));
                }
                this.append(node);
            };
        },

        recipientActionLinkMobile: function () {
            var node = $('<a href="#" data-action="add" role="checkbox" aria-checked="false">').append($('<span class="fa fa-angle-right">'));
            this.append(node);
        },

        recipientActions: function () {
            var node = $('<div class="recipient-actions">');
            if (_.device('!smartphone')) {
                ext.point(POINT + '/recipientActionLink').invoke('draw', node);
            } else {
                ext.point(POINT + '/recipientActionLinkMobile').invoke('draw', node);
            }

            this.append(node);
        },

        tokenfield: function (attr) {

            if (attr === 'reply_to' && settings.get('showReplyTo/configurable', false) === false) return;

            function openAddressBookPicker(e) {
                e.preventDefault();
                var attr = e.data.attr, model = e.data.model;
                require(['io.ox/contacts/addressbook/popup'], function (popup) {
                    popup.open(function (result) {
                        var list = model.get(attr) || [];
                        model.set(attr, list.concat(_(result).pluck('array')));
                    });
                });
            }

            return function (baton) {
                var extNode,
                    guid = _.uniqueId('form-control-label-'),
                    value = baton.model.get(attr) || [],
                    // hide tokeninputfields if necessary (empty cc/bcc)
                    cls = 'row' + (/cc$/.test(attr) && !value.length ? ' hidden' : ''),
                    redrawLock = false,
                    tokenfieldView = new Tokenfield({
                        id: guid,
                        className: attr,
                        extPoint: POINT,
                        isMail: true,
                        apiOptions: {
                            limit: 20,
                            contacts: true,
                            distributionlists: true,
                            msisdn: true,
                            emailAutoComplete: true
                        },
                        maxResults: 30,
                        placeholder: tokenfieldTranslations[attr], // for a11y and easy access for custom dev when they want to display placeholders (these are made transparent via less)
                        ariaLabel: tokenfieldTranslations['aria' + attr]
                    });

                var node = $('<div class="col-xs-11">').append(tokenfieldView.$el);

                if (attr === 'to') {
                    ext.point(POINT + '/recipientActions').invoke('draw', node);
                }

                var usePicker = !_.device('smartphone') && capabilities.has('contacts') && settingsContacts.get('picker/enabled', true);

                if (usePicker) {
                    node.addClass('has-picker').append(
                        $('<a href="#" role="button" class="open-addressbook-popup"><i class="fa fa-address-book" aria-hidden="true"></i></a>')
                        .attr('aria-label', gt('Select contacts'))
                        .on('click', { attr: attr, model: baton.model }, openAddressBookPicker)
                    );
                }

                var title = gt('Select contacts');

                this.append(
                    extNode = $('<div data-extension-id="' + attr + '">').addClass(cls)
                    .append(
                        usePicker ?
                            // with picker
                            $('<div class="maillabel col-xs-1">').append(
                                $('<a href="#" role="button">')
                                .text(tokenfieldTranslations[attr])
                                .attr({
                                    // add aria label since tooltip takes away the title attribute
                                    'aria-label': title,
                                    'title': title
                                })
                                .on('click', { attr: attr, model: baton.model }, openAddressBookPicker)
                                .tooltip({ animation: false, delay: 0, placement: 'bottom', trigger: 'hover' })
                            ) :
                            // without picker
                            $('<label class="maillabel col-xs-1">').text(tokenfieldTranslations[attr]).attr({ 'for': guid })
                    )
                    .append(node)
                );

                tokenfieldView.render().$el.on('tokenfield:createdtoken', function (e) {
                    // extension point for validation etc.
                    ext.point(POINT + '/createtoken').invoke('action', this, _.extend(baton, { event: e }));
                }).on('tokenfield:next', function () {
                    extNode.nextAll().find('input.tt-input,input[name="subject"]').filter(':visible').first().focus();
                }).on('tokenfield:removetoken', function (e) {
                    ext.point(POINT + '/removetoken').invoke('action', this, _.extend(baton, { event: e }));
                });

                // bind mail-model to collection
                tokenfieldView.listenTo(baton.model, 'change:' + attr, function (mailModel, recipients) {
                    if (redrawLock) return;
                    var recArray = _(recipients).map(function (recipient) {
                        var display_name = util.removeQuotes(recipient[0]),
                            email = recipient[1],
                            image = recipient[2];
                        return {
                            type: 5,
                            display_name: display_name,
                            email1: email,
                            image1_url: image,
                            token: { label: display_name, value: email }
                        };
                    });
                    this.collection.reset(recArray);
                });

                // trigger change to fill tokenfield
                baton.model.trigger('change:' + attr, baton.model, baton.model.get(attr));

                tokenfieldView.collection.on('change reset add remove sort', _.debounce(function () {
                    var recipients = this.map(function (model) {
                        var token = model.get('token'),
                            display_name = util.removeQuotes(token.label),
                            email = token.value;
                        return [display_name, email];
                    });
                    redrawLock = true;
                    baton.model.set(attr, recipients);
                    redrawLock = false;
                }.bind(tokenfieldView.collection)), 20);

                baton.view.on('updateTokens', function () {
                    var recipients = this.map(function (model) {
                        var token = model.get('token'),
                            display_name = util.removeQuotes(token.label),
                            email = token.value;
                        return [display_name, email];
                    });
                    redrawLock = true;
                    baton.model.set(attr, recipients);
                    redrawLock = false;
                }.bind(tokenfieldView.collection));

                baton.view.app.getWindow().one('idle', function () {
                    // idle event is triggered, after the view is visible
                    // call update when visible to correctly calculate tokefield dimensions (see Bug 52137)
                    tokenfieldView.$el.data('bs.tokenfield').update();
                });
            };
        },

        subject: function (baton) {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div data-extension-id="subject" class="row subject">').append(
                    $('<label class="maillabel hidden-xs col-sm-1">').text(gt('Subject')).attr('for', guid),
                    $('<div class="col-xs-12 col-sm-11">').append(
                        new mini.InputView({ model: baton.model, id: guid, name: 'subject', autocomplete: false }).render().$el.attr('placeholder', gt('Subject'))
                    )
                )
            );
        },

        signature: function (baton) {
            if (_.device('smartphone')) return;
            baton.view.signaturesLoading = baton.model.initializeSignatures(this);
        },

        signaturemenu: function (baton) {
            if (_.device('smartphone')) return;

            var self = this,
                dropdown = new Dropdown({ model: baton.model, label: gt('Signatures'), caret: true });

            // IDEA: move to view to have a reference or trigger a refresh?!

            function draw() {
                dropdown.prepareReuse();
                dropdown.option('signatureId', '', gt('No signature'));
                ext.point(POINT + '/signatures').invoke('draw', dropdown.$el, baton);
                dropdown.$ul.addClass('pull-right');
                baton.view.signaturesLoading.done(function () {
                    dropdown.divider();
                    dropdown.link('settings', gt('Manage signatures'), function () {
                        var options = { id: 'io.ox/mail/settings/signatures' };
                        ox.launch('io.ox/settings/main', options).done(function () {
                            this.setSettingsPane(options);
                        });
                    });
                    dropdown.$ul.addClass('pull-right');
                    dropdown.render();
                });
            }

            require(['io.ox/core/api/snippets'], function (snippetAPI) {
                // use normal event listeners since view.listenTo does not trigger correctly.
                snippetAPI.on('refresh.all', draw);
                baton.view.$el.one('dispose', function () { snippetAPI.off('refresh.all', draw); });

                draw();
            });
            self.append(dropdown.$el.addClass('signatures text-left'));
        },

        optionsmenu: function (baton) {
            var dropdown = new Dropdown({ model: baton.model, label: gt('Options'), caret: true });
            ext.point(POINT + '/menuoptions').invoke('draw', dropdown.$el, baton);

            dropdown.$ul.addClass('pull-right');

            this.append(dropdown.render().$el.addClass('text-left'));
        },

        attachmentPreviewList: function (baton) {
            var $el = this,
                def = $.Deferred();

            require(['io.ox/core/attachments/view', 'io.ox/core/yell'], function (Attachments, yell) {
                var view = new Attachments.List({
                    point: 'io.ox/mail/compose/attachment/header',
                    collection: baton.model.get('attachments'),
                    editable: true,
                    model: baton.model,
                    mode: settings.get('attachments/layout/compose/' + _.display(), 'preview')
                });

                if (settings.get('compose/shareAttachments/enabled', false)) {
                    var locked = false;

                    if (settings.get('compose/shareAttachments/driveLimit', -1) !== -1) {
                        baton.model.get('attachments').on('add remove reset', view.shareAttachmentsIsActive);
                    }

                    new links.Action('io.ox/mail/compose/attachment/shareAttachmentsEnable', {
                        capabilities: 'infostore',
                        requires: function (options) {
                            return !options.baton.view.shareAttachmentsIsActive();
                        },
                        multiple: function (list, baton) {
                            baton.model.set('enable', true);
                        }
                    });

                    new links.Action('io.ox/mail/compose/attachment/shareAttachmentsDisable', {
                        capabilities: 'infostore',
                        requires: function (options) {
                            return options.baton.view.shareAttachmentsIsActive();
                        },
                        multiple: function (list, baton) {
                            // only uncheck if allowed (server setting can enforce drivemail if attachments are to large)
                            if (locked) {
                                //#. %1$s is usually "Drive Mail" (product name; might be customized)
                                yell('info', gt('Attachment file size too large. You have to use %1$s or reduce the attachment file size.', settings.get('compose/shareAttachments/name')));
                                return;
                            }
                            baton.model.set('enable', false);
                        }
                    });

                    ext.point('io.ox/mail/attachment/shareAttachments').extend(
                        new links.Link({
                            id: 'shareAttachmentsEnable',
                            index: 100,
                            //#. %1$s is usually "Drive Mail" (product name; might be customized)
                            label: gt('Use %1$s', settings.get('compose/shareAttachments/name')),
                            ref: 'io.ox/mail/compose/attachment/shareAttachmentsEnable'
                        }),
                        new links.Link({
                            id: 'shareAttachmentseDisable',
                            index: 110,
                            //#. %1$s is usually "Drive Mail" (product name; might be customized)
                            label: gt('Use %1$s', settings.get('compose/shareAttachments/name')),
                            ref: 'io.ox/mail/compose/attachment/shareAttachmentsDisable'
                        })
                    );

                    ext.point('io.ox/mail/attachment/shareAttachments/dropdown').extend({
                        id: 'options',
                        index: 100,
                        draw: function (baton) {
                            var now = _.now(),
                                defaultVal = settings.get('compose/shareAttachments/defaultExpiryDate', '1M'),
                                durationSeed = settings.get('compose/shareAttachments/expiryDates', ['1d', '1w', '1M', '3M', '6M', '1y']);

                            _(durationSeed).each(function (seed) {
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

                                baton.dropdown.option('expiry_date', timestamp, text);
                                if (seed === defaultVal) {
                                    baton.view.model.set('expiry_date', timestamp);
                                }
                            });
                        }
                    });

                    ext.point('io.ox/mail/attachment/shareAttachments/dropdown').extend({
                        id: 'none-option',
                        index: 200,
                        draw: function (baton) {
                            if (settings.get('compose/shareAttachments/requiredExpiration', false)) return;

                            var defaultVal = settings.get('compose/shareAttachments/defaultExpiryDate', '1M');
                            if (!defaultVal && defaultVal === 'none') {
                                baton.view.model.set('expiry_date', '');
                            }

                            baton.dropdown.option('expiry_date', '', gt('no expiry date'));
                            if (!settings.get('compose/shareAttachments/forceAutoDelete', false)) {
                                baton.view.model.on('change:expiry_date', function (settingsModel, value) {
                                    // autodelete makes no sense if links cannot expire
                                    if (value === '') baton.view.model.set('autodelete', false);
                                });
                            }
                        }
                    });

                    ext.point('io.ox/mail/attachment/shareAttachments/dropdown').extend({
                        id: 'delete-option',
                        index: 300,
                        draw: function (baton) {
                            baton.dropdown.divider()
                                .option('autodelete', true, gt('delete if expired'));

                            if (baton.view.model.get('autodelete')) {
                                // show disabled so user knows that the drive files are deleted, even if it cannot be changed
                                baton.dropdown.$ul.find('[data-name="autodelete"]').attr('disabled', 'disabled').addClass('disabled');
                            }
                        }
                    });

                    view.model = new Backbone.Model({
                        'instruction_language': coreSettings.get('language'),
                        'enable':  false,
                        'autodelete': settings.get('compose/shareAttachments/forceAutoDelete', false)
                    });

                    view.notificationModel = new Backbone.Model();
                    view.shareAttachmentsIsActive = function () {
                        if (_.isEmpty(view.getValidModels())) return false;
                        var actualAttachmentSize = 0,
                            threshold = settings.get('compose/shareAttachments/threshold', 0),
                            driveMailLimit = settings.get('compose/shareAttachments/driveLimit', -1),
                            thresholdExceeded;

                        _.each(baton.model.get('attachments').models, function (model) {
                            actualAttachmentSize = actualAttachmentSize + model.getSize();
                        });

                        thresholdExceeded = threshold <= 0 ? false : (actualAttachmentSize > threshold);
                        locked = thresholdExceeded;
                        if (driveMailLimit !== -1 && actualAttachmentSize > driveMailLimit) {
                            yell('warning', gt('Attachment size too large. Please remove attachments or reduce the file size.'));
                        }
                        return thresholdExceeded || view.model.get('enable');
                    };

                    view.toggleShareAttachments = function () {

                        _.each(view.point.keys(), function (id) {
                            if (view.shareAttachmentsIsActive()) {
                                view.model.set('enable', true);
                                view.point.enable(id);
                                view.$el.addClass('show-share-attachments');
                            } else if (id !== 'renderSwitch') {
                                view.model.set('enable', false);
                                view.point.disable(id);
                                view.$el.removeClass('show-share-attachments');
                            }
                        });

                        view.$header.empty();
                        this.renderHeader();
                        view.invoke('render');
                        view.$el.find('.io-ox-inline-links a.io-ox-action-link').focus();
                    };

                    view.extend({
                        renderSwitch: function (baton) {

                            function drawInlineLinks(node, data, view) {
                                var extension = new links.InlineLinks({
                                    dropdown: false,
                                    ref: 'io.ox/mail/attachment/shareAttachments'
                                });
                                view.shareAttachmentsIsActive();
                                return extension.draw.call(node, ext.Baton({ model: view.model, data: data, view: view }));
                            }

                            var models = baton.view.getValidModels(), $links = baton.view.$header.find('.links').empty().addClass('shareAttachments');
                            if (models.length >= 1) drawInlineLinks($links, _(models).invoke('toJSON'), baton.view);

                            if (baton.view.shareAttachmentsIsActive()) {
                                $links.find('li').prepend($('<i class="fa fa-check" aria-hidden="true">'));
                            }
                        },
                        renderOptions: function (baton) {
                            var $links = baton.view.$header.find('.links'),
                                dropdown = new Dropdown({ model: baton.view.model, label: gt('Expiration'), tagName: 'div', caret: true });

                            ext.point('io.ox/mail/attachment/shareAttachments/dropdown').invoke('draw', this, ext.Baton({ view: baton.view, dropdown: dropdown }));

                            $links.append(dropdown.render().$el);
                        },
                        renderNotifications: function (baton) {
                            if (settings.get('compose/shareAttachments/enableNotifications', false)) {
                                var $links = baton.view.$header.find('.links'),
                                    dropdown = new Dropdown({ model: baton.view.notificationModel, label: gt('Notification'), tagName: 'div', caret: true })
                                    .option('download', true, gt('when the receivers have finished downloading the files'))
                                    .option('expired', true, gt('when the link is expired'))
                                    .option('visit', true, gt('when the receivers have accessed the files'));

                                // if (!/^en_/.test(coreSettings.get('language'))) dropdown.option('translated', true, gt('translate notifications to english'));

                                $links.append(dropdown.render().$el);
                            }
                        },
                        renderPassword: function (baton) {
                            var model = baton.view.model, passContainer;

                            function toggleState() {
                                if (model.get('usepassword')) return passContainer.find('input').removeAttr('disabled');
                                passContainer.find('input').attr('disabled', 'disabled');
                            }

                            baton.view.$header.find('.links').append(
                                $('<div class="input-group">').append(
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

                    // updates mail model
                    view.listenTo(view.model, 'change', function () {
                        if (!this.model.get('enable')) return baton.model.unset('share_attachments');
                        var blacklist = ['usepassword'];
                        // don't save password if the field is empty or disabled.
                        if (!this.model.get('usepassword') || _.isEmpty(this.model.get('password'))) blacklist.push('password');
                        baton.model.set('share_attachments', _.omit(this.model.attributes, blacklist));
                    });

                    view.listenTo(view.model, 'change:enable', function () {
                        this.toggleShareAttachments();
                    });

                    view.listenTo(view.collection, 'update', function () {
                        this.toggleShareAttachments();
                    });

                    view.listenTo(view.notificationModel, 'change', function () {
                        this.model.set('notifications', _.allKeys(this.notificationModel.attributes));
                    });
                }

                // dropzone
                var zone = new dropzone.Inplace({
                    caption: gt('Drop attachments here')
                });

                zone.on({
                    'show': function () {
                        $el.css('minHeight', '100px');
                        $(window).trigger('resize');
                    },
                    'hide': function () {
                        $el.css('minHeight', 0);
                        $(window).trigger('resize');
                    },
                    'drop': function (files) {
                        baton.model.attachFiles(
                            _(files).map(function (file) {
                                return _.extend(file, { group: 'localFile' });
                            })
                        );
                        $(window).trigger('resize');
                    }
                });

                view.listenTo(baton.model, 'change:attachments', function () {
                    view.$list.empty();
                    view.$preview.empty();
                    view.renderList();
                    view.updateScrollControls();
                });

                view.listenToOnce(view.collection, 'add remove reset', _.debounce(function () {
                    if (this.getValidModels().length > 0) {
                        this.$el.addClass('open');
                        if (!this.isListRendered) {
                            this.renderList();
                            view.updateScrollControls();
                        }
                        $(window).trigger('resize');
                    }
                }));

                view.render();
                if (view.getValidModels().length > 0) {
                    view.renderList();
                    view.$el.addClass('open');
                    if (settings.get('compose/shareAttachments/enabled', false)) view.toggleShareAttachments();
                }
                $el.append(
                    zone.render().$el.addClass('abs'),
                    view.$el
                );

                view.$el.on('click', 'li.item', function (e) {

                    var node = $(e.currentTarget), id, data, baton, list;

                    // skip attachments without preview
                    if (!node.attr('data-original')) return;

                    id = node.attr('data-id');
                    data = view.collection.get(id).toJSON();

                    if (data.group === 'localFile') {
                        data.fileObj = view.collection.get(id).fileObj;
                        // generate pseudo id so multiple localFile attachments do not overwrite themselves in the Viewer collection
                        data.id = 'localFileAttachment-' + id;
                    }

                    list = view.collection.filter(function (a) {
                        return a.get('disp') === 'attachment';
                    }).map(function (a) {
                        var obj = a.toJSON();
                        if (obj.group === 'localFile') {
                            obj.fileObj = a.fileObj;
                            // generate pseudo id so multiple localFile attachments do not overwrite themselves in the Viewer collection
                            obj.id = 'localFileAttachment-' + a.cid;
                        }
                        return obj;
                    });

                    baton = ext.Baton({ startItem: data, data: list, openedBy: 'io.ox/mail/compose' });

                    actions.invoke('io.ox/mail/actions/view-attachment', null, baton);
                });

                // needed when adding several contacts via 'send as vcard'
                view.updateScrollControls();

                view.on('change:layout', function (mode) {
                    settings.set('attachments/layout/compose/' + _.display(), mode).save();
                });

                def.resolve(view);
            }, def.reject);

            return def;
        },

        attachment: (function () {
            function addLocalFile(model, e) {
                var self = this,
                    attachmentCollection = model.get('attachments'),
                    accumulatedSize = attachmentCollection.filter(function (m) {
                        var size = m.get('size');
                        return typeof size !== 'undefined';
                    })
                    .map(function (m) { return m.get('size'); })
                    .reduce(function (m, n) { return m + n; }, 0);

                if (attachmentQuota.checkQuota(e.target.files, accumulatedSize)) {
                    //#. %s is a list of filenames separeted by commas
                    //#. it is used by screenreaders to indicate which files are currently added to the list of attachments
                    self.trigger('aria-live-update', gt('Added %s to attachments.', _(e.target.files).map(function (file) { return file.name; }).join(', ')));
                    model.attachFiles(
                        _(e.target.files).map(function (file) {
                            return _.extend(file, { group: 'localFile' });
                        })
                    );
                }
            }

            function openFilePicker(model) {
                var self = this;
                require(['io.ox/files/filepicker'], function (Picker) {
                    new Picker({
                        primaryButtonText: gt('Add'),
                        cancelButtonText: gt('Cancel'),
                        header: gt('Add attachments'),
                        multiselect: true
                    })
                    .done(function (files) {
                        self.trigger('aria-live-update', gt('Added %s to attachments.', _(files).map(function (file) { return file.filename; }).join(', ')));
                        model.attachFiles(
                            _(files).map(function (file) {
                                return _.extend(file, { group: 'file' });
                            })
                        );
                    });
                });
            }

            return function (baton) {
                var fileInput = $('<input type="file" name="file" capture="camera">').css('display', 'none')
                        .on('change', addLocalFile.bind(this, baton.model))
                        // multiple is off on smartphones in favor of camera roll/capture selection
                        .prop('multiple', _.device('!smartphone'));

                if (capabilities.has('infostore')) {
                    var dropdown = new Dropdown({ label: gt('Attachments'), caret: true });
                    this.append(
                        fileInput,
                        dropdown.append(
                            $('<a href="#">').append($.txt(gt('Add local file'))).on('click', function () {
                                //WORKAROUND "bug" in Chromium (no change event triggered when selecting the same file again,
                                //in file picker dialog - other browsers still seem to work)
                                fileInput[0].value = '';
                                fileInput.trigger('click');
                            })
                        )
                        .link('add-file', gt('Add from Drive'), openFilePicker.bind(this, baton.model))
                        .render().$el
                    );
                } else {
                    this.append(
                        // file input
                        fileInput,
                        $('<button type="button" class="btn btn-link">')
                            .text(gt('Attachments'))
                            .on('click', function () {
                                //WORKAROUND "bug" in Chromium (no change event triggered when selecting the same file again,
                                //in file picker dialog - other browsers still seem to work)
                                fileInput[0].value = '';
                                fileInput.trigger('click');
                            })
                    );
                }
            };

        }()),

        body: function () {

            var self = this,
                editorId = _.uniqueId('tmce-'),
                editorToolbarId = _.uniqueId('tmcetoolbar-');

            self.append($('<div class="row">').append($('<div class="col-sm-12">').append(
                $('<div class="editable-toolbar">').attr('id', editorToolbarId),
                $('<div class="editable">').attr('id', editorId).css('min-height', '400px')
            )));
        },

        mailto: function () {
            // register mailto!
            if (settings.get('features/registerProtocolHandler', true)) {
                if (navigator.registerProtocolHandler) {
                    var l = location, $l = l.href.indexOf('#'), url = l.href.substr(0, $l);
                    navigator.registerProtocolHandler(
                        'mailto', url + '#app=' + ox.registry.get('mail-compose') + ':compose&mailto=%s', ox.serverConfig.productNameMail
                    );
                }
            }
        }
    };

    return extensions;
});
