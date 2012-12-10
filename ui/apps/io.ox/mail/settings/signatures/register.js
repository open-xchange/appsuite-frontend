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

define('io.ox/mail/settings/signatures/register', ['io.ox/core/extensions', 'gettext!io.ox/mail'], function (ext, gt) {
    'use strict';

    function fnEditSignature(evt, signature) {
        if (!signature) {
            signature = {
                id: null,
                name: '',
                signature: ''
            };
        }


        require(['io.ox/core/tk/dialogs'], function (dialogs) {
            var $name, $signature, popup;
            
            popup = new dialogs.SidePopup({
                modal: true
            })
            .show(evt, function ($pane) {
                var $entirePopup = $pane.closest('.io-ox-sidepopup');
                $('<form>').append(
                    $('<div class="row-fluid">').append(
                        $name = $('<input type="text" class="span12">').attr('placeholder', gt("Name"))
                    ),
                    $('<div class="row-fluid">').append(
                        $signature = $('<textarea class="span12" rows="10">')
                    )
                ).appendTo($pane);

                $name.val(signature.displayname);
                $signature.val(signature.content);

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
                    $('<button class="btn">').text('Discard').on('click', function () {
                        popup.close();
                        return false;
                    }),
                    $('<button class="btn btn-primary">').text('Save').on('click', function () {
                        busy();
                        var update = signature.id ? {} : {type: 'signature', module: 'io.ox/mail', displayname: '', content: ''};
                        
                        if ($signature.val() !== signature.content) {
                            update.content = $signature.val();
                        }

                        if ($name.val() !== signature.displayname) {
                            update.displayname = $name.val();
                        }

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

    ext.point('io.ox/mail/settings/detail').extend({
        id: 'signatures',
        index: 300,
        draw: function () {
            var $node = this;
            require(["io.ox/core/api/snippets"], function (snippets) {
                var $list, signatures;
                function fnDrawAll() {
                    snippets.getAll('signature').done(function (sigs) {
                        signatures = {};

                        _(sigs).each(function (signature) {
                            $list.append($('<div class="selectable deletable-item">').attr('data-id', signature.id).text(signature.displayname));
                            signatures[signature.id] = signature;
                        });
                    });
                }
                try {

                    $node.append($('<legend class="sectiontitle">').text(gt("Signatures")));

                    // List
                    $list = $('<div class="listbox">').css({minHeight: "250px"}).appendTo($node);


                    fnDrawAll();

                    snippets.on('refresh.all', function () {
                        $list.empty();
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
                        }).css({marginRight: '15px'})
                    ).appendTo($node);

                    $("<br>").appendTo($node);
                    $('<a href="#">').text(gt("Import signatures")).appendTo($node);
                } catch (e) {
                    console.error(e, e.stack);
                }


            });
        }
    });
});