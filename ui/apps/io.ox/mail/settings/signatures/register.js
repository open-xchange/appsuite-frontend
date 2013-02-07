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

define('io.ox/mail/settings/signatures/register', ['io.ox/core/extensions', 'gettext!io.ox/mail', 'settings!io.ox/mail'], function (ext, gt, settings) {
    'use strict';

    function fnMigrateClassicSignatures() {
        var def = $.Deferred();
        require(["settings!io.ox/migration", "io.ox/core/api/snippets"], function (config, snippets) {
            var classicSignatures = config.get('gui/mail/signatures');

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


        require(['io.ox/core/tk/dialogs'], function (dialogs) {
            var $name, $signature, $insertion, popup;

            popup = new dialogs.SidePopup({
                modal: true
            })
            .show(evt, function ($pane) {
                if (_.isString(signature.misc)) { signature.misc = JSON.parse(signature.misc); }
                var $entirePopup = $pane.closest('.io-ox-sidepopup');
                $('<form>').append(
                    $('<div class="row-fluid">').append(
                        $name = $('<input type="text" class="span12">').attr('placeholder', gt("Name"))
                    ),
                    $('<div class="row-fluid">').append(
                        $signature = $('<textarea class="span12" rows="10">')
                    ),
                    $('<div class="row-fluid">').append(
                        $('<label>').text(gt('Signature insertion:')),
                        $insertion = $('<select>').append(
                            $('<option value="above">').text(gt('Above content')),
                            $('<option value="below">').text(gt('Below content'))
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
                var $buttonDiv = $entirePopup.find(".io-ox-sidepopup-close");

                $buttonDiv.empty();

                function busy() {
                    dialogs.busy($entirePopup);
                }

                function idle() {
                    dialogs.idle($entirePopup);
                }

                $buttonDiv.append(
                    $('<button class="btn">').text(gt('Discard')).on('click', function () {
                        popup.close();
                        return false;
                    }),
                    $('<button class="btn btn-primary">').text(gt('Save')).on('click', function () {
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

                        require(["io.ox/core/api/snippets"], function (snippets) {
                            var def = null;
                            if (signature.id) {
                                def = snippets.update(update);
                            } else {
                                def = snippets.create(update);
                            }
                            def.done(function (resp) {
                                idle();
                                popup.close();
                            }).fail(require("io.ox/core/notifications").yell);
                        });

                        return false;
                    })
                );
            });

        });

    }

    function fnImportSignatures(evt, signatures) {


        require(['io.ox/core/tk/dialogs', 'io.ox/core/api/snippets', 'less!io.ox/mail/settings/signatures/style.less'], function (dialogs, snippets) {

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
                        $('<td>').css({width: "80%", padding: '10px'}).append(
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

                var $button = $('<button class="btn btn-primary">').text(gt('Import signatures')).appendTo($pane);

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
            require(["io.ox/core/api/snippets", 'settings!io.ox/migration'], function (snippets, config) {
                var $list, signatures;
                function fnDrawAll() {
                    snippets.getAll('signature').done(function (sigs) {
                        signatures = {};
                        $list.empty();
                        _(sigs).each(function (signature) {
                            var $item = $('<div class="selectable deletable-item">').attr('data-id', signature.id).text(gt.noI18n(signature.displayname));
                            if (settings.get('defaultSignature') === signature.id) {
                                $item.append($('<span>').attr('data-default', 'default').text(gt('(Default)')).css({color: '#999', 'padding-left': '10px'}));
                            }
                            $list.append($item);
                            signatures[signature.id] = signature;
                        });
                    });
                }
                try {

                    $node.append($('<legend class="sectiontitle">').text(gt("Signatures")));

                    // List
                    $list = $('<div class="listbox">').css({minHeight: "80px", maxHeight: "200px"}).appendTo($node);


                    fnDrawAll();

                    snippets.on('refresh.all', function () {
                        fnDrawAll();
                    });

                    $list.on('click', '.selectable', function (e) {
                        $list.find('div[selected="selected"]').attr('selected', null);
                        $(e.target).attr('selected', 'selected');
                    });

                    // Buttons
                    $('<div class="sectioncontent">').append(
                        $('<button class="btn btn-primary">').text(gt('Add')).on('click', fnEditSignature).css({marginRight: '15px'}),
                        $('<button class="btn">').text(gt('Edit')).on('click', function (evt) {
                            var id = $list.find('div[selected="selected"]').first().attr('data-id');
                            fnEditSignature(evt, signatures[id]);
                        }).css({marginRight: '15px'}),
                        $('<button class="btn">').text(gt('Delete')).on('click', function (evt) {
                            var id = $list.find('div[selected="selected"]').first().attr('data-id');
                            snippets.destroy(id).fail(require("io.ox/core/notifications").yell);
                        }).css({marginRight: '15px'}),
                        $('<button class="btn">').text(gt('Set as default')).on('click', function (evt) {
                            var selected = $list.find('div[selected="selected"]'),
                            current = $list.find('span[data-default="default"]');
                            if (current.parent().attr('data-id') === selected.attr('data-id')) {
                                settings.set('defaultSignature', false).save();
                                current.remove();
                            } else {
                                current.remove();
                                selected.append($('<span>').attr('data-default', 'default').text(gt('(Default)')).css({color: '#999', 'padding-left': '10px'}));
                                settings.set('defaultSignature', selected.attr('data-id')).save();
                            }
                        }).css({marginRight: '15px'})
                    ).appendTo($node);

                    $("<br>").appendTo($node);


                    if (config.get('gui/mail/signatures') && !_.isNull && config.get('gui/mail/signatures').length > 0) {
                        $('<a href="#">').text(gt("Import signatures")).on('click', function (e) {
                            fnImportSignatures(e, config.get('gui/mail/signatures'));
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