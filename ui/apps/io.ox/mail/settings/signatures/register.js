/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/mail/settings/signatures/register',
    ['io.ox/core/extensions',
     'gettext!io.ox/mail',
     'settings!io.ox/mail',
     'io.ox/core/tk/dialogs',
     'io.ox/core/api/snippets',
     'less!io.ox/mail/settings/signatures/style'
    ], function (ext, gt, settings, dialogs, snippets) {

    'use strict';

    ext.point('io.ox/mail/settings/signature-dialog').extend({
        id: 'name',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<div class="form-group">').append(
                    $('<label for="signature-name">').text(gt('Signature name')),
                    baton.$.name = $('<input type="text" class="form-control">').attr({'id': 'signature-name', 'tabindex': 1})
                )
            );
        }
    });

    ext.point('io.ox/mail/settings/signature-dialog').extend({
        id: 'error',
        index: 200,
        draw: function (baton) {
            this.append(
                baton.$.error = $('<div>').addClass('help-block error')
            );
        }
    });

    ext.point('io.ox/mail/settings/signature-dialog').extend({
        id: 'textarea',
        index: 300,
        draw: function (baton) {
            this.append(
                $('<div class="form-group">').append(
                    $('<label for="signature-text">').text(gt('Signature text')),
                    baton.$.signature = $('<textarea class="form-control" rows="10" id="signature-text">')
                )
            );
        }
    });

    ext.point('io.ox/mail/settings/signature-dialog').extend({
        id: 'position',
        index: 400,
        draw: function (baton) {
            this.append(
                $('<div class="form-group">').append(
                    $('<label for="signature-position">').text(gt('Signature position')),
                    baton.$.insertion = $('<select id="signature-position" class="form-control">')
                        .append(
                            $('<option value="above">').text(gt('Above quoted text')),
                            $('<option value="below">').text(gt('Below quoted text'))
                        )
                        .val(settings.get('defaultSignaturePosition', 'below'))
                )
            );
        }
    });

    function fnEditSignature(evt, signature) {
        if (!signature) {
            signature = {
                id: null,
                name: '',
                signature: ''
            };
        }

        function validateField(field, target) {
            if ($.trim(field.val()) === '') {//trim here because backend does not allow names containing only spaces
                field.addClass('error');
                target.text(gt('Please enter a valid name'));
            } else {
                field.removeClass('error');
                target.empty();
            }
        }

        if (_.isString(signature.misc)) { signature.misc = JSON.parse(signature.misc); }

        var popup = new dialogs.ModalDialog({ async: true });
        popup.header($('<h4>').text(signature.id === null ? gt('Add signature') : gt('Edit signature')));

        var baton = new ext.Baton();
        ext.point('io.ox/mail/settings/signature-dialog').invoke('draw', popup.getContentNode(), baton);

        popup.addPrimaryButton('save', gt('Save'), 'save', {tabIndex: '1'})
        .addButton('cancel', gt('Discard'), 'cancel', {tabIndex: '1'})
        .on('save', function () {
            if (baton.$.name.val() !== '') {
                var update = signature.id ? {} : {type: 'signature', module: 'io.ox/mail', displayname: '', content: '', misc: {insertion: 'below'}};

                update.id = signature.id;
                update.misc = { insertion: baton.$.insertion.val() };

                if (baton.$.signature.val() !== signature.content) update.content = baton.$.signature.val();
                if (baton.$.name.val() !== signature.displayname) update.displayname = baton.$.name.val();

                popup.busy();

                var def = null;
                if (signature.id) {
                    def = snippets.update(update);
                } else {
                    def = snippets.create(update);
                }
                def.done(function () {
                    popup.idle();
                    popup.close();
                }).fail(require('io.ox/core/notifications').yell);

                popup.close();
            } else {
                popup.idle();
                validateField(baton.$.name, baton.$.error);
            }
        }).show();

        baton.$.name.val(signature.displayname);
        baton.$.signature.val(signature.content);

        if (_.isObject(signature.misc) && signature.misc.insertion) {
            baton.$.insertion.val(signature.misc.insertion);
        }

        _.defer(function () {
            if (signature.displayname) {
                baton.$.signature.select();
            } else {
                baton.$.name.select();
            }
        });

        baton.$.name.on('change', function () {
            validateField(baton.$.name, baton.$.error);
        });
    }

    function fnImportSignatures(evt, signatures) {

        var popup = new dialogs.SidePopup({
            modal: true,
            tabTrap: true
        })
        .show(evt, function ($pane) {
            $pane.addClass('io-ox-signature-import');
            var $container;
            var $entirePopup = $pane.closest('.io-ox-sidepopup');

            function busy() {
                dialogs.busy($entirePopup);
            }

            function idle() {
                dialogs.idle($entirePopup);
            }

            $container = $('<table>').appendTo($pane);
            _(signatures).each(function (classicSignature, index) {

                var $row = $('<tr>').addClass('sig-row').appendTo($container);
                var preview = (classicSignature.signature_text || '')
                                .replace(/\s\s+/g, ' ') // remove subsequent white-space
                                .replace(/(\W\W\W)\W+/g, '$1 '); // reduce special char sequences

                $row.append(
                    $('<td>').css({width: '10%', textAlign: 'center'}).append(
                        $('<input type="checkbox">').attr('data-index', index)
                    ),
                    $('<td>').css({width: '80%', padding: '10px'}).append(
                        classicSignature.signature_name, $('<br>'),
                        $('<div>').text(gt.noI18n(preview)).addClass('classic-sig-preview')
                    )
                );

                var specializedClick = false;
                $row.find(':checkbox').on('click', function () {
                    specializedClick = true;
                });

                $row.on('click', function () {
                    if (specializedClick) {
                        specializedClick = false;
                        return;
                    }
                    var $checkbox = $(this).find(':checkbox');
                    $checkbox.prop('checked', !$checkbox.prop('checked'));
                });
            });

            $pane.append($('<a href="#">').text(gt('Select all')).on('click', function () {
                $container.find(':checkbox').each(function () {
                    if (!$(this).prop('checked')) {
                        $(this).prop('checked', true);
                    }
                });
                return false;
            }));

            $pane.append($('<br>'), $('<br>'), $('<br>'));

            var $button = $('<button type="button" class="btn btn-primary">')
                .text(gt('Import signatures')).appendTo($pane);

            $button.on('click', function () {
                busy();
                var deferreds = [];
                $container.find(':checked').each(function () {
                    var index = $(this).data('index');
                    var classicSignature = signatures[index];

                    deferreds.push(
                        snippets.create({

                        type: 'signature',
                        module: 'io.ox/mail',
                        displayname: classicSignature.signature_name,
                        content: classicSignature.signature_text,
                        meta: {
                            imported: classicSignature
                        }
                    }).fail(require('io.ox/core/notifications').yell));
                });

                $.when.apply($, deferreds).always(function () { idle(); popup.close(); });
            });

        });
    }

    ext.point('io.ox/mail/settings/detail').extend({
        id: 'signatures',
        index: 300,
        draw: function () {
            var $node = this;
            var $list, signatures;
            function fnDrawAll() {
                snippets.getAll('signature').done(function (sigs) {
                    signatures = {};
                    $list.empty();
                    _(sigs).each(function (signature) {
                        signatures[signature.id] = signature;

                        var isDefault = settings.get('defaultSignature') === signature.id,
                            $item = $('<li class="widget-settings-view">')
                                .attr('data-id', signature.id)
                                .append(
                                    $('<div class="pull-right">').append(
                                        $('<a class="action" tabindex="1" data-action="default">').text((isDefault ? gt('(Default)') : gt('Set as default'))),
                                        $('<a class="action" tabindex="1" data-action="edit">').text(gt('Edit')),
                                        $('<a class="remove-widget">').attr({
                                            'data-action': 'delete',
                                            title: gt('Delete'),
                                            tabindex: 1
                                        }).append($('<i class="fa fa-trash-o">'))
                                    ),
                                    $('<span class="list-title">').text(gt.noI18n(signature.displayname))
                                );
                        if (settings.get('defaultSignature') === signature.id) {
                            $item.addClass('default');
                        }
                        $list.append($item);
                    });
                });
            }
            var radioNone, radioCustom, signatureText;
            try {
                if (_.device('smartphone')) {
                    var type = settings.get('mobileSignatureType');
                    if (type !== 'custom') type = 'none';
                    $node.append($('<legend class="sectiontitle">').text(
                                //#. Section title for the mobile signature
                                gt('Signature')))
                        .append($('<label class="radio">')
                            .text(gt('No signature'))
                            .append(radioNone = $('<input type="radio" name="mobileSignature">')
                                .prop('checked', type === 'none'))
                                .on('change', radioChange))
                        .append($('<label class="radio">')
                            .append(radioCustom = $('<input type="radio" name="mobileSignature">')
                                .prop('checked', type === 'custom')
                                .on('change', radioChange))
                            .append(signatureText = $('<textarea class="span12">')
                                .val(settings.get('mobileSignature'))
                                .on('change', textChange)));
                } else {
                    $node.append($('<legend class="sectiontitle">').text(gt('Signatures')));
                    addSignatureList($node);
                }
            } catch (e) {
                console.error(e, e.stack);
            }

            function radioChange() {
                var type = radioCustom.prop('checked') ? 'custom' : 'none';
                settings.set('mobileSignatureType', type).save();
            }

            function textChange() {
                settings.set('mobileSignature', signatureText.val()).save();
            }

            function addSignatureList($node) {
                // List
                $list = $('<ul class="list-unstyled list-group settings-list">')
                .on('click keydown', 'a[data-action=edit]', function (e) {
                    if ((e.type === 'click') || (e.which === 13)) {
                        var id = $(this).closest('li').attr('data-id');
                        fnEditSignature(e, signatures[id]);
                        e.preventDefault();
                    }
                })
                .on('click keydown', 'a[data-action=delete]', function (e) {
                    if ((e.type === 'click') || (e.which === 13)) {
                        var id = $(this).closest('li').attr('data-id');
                        snippets.destroy(id).fail(require('io.ox/core/notifications').yell);
                        e.preventDefault();
                    }
                })
                .on('click keydown', 'a[data-action=default]', function (e) {
                    if ((e.type === 'click') || (e.which === 13)) {
                        var id = $(this).closest('li').attr('data-id');
                        settings.set('defaultSignature', id).save();
                        $list.find('li').removeClass('default')
                            .find('a[data-action="default"]').text(gt('Set as default'));
                        $(this).closest('li').addClass('default')
                            .find('a[data-action="default"]').text(gt('(Default)'));
                        e.preventDefault();
                    }
                })
                .appendTo($node);

                fnDrawAll();
                snippets.on('refresh.all', fnDrawAll);

                var section;

                $node.append(
                    section = $('<div class="sectioncontent">').append(
                        $('<button type="button" class="btn btn-primary">').text(gt('Add new signature')).on('click', fnEditSignature)
                    )
                );

                require(['io.ox/core/config'], function (config) {
                    if (config.get('gui.mail.signatures') && !_.isNull(config.get('gui.mail.signatures')) && config.get('gui.mail.signatures').length > 0) {
                        section.append(
                            $('<br>'),
                            $('<a href="#">').text(gt('Import signatures')).on('click', function (e) {
                                fnImportSignatures(e, config.get('gui.mail.signatures'));
                                return false;
                            })
                        );
                    }
                    section = null;
                });
            }
        }
    });

});
