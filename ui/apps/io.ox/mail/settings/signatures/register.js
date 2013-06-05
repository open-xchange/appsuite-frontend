/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/mail/settings/signatures/register',
    ['io.ox/core/extensions',
     'gettext!io.ox/mail',
     'settings!io.ox/mail',
     'less!io.ox/mail/settings/signatures/style.less'], function (ext, gt, settings) {

    'use strict';

    function fnMigrateClassicSignatures() {
        var def = $.Deferred();
        require(['io.ox/core/config', 'io.ox/core/api/snippets'], function (config, snippets) {
            var classicSignatures = config.get('gui.mail.signatures');

            var deferreds = _(classicSignatures).map(function (classicSignature) {
                // console.log("Importing signature " + classicSignature.signature_name);
                return snippets.create({

                    type: 'signature',
                    module: 'io.ox/mail',
                    displayname: classicSignature.signature_name,
                    content: classicSignature.signature_text,
                    meta: {
                        imported: classicSignature
                    }
                });

            });

            $.when.apply($, deferreds).done(def.resolve).fail(def.reject);

        }).fail(def.reject);

        return def;
    }

    function fnEditSignature(evt, signature) {
        if (!signature) {
            signature = {
                id: null,
                name: '',
                signature: ''
            };
        }

        function validateField(field, target) {
            if (field.val() === '') {
                field.addClass('error');
                target.text(gt('Please enter a valid name'));
            } else {
                field.removeClass('error');
                target.empty();
            }
        }

        require(['io.ox/core/tk/dialogs'], function (dialogs) {
            var $name, $signature, $insertion, popup, $error;

            popup = new dialogs.SidePopup({
                modal: true
            })
            .show(evt, function ($pane) {
                if (_.isString(signature.misc)) { signature.misc = JSON.parse(signature.misc); }
                var $entirePopup = $pane.closest('.io-ox-sidepopup');
                $('<form>').append(
                    $('<div class="row-fluid">').append(
                        $name = $('<input type="text" class="span12">').attr('placeholder', gt('Name'))
                    ),
                    $error = $('<div>').addClass('help-block error'),
                    $('<div class="row-fluid">').append(
                        $signature = $('<textarea class="span12" rows="10">').on('keydown', function (e) {
                            if (e.which === 38 || e.which === 40) {//if arrowkey up and down are pressed the settingsmenu would move to the next item for exsample mails
                                e.stopPropagation();//this must be prevented to allow the use of the arrowkeys properly in the textarea see bug:25114
                            }
                        })
                    ),
                    $('<div class="row-fluid">').append(
                        $('<label>').text(gt('Signature insertion:')),
                        $insertion = $('<select>').append(
                            $('<option value="above">').text(gt('Above content')),
                            $('<option value="below">').text(gt('Below content')).attr('selected', true)
                        )
                    )
                ).appendTo($pane);

                $name.val(signature.displayname);
                $signature.val(signature.content);
                if (_.isObject(signature.misc) && signature.misc.insertion) {
                    $insertion.val(signature.misc.insertion);
                }

                _.defer(function () {
                    if (signature.displayname) {
                        $signature.select();
                    } else {
                        $name.select();
                    }
                });

                // Replace the buttons
                var $buttonDiv = $entirePopup.find('.io-ox-sidepopup-close');

                $buttonDiv.empty();

                function busy() {
                    dialogs.busy($entirePopup);
                }

                function idle() {
                    dialogs.idle($entirePopup);
                }

                $name.on('change', function () {
                    validateField($name, $error);
                });

                $buttonDiv.append(
                    $('<button class="btn">').text(gt('Discard')).on('click', function () {
                        popup.close();
                        return false;
                    }),
                    $('<button class="btn btn-primary">').text(gt('Save')).on('click', function () {
                        if ($name.val() !== '') {
                            busy();

                            if (signature.id && _.isString(signature.misc)) { signature.misc = JSON.parse(signature.misc); }

                            var update = signature.id ? {} : {type: 'signature', module: 'io.ox/mail', displayname: '', content: '', misc: {insertion: 'below'}};

                            if ($signature.val() !== signature.content) {
                                update.content = $signature.val();
                            }

                            if ($name.val() !== signature.displayname) {
                                update.displayname = $name.val();
                            }


                            update.misc = { insertion: $insertion.val() };

                            update.id = signature.id;

                            require(['io.ox/core/api/snippets'], function (snippets) {
                                var def = null;
                                if (signature.id) {
                                    def = snippets.update(update);
                                } else {
                                    def = snippets.create(update);
                                }
                                def.done(function (resp) {
                                    idle();
                                    popup.close();
                                }).fail(require('io.ox/core/notifications').yell);
                            });

                            return false;
                        } else {
                            validateField($name, $error);
                        }


                    })
                );
            });

        });

    }

    function fnImportSignatures(evt, signatures) {


        require(['io.ox/core/tk/dialogs', 'io.ox/core/api/snippets'], function (dialogs, snippets) {

            var popup = new dialogs.SidePopup({
                modal: true
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
                    $row.find(':checkbox').on('click', function (e) {
                        specializedClick = true;
                    });

                    $row.on('click', function () {
                        if (specializedClick) {
                            specializedClick = false;
                            return;
                        }
                        var $checkbox = $(this).find(':checkbox');
                        $checkbox.attr('checked', !$checkbox.attr('checked'));
                    });
                });

                $pane.append($('<a href="#">').text(gt('Select all')).on('click', function () {
                    $container.find(':checkbox').each(function () {
                        if (!$(this).attr('checked')) {
                            $(this).attr('checked', 'checked');
                        }
                    });
                    return false;
                }));

                $pane.append($('<br>'), $('<br>'), $('<br>'));

                var $button = $('<button class="btn btn-primary">')
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

        });

    }

    ext.point('io.ox/mail/settings/detail').extend({
        id: 'signatures',
        index: 300,
        draw: function () {
            var $node = this;
            require(['io.ox/core/api/snippets', 'io.ox/core/config'], function (snippets, config) {
                var $list, signatures;

                function fnDrawAll() {
                    snippets.getAll('signature').done(function (sigs) {
                        signatures = {};
                        $list.empty();
                        _(sigs).each(function (signature) {
                            signatures[signature.id] = signature;

                            var isDefault = settings.get('defaultSignature') === signature.id,
                                $item = $('<li>')
                                    .attr('data-id', signature.id)
                                    .append(
                                        $('<div class="pull-right">').append(
                                            $('<a class="action" tabindex="3" data-action="default">').text((isDefault ? gt('(Default)') : gt('Set as default'))),
                                            $('<a class="action" tabindex="3" data-action="edit">').text(gt('Edit')),
                                            $('<a class="close">').attr({
                                                'data-action': 'delete',
                                                title: gt('Delete'),
                                                tabindex: 3
                                            }).append($('<i class="icon-trash">'))
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
                try {

                    $node.append($('<legend class="sectiontitle">').text(gt('Signatures')));

                    // List
                    $list = $('<ul class="settings-list">')
                    .on('click', 'a[data-action=edit]', function (e) {
                        var id = $(this).parent().attr('data-id');
                        fnEditSignature(e, signatures[id]);
                    })
                    .on('click', 'a[data-action=delete]', function (e) {
                        var id = $(this).parent().attr('data-id');
                        snippets.destroy(id).fail(require('io.ox/core/notifications').yell);
                    })
                    .on('click', 'a[data-action=default]', function (e) {
                        var id = $(this).parent().attr('data-id');
                        settings.set('defaultSignature', id).save();
                        $list.find('li').removeClass('default')
                            .find('a[data-action="default"]').text(gt('Set as default'));
                        $(this).parent().addClass('default')
                            .find('a[data-action="default"]').text(gt('(Default)'));
                    })
                    .appendTo($node);


                    fnDrawAll();

                    snippets.on('refresh.all', function () {
                        fnDrawAll();
                    });

                    $('<div class="sectioncontent">').append(
                        $('<button class="btn btn-primary">').text(gt('Add')).on('click', fnEditSignature)
                    ).appendTo($node);

                    $('<br>').appendTo($node);

                    if (config.get('gui.mail.signatures') && !_.isNull && config.get('gui.mail.signatures').length > 0) {
                        $('<a href="#">').text(gt('Import signatures')).on('click', function (e) {
                            fnImportSignatures(e, config.get('gui.mail.signatures'));
                            return false;
                        }).appendTo($node);
                    }
                } catch (e) {
                    console.error(e, e.stack);
                }


            });
        }
    });

    ext.point('io.ox/core/updates').extend({
        id: 'migrate-signatures',
        run: function () {
            return fnMigrateClassicSignatures();
        }
    });
});