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
    'io.ox/backbone/disposable',
    'io.ox/core/extensions',
    'io.ox/files/share/api',
    'io.ox/files/share/model',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/contacts/api',
    'io.ox/core/tk/tokenfield',
    'io.ox/core/yell',
    'gettext!io.ox/files',
    'settings!io.ox/contacts',
    'io.ox/core/capabilities',
    'io.ox/backbone/mini-views/addresspicker',
    'static/3rd.party/resize-polyfill/lib/polyfill-resize.js',
    'less!io.ox/files/share/style'
], function (DisposableView, ext, api, sModel, miniViews, Dropdown, contactsAPI, Tokenfield, yell, gt, settingsContacts, capabilities, AddressPickerView) {

    'use strict';

    var INDEX = 0,
        POINT = 'io.ox/files/share/wizard';

    /*
     * extension point descriptive text
     */
    ext.point(POINT + '/fields').extend({
        id: 'description',
        index: INDEX += 100,
        draw: function () {
            this.append(
                $('<span>').addClass('help-block').text(gt('You can copy and paste this link in an email, instant messenger or social network. Please note that anyone with this link can access the share.'))
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
                baton.model.fetch();
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
            // unsupported: https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
            if (_.device('safari')) return;

            var group = this.find('.link-group'),
                target = '#' + group.find('input').attr('id'),
                //.# tooltip for a button that copies the content of a field to operating sytems clipboard
                label = gt('Copy to clipboard'),
                //.# tooltip for a button after it was clicked and a copy action was executed
                labelpost = gt('Copied'),
                button;

            // copy-to-clipboard button
            group.append(
                $('<span class="input-group-btn">').append(
                    button = $('<button class="btn btn-default" type="button">')
                    .append($('<i class="fa fa-clipboard clippy">'))
                    .attr({
                        'data-clipboard-target': target,
                        'data-toggle': 'tooltip',
                        'data-placement': 'bottom',
                        'data-original-title': label,
                        'aria-label': label,
                        'data-container': 'body'
                    })
                    .tooltip()
                )
            );

            // load lib
            require(['static/3rd.party/clipboard/dist/clipboard.min.js']).then(function (ClipBoard) {
                new ClipBoard(button.get(0));
                button.removeAttr('disabled');
            });

            // change tooltip after button was clicked
            button.on('click', function () {
                button
                    .attr('data-original-title', labelpost).tooltip('show')
                    .attr('data-original-title', label);
            });
        }
    });

    /*
     * extension point for share options
     */
    ext.point(POINT + '/fields').extend({
        id: 'defaultOptions',
        index: INDEX += 100,
        draw: function (baton) {
            var optionGroup = $('<div>').addClass('form-group shareoptions');
            ext.point(POINT + '/options').invoke('draw', optionGroup, baton);
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
                        $('<label>').attr({ for: guid }).addClass('sr-only').text(gt('Add recipients ...')),
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
                    $('<label>').addClass('control-label sr-only').text(gt('Message (optional)')).attr({ for: guid }),
                    $textView = new miniViews.TextView({
                        name: 'message',
                        model: baton.model
                    }).render().$el.attr({
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
     * extension point for expires dropdown
     */
    ext.point(POINT + '/options').extend({
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

            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div class="form-group expiresgroup">').append(
                    $('<label class="checkbox-inline">').attr('for', guid).text(gt('Expires in')).prepend(
                        new miniViews.CheckboxView({ id: guid, name: 'temporary', model: baton.model }).render().$el
                    ),
                    $.txt(' '),
                    dropdown.render().$el.addClass('dropup')
                )
            );

            baton.model.on('change:expiry_date', function (model, val) {
                dropdown.$el.find('.dropdown-label').text(new moment(val).format('L'));
                dropdown.$el.closest('.expiresgroup').find('label')[0].childNodes[1].data = gt('Expires on');
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

            baton.model.once('change', function () {
                if (baton.model.get('expiry_date')) {
                    baton.model.set('expires', null);
                }
            });

        }
    });

    /*
     * extension point for password protection
     */
    ext.point(POINT + '/options').extend({
        id: 'secured',
        index: INDEX += 100,
        draw: function (baton) {
            var guid, passContainer;
            this.append(
                $('<div class="form-inline passwordgroup">').append(
                    $('<div class="form-group">').append(
                        $('<label class="checkbox-inline">').attr('for', guid = _.uniqueId('form-control-label-')).text(gt('Password required')).prepend(
                            new miniViews.CheckboxView({ id: guid, name: 'secured', model: baton.model }).render().$el
                        )
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
                )
            );
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
            ext.point(POINT + '/fields').invoke('draw', this.$el, this.baton);

            return this;
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
                .done(model.destroy.bind(model));
        }
    });

    return ShareWizard;
});
