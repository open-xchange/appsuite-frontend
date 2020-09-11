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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/files/share/wizard', [
    'io.ox/backbone/views/modal',
    'io.ox/backbone/views/disposable',
    'io.ox/core/extensions',
    'io.ox/files/share/api',
    'io.ox/files/share/model',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/contacts/api',
    'io.ox/core/api/group',
    'io.ox/core/tk/tokenfield',
    'io.ox/core/yell',
    'io.ox/core/settings/util',
    'gettext!io.ox/files',
    'settings!io.ox/contacts',
    'io.ox/core/capabilities',
    'io.ox/backbone/mini-views/addresspicker',
    'io.ox/backbone/mini-views/copy-to-clipboard',
    'io.ox/core/folder/util',
    'static/3rd.party/polyfill-resize.js',
    'less!io.ox/files/share/style'
], function (ModalDialog, DisposableView, ext, api, sModel, miniViews, Dropdown, contactsAPI, groupApi, Tokenfield, yell, settingsUtil, gt, settingsContacts, capabilities, AddressPickerView, CopyToClipboard, util) {

    'use strict';

    var INDEX = 0,
        POINT = 'io.ox/files/share/wizard',
        POINT_SETTINGS = 'io.ox/files/share/wizard-settings';

    /*
     * extension point title text
     */
    ext.point(POINT + '/fields').extend({
        id: 'title',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<h5></h5>').text(gt('Create sharing link'))
            );
        }
    });

    /*
     * extension point turn on/off create sharing link
     */
    ext.point(POINT + '/fields').extend({
        id: 'on-off-swicth',
        index: INDEX += 100,
        draw: function (baton) {
            var CustomSwitch = miniViews.SwitchView.extend({
                onChange: function () {
                    if (this.getValue() === false) {
                        baton.view.hideLink();
                        baton.view.hideSettingsLink();
                        baton.view.hideSettings();
                        baton.view.removeLink();
                    } else {
                        baton.view.showLink();
                        baton.view.showSettingsLink();
                        baton.model.fetch();
                    }
                }
            });
            var shareLinkSwitch = new CustomSwitch({
                name: 'url',
                model: baton.model,
                label: '',
                size: 'small',
                customValues: {
                    'true': baton.model.get('url'),
                    'false': false
                }
            });
            this.append(
                shareLinkSwitch.render().$el.attr('title', gt('Create sharing link'))
            );
        }
    });

    /*
     * extension point descriptive text
     */
    ext.point(POINT + '/fields').extend({
        id: 'description',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<span class="help-block">').text(gt('You can copy and paste this link in an email, instant messenger or social network. Please note that anyone with this link can access the share.'))
            );
        }
    });

    /*
     * extension point for share link
     */
    ext.point(POINT + '/fields').extend({
        id: 'link',
        index: INDEX += 100,
        draw: function (baton) {
            var linkNode,
                link = baton.model.get('url', ''),
                formID = _.uniqueId('form-control-label-');
            this.append(
                linkNode = $('<div class="form-group">').append(
                    $('<label>').attr('for', formID).text(),
                    $('<div class="input-group link-group">').append(
                        $('<input type="text" class="form-control" readonly>').attr('id', formID).val(link)
                        .on('focus', function () {
                            _.defer(function () { $(this).select(); }.bind(this));
                        })
                    )
                )
            );
            baton.view.listenTo(baton.model, 'change:url', function (model, val) {
                // WORKAROUND: ios8 focus bug
                var node = linkNode.find('input').val(val).select();
                if (_.device('ios')) return;
                node.focus();
            });
            if (link === '') {
                //baton.model.fetch();
            }
        }
    });

    /*
     * extension point for share link
     */
    ext.point(POINT + '/fields').extend({
        id: 'link-to-clipboard',
        index: INDEX += 100,
        draw: function () {
            var group = this.find('.link-group'),
                target = '#' + group.find('input').attr('id');

            // copy-to-clipboard button
            group.append(
                $('<span class="input-group-btn">').append(
                    new CopyToClipboard({ targetId: target }).render().$el
                )
            );
        }
    });

    /*
     * extension point for share link
     */
    ext.point(POINT + '/fields').extend({
        id: 'settings',
        index: INDEX += 100,
        draw: function (baton) {
            var showHideSettings = $('<a class="share-link-setting" href="#"></a>').text(gt('Settings'));
            showHideSettings.on('click', function () {
                baton.view.showSettingsDialog();
                // if (baton.view.areSettingsVisible()) {
                //     showHideSettings.text(gt('Settings'));
                //     baton.view.hideSettings();
                // } else {
                //     showHideSettings.text(gt('Hide Settings'));
                //     baton.view.showSettings();
                // }
                return false;
            });
            this.append($('<div></div>').append(showHideSettings));
        }
    });

    /*
     * extension point for share options
     */
    //ext.point(POINT + '/fields').extend({
    ext.point(POINT_SETTINGS + '/settings').extend({
        id: 'defaultOptions',
        index: INDEX += 100,
        draw: function (baton) {
            var optionGroup = $('<div class="form-group shareoptions">');
            ext.point(POINT_SETTINGS + '/options').invoke('draw', optionGroup, baton);
            //ext.point(POINT + '/options').invoke('draw', optionGroup, baton);
            this.append(optionGroup);
        }
    });

    /*
     * extension point for recipients autocomplete input field
     */
    ext.point(POINT + '/fields').extend({
        id: 'recipients-tokenfield',
        index: INDEX += 100,
        draw: function (baton) {
            var guid = _.uniqueId('form-control-label-'),
                usePicker = !_.device('smartphone') && capabilities.has('contacts') && settingsContacts.get('picker/enabled', true);

            // add autocomplete
            var tokenfieldView = new Tokenfield({
                id: guid,
                extPoint: POINT,
                placeholder: gt('Add recipients ...'),
                apiOptions: {
                    contacts: true,
                    users: true,
                    groups: false
                },
                leftAligned: true
            });

            this.append(
                $('<div class="form-group recipients">').addClass(_.browser.IE ? 'IE' : 'nonIE').append(
                    $('<div class="input-group has-picker">').append(
                        $('<label class="sr-only">').attr({ for: guid }).text(gt('Add recipients ...')),
                        tokenfieldView.$el,
                        usePicker ? new AddressPickerView({
                            isPermission: true,
                            process: function (e, member, singleData) {
                                var token = {
                                        label: singleData.array[0],
                                        value: singleData.array[1]
                                    }, list = baton.model.get('recipients') || [];
                                member.set('token', token);
                                baton.model.set('recipients', list.concat([member]));
                            }
                        }).render().$el : []
                    )
                )
            );

            tokenfieldView.render();

            tokenfieldView.listenTo(baton.model, 'change:recipients', function (mailModel, recipients) {
                if (tokenfieldView.redrawLock) return;
                tokenfieldView.collection.reset(recipients);
            });

            // bind collection to share model
            tokenfieldView.collection.on('change add remove sort', function () {
                tokenfieldView.redrawLock = true;
                baton.model.set('recipients', this.toArray());
                tokenfieldView.redrawLock = false;
            });
        }
    });

    /*
     * extension point for message textarea
     */
    ext.point(POINT + '/fields').extend({
        id: 'message',
        index: INDEX += 100,
        draw: function (baton) {
            var guid = _.uniqueId('form-control-label-');
            var $textView;

            this.append(
                $('<div class="message">').addClass(_.browser.IE ? 'IE' : 'nonIE').append(
                    $('<label class="control-label sr-only">').text(gt('Message (optional)')).attr({ for: guid }),
                    $textView = new miniViews.TextView({
                        name: 'message',
                        model: baton.model
                    }).render().$el
                    .attr({
                        id: guid,
                        //#. placeholder text in share dialog
                        placeholder: gt('Message (optional)')
                    })
                )
            );

            // apply polyfill for CSS resize which IE doesn't support natively
            if (_.browser.IE) {
                window.resizeHandlerPolyfill($textView[0]);
            }

        }
    });

    /*
     * extension point for allowance of subfolder access
     *
     * see SoftwareChange Request SCR-97: [https://jira.open-xchange.com/browse/SCR-97]
     */
    //ext.point(POINT + '/options').extend({
    ext.point(POINT_SETTINGS + '/options').extend({
        id: 'includeSubfolders',
        index: INDEX += 100,
        draw: function (baton) {
            var isDrive = _(baton.model.get('files')).every(function (model) {
                return !model.isFolder() || util.is('drive', model.attributes);
            });
            if (!isDrive || !baton.model.attributes || !baton.model.attributes.files) {
                return baton.model.set('includeSubfolders', false, { silent: true });
            }
            var onlyFiles = true;
            _.each(baton.model.attributes.files, function (model) {
                if (model.isFolder()) {
                    onlyFiles = false;
                }
            });
            if (onlyFiles) return;

            this.append($('<div class="form-inline">').append($('<div class="form-group">').append(
                settingsUtil.checkbox('includeSubfolders', gt('Share with subfolders'), baton.model).on('change', function (e) {
                    var input = e.originalEvent.srcElement;
                    baton.model.set('includeSubfolders', input.checked);
                })
            )));

            baton.model.once('change', function (model) {
                var isNewLink = model.get('is_new'),
                    state = false;

                if (isNewLink === true) {
                    state = isNewLink;
                    model.set('includeSubfolders', state);
                } else {
                    state = model.get('includeSubfolders');
                }
            });
        }
    });

    /*
     * extension point for expires dropdown
     */
    //ext.point(POINT + '/options').extend({
    ext.point(POINT_SETTINGS + '/options').extend({
        id: 'temporary',
        index: INDEX += 100,
        draw: function (baton) {
            //#. options for terminal element of a sentence starts with "Expires in"
            var typeTranslations = {
                0: gt('one day'),
                1: gt('one week'),
                2: gt('one month'),
                3: gt('three months'),
                4: gt('six months'),
                5: gt('one year')
            };

            // create dropdown
            var dropdown = new Dropdown({ tagName: 'span', model: baton.model, label: typeTranslations[baton.model.get('expires')], caret: true });

            // set dropdown link
            if (baton.model.get('expiry_date')) {
                dropdown.$el.find('.dropdown-label').text(new moment(baton.model.get('expiry_date')).format('L'));
            }

            // add dropdown options
            _(typeTranslations).each(function (val, key) {
                dropdown.option('expires', parseInt(key, 10), val);
            });

            this.append($('<div class="form-inline">').append($('<div class="form-group expiresgroup">').append(
                settingsUtil.checkbox('temporary', gt('Expires in'), baton.model).on('change', function (e) {
                    var input = e.originalEvent.srcElement;
                    baton.model.set('temporary', input.checked);
                }),
                $.txt(' '),
                dropdown.render().$el.addClass('dropup')
            )));

            baton.model.once('change', function () {
                if (baton.model.get('expiry_date')) {
                    baton.model.set('expires', null);
                }
            });

            baton.model.on('change:expiry_date', function (model, val) {
                dropdown.$el.find('.dropdown-label').text(new moment(val).format('L'));
                dropdown.$el.closest('.expiresgroup').find('span.caption>span').text(gt('Expires on'));
                model.set('temporary', true);
            });

            baton.model.on('change:expires', function (model) {
                if (baton.model.get('expires') !== null) {
                    model.set({
                        'temporary': true,
                        'expiry_date': model.getExpiryDate()
                    });
                }
            });
        }
    });

    /*
     * extension point for password protection
     */
    //ext.point(POINT + '/options').extend({
    ext.point(POINT_SETTINGS + '/options').extend({
        id: 'secured',
        index: INDEX += 100,
        draw: function (baton) {
            var guid, passContainer;

            this.append($('<div class="form-inline passwordgroup">').append(
                $('<div class="form-group">').append(
                    settingsUtil.checkbox('secured', gt('Password required'), baton.model).on('change', function (e) {
                        var input = e.originalEvent.srcElement;
                        baton.model.set('secured', input.checked);
                    })
                ),
                $.txt(' '),
                $('<div class="form-group">').append(
                    $('<label class="control-label sr-only">').text(gt('Enter Password')).attr({ for: guid = _.uniqueId('form-control-label-') }),
                    passContainer = new miniViews.PasswordViewToggle({ name: 'password', model: baton.model, autocomplete: false })
                        .render().$el.find('input')
                        // see bug 49639
                        .attr({ id: guid, placeholder: gt('Password') })
                        .removeAttr('name')
                        .prop('disabled', !baton.model.get('secured'))
                        .end()
                )
            ));

            baton.view.listenTo(baton.model, 'change:password', function (model, val, options) {
                if (val && !model.get('secured')) {
                    model.set('secured', true, options);
                }
            });
            baton.view.listenTo(baton.model, 'change:secured', function (model, val, opt) {
                var passInput = passContainer.find('input');
                passInput.prop('disabled', !val);
                passContainer.prop('disabled', !val);
                if (!opt._inital) passInput.focus();
            });
            baton.model.once('change', function (model) {
                var passInput = passContainer.find('input'),
                    state = false;
                if (model.get('password')) {
                    state = true;
                }
                model.set('secured', state);
                passInput.prop('disabled', !state);
                passContainer.prop('disabled', !state);
            });
        }
    });

    /*
     * main view
     */
    var ShareWizard = DisposableView.extend({

        className: 'share-wizard',

        initialize: function (options) {

            this.model = new sModel.WizardShare({ files: options.files });

            this.baton = ext.Baton({ model: this.model, view: this });

            this.listenTo(this.model, 'invalid', function (model, error) {
                yell('error', error);
            });
        },

        render: function () {

            this.$el.addClass(this.model.get('type'));

            // draw all extensionpoints
            //ext.point(POINT_SWITCH + '/switch').invoke('draw', this.$el, this.baton);
            ext.point(POINT + '/fields').invoke('draw', this.$el, this.baton);
            //ext.point(POINT_SETTINGS + '/settings').invoke('draw', this.$el.find('#share-link-settings'), this.baton);

            this.hideSettings();
            if (this.model.get('url')) {
                this.showLink();
            } else {
                this.hideSettingsLink();
                this.hideLink();
            }

            return this;
        },

        showSettingsDialog: function () {
            var dialog = new ModalDialog({
                async: true,
                focus: '.link-group>input[type=text]',
                title: 'Settings',
                point: 'io.ox/files/actions/share-link-settings',
                help: 'ox.appsuite.user.sect.dataorganisation.sharing.link.html',
                smartphoneInputFocus: true,
                width: 600
            });
            dialog
            .addCancelButton()
            .addButton({ label: gt('Save'), action: 'cancel' });
            ext.point(POINT_SETTINGS + '/settings').invoke('draw', dialog.$body, this.baton);
            dialog.open();
        },

        share: function () {
            // we might have new addresses
            contactsAPI.trigger('maybeNewContact');
            var result;

            // Bug 52046: When the password checkbox is enable and the password could not be validated (e.g. it's empty) in the set function from the model,
            // we have the previous, not up-to-date model data, but also an validationError to indicate that there was a error.
            // So the validation in the save function would work with the old model data. Therefore don't call save() when there
            // is an validationError, because it would work with an old model.
            if (this.model.get('secured') && _.isString(this.model.validationError)) {
                // reject so that the dialog is not closed later and pass the yell message for the fail handler
                result = $.Deferred().reject('error', this.model.validationError);

            } else {
                // function 'save' returns a jqXHR if validation is successful and false otherwise (see backbone api)
                result = this.model.save();

                //  to unify the return type for later functions, we must return a deferred
                if (result === false) {
                    // no yell message needed, therefore return directly, the yell is called in the save function above
                    return $.Deferred().reject();
                }
            }

            return result.fail(yell);

        },

        removeLink: function () {
            var model = this.model;
            return api.deleteLink(model.toJSON(), model.get('lastModified'))
                .done(function () {
                    // refresh the guest group (id = int max value)
                    groupApi.refreshGroup(2147483647);
                })
                .done(model.destroy.bind(model));
        },

        hide: function () {
            this.$el.hide();
        },

        show: function () {
            this.$el.show();
        },

        isVisible: function () {
            return this.$el.is(':visible');
        },

        showLink: function () {
            this.$el.find('.help-block').show();
            this.$el.find('.link-group').show();
        },

        hideLink: function () {
            this.$el.find('.help-block').hide();
            this.$el.find('.link-group').hide();
        },

        showSettings: function () {
            this.$el.find('.shareoptions').show();
            this.$el.find('.recipients').show();
            this.$el.find('.message').show();
            this.showSettingsDialog();
        },

        hideSettingsLink: function () {
            this.$el.find('.share-link-setting').hide();
        },

        showSettingsLink: function () {
            this.$el.find('.share-link-setting').show();
        },

        hideSettings: function () {
            this.$el.find('.shareoptions').hide();
            this.$el.find('.recipients').hide();
            this.$el.find('.message').hide();
        },

        areSettingsVisible: function () {
            return this.$el.find('.shareoptions').is(':visible');
        }
    });

    return ShareWizard;
});
