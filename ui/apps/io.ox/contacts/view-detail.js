/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define("io.ox/contacts/view-detail",
    ["io.ox/core/extensions",
     "gettext!io.ox/contacts",
     "io.ox/contacts/util",
     "io.ox/contacts/api",
     "io.ox/contacts/actions",
     "io.ox/core/api/folder",
     'io.ox/core/extPatterns/links',
     "less!io.ox/contacts/style.css"
    ], function (ext, gt, util, api, actions, folderAPI, links) {

    "use strict";

    // smart join
    var join = function () {
        return _(arguments)
            .select(function (obj, i) {
                return i > 0 && !!obj;
            })
            .join(arguments[0] || "");
    };
    
    var attachmentsBusy = false; //check if attachments are uploding atm

    function addField(label, value, node, fn) {
        var node;
        if (value) {
            node.append(
                $('<div class="row-fluid">').append(
                     // label
                    $('<div class="span4 field-label">').text(label),
                    // value
                    node = $('<div class="span8 field-value">')
                )
            );
            if (_.isFunction(fn)) {
                fn(node);
            } else {
                if (typeof fn === "string") {
                    node.addClass(fn);
                }
                node.text(_.noI18n(value));
            }
            return 1;
        } else {
            return 0;
        }
    }

    function addDistribMail(label, name, mail, node) {
        node.append(
            $('<div class="row-fluid">').append(
                // label
                $('<div class="span4 field-label">').text(label),
                // value
                $('<div class="span8 field-value">').append(
                    $('<a href="#" class="halo-link">').data({ email1: mail })
                        .text(_.noI18n(name)), $.txt(_.noI18n(' ')),
                    $('<span>').text(_.noI18n(mail))
                )
            )
        );
        return 1;
    }

    function clickMail(e) {
        e.preventDefault();
        // set recipient
        var data = { to: [[e.data.display_name, e.data.email]] };
        // open compose
        require(['io.ox/mail/write/main'], function (m) {
            m.getApp().launch().done(function () {
                this.compose(data);
            });
        });
    }

    function addMail(label, value, data) {
        return addField(label, value, this, function (node) {
            node
            .addClass('blue')
            .append(
                $('<a href="#" class="blue">')
                .attr({ href: 'mailto:' + value }).text(_.noI18n(value))
                .on('click', { email: value, display_name: data.display_name }, clickMail)
            );
        });
    }

    function addPhone(label, value, node) {
        return addField(label, value, node, function (node) {
            node
            .addClass("blue")
            .append(
                $('<a href="#" class="blue">')
                .attr({ href: 'callto:' + value }).text(_.noI18n(value))
            );
        });
    }

    function addAddress(label, street, code, city, country, node) {
        return addField(label, true, node, function (node) {
            var a = $("<a>", {
                    href: "http://www.google.de/maps?q=" + encodeURIComponent(join(", ", street, join(" ", code, city))),
                    target: "_blank"
                }).addClass("nolink");
            if (street) {
                a.append($("<span>").text(_.noI18n(street)));
                if (city) {
                    a.append($("<br>"));
                }
            }
            if (code) {
                a.append($("<span>").text(_.noI18n(code + ' ')));
            }
            if (city) {
                a.append($("<span>").text(_.noI18n(city)));
            }
            if (country) {
                a.append($("<br>"));
                a.append($("<span>").text(_.noI18n(country)));
            }
            a.append(
                $('<br>').append(
                    $('<small class="blue">').text(_.noI18n('(Google Maps \u2122)')) // \u2122 = &trade;
                )
            );
            node.append(a);
        });
    }

    ext.point("io.ox/contacts/detail").extend({
        index: 100,
        id: "contact-details",
        draw: function (baton) {
            var node = $('<div class="row-fluid contact-header">').appendTo(this);
            ext.point('io.ox/contacts/detail/head').invoke('draw', node, baton);
        }
    });
    
    function getDescription(data) {
        if (api.looksLikeDistributionList(data)) return gt('Distribution list');
        if (api.looksLikeResource(data)) return gt('Resource');
        return _.noI18n((data.company || data.position || data.profession) ?
            join(", ", data.company, data.position, data.profession) + "\u00A0" : util.getMail(data) + "\u00A0");
    }

    ext.point("io.ox/contacts/detail/head").extend({
        index: 100,
        id: 'contact-picture',
        draw: function (baton) {
            this.append(
                // left side / picture
                $('<div class="span4 field-label">').append(
                    api.getPicture(baton.data, { scaleType: 'contain', width: 80, height: 80 }).addClass('picture')
                )
            );
        }
    });

    ext.point("io.ox/contacts/detail/head").extend({
        index: 200,
        id: 'contact-title',
        draw: function (baton) {
            var private_flag,
                nameText = baton.data.display_name ? baton.data.display_name : util.getFullName(baton.data);
            this.append(
                // right side
                $('<div class="span8 field-value">').append(
                    $('<div class="name clear-title">')
                        .text(_.noI18n(nameText)),
                    private_flag = $('<i class="icon-lock private-flag">').hide(),
                    $('<div class="job clear-title">')
                        .text(getDescription(baton.data))
                )
            );
            if (baton.data.private_flag) {
                private_flag.show();
            } else {
                private_flag.hide();
            }
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 200,
        id: "inline-actions",
        draw: function (baton) {
            var node;
            this.append(
                $('<div class="row-fluid">').append(
                    node = $('<div class="span12">')
                )
            );
            ext.point("io.ox/contacts/detail/actions").invoke("draw", node, baton.data);
        }
    });

    function looksLikeHTML(str) {
        return (/<\w/).test(str);
    }
    
    //attachments
    ext.point("io.ox/contacts/detail").extend({
        index: 220,
        id: "attachments",
        draw: function (baton) {
            if (attachmentsBusy) {
                drawBusyAttachments(this, false);
            }
            else if (baton.data.number_of_attachments > 0) {
                ext.point('io.ox/contacts/detail-attach').invoke('draw', this, baton.data);
            }
        }
    });
    
    function  drawBusyAttachments(node, simple) {
        if (simple) {
            node.find('.attachments-value').empty().removeClass('span8').addClass('span2').busy();
            if (node.find('.attachments-value').length === 0) {
                var attachmentsBusyNode = $('<div>').addClass('attachments-container row-fluid').after(node.find('.contact-header').next());
                $('<span>').text(gt('Attachments \u00A0\u00A0')).addClass('field-label attachments span4').appendTo(attachmentsBusyNode);
                var linkContainer = $('<div>').addClass('span2 field-value attachments-value').appendTo(attachmentsBusyNode);
                linkContainer.busy();
            }
        } else {
            var attachmentsBusyNode = $('<div>').addClass('attachments-container row-fluid').appendTo(node);
            $('<span>').text(gt('Attachments \u00A0\u00A0')).addClass('field-label attachments span4').appendTo(attachmentsBusyNode);
            var linkContainer = $('<div>').addClass('span2 field-value attachments-value').appendTo(attachmentsBusyNode);
            linkContainer.busy();
        }
    }
    
    ext.point('io.ox/contacts/detail-attach').extend({
        index: 100,
        id: 'attachments',
        draw: function (contact) {
            var attachmentNode;
            if (this.hasClass('attachments-container')) {//if attachmentrequest fails the container is allready there
                attachmentNode = this;
            } else {
                attachmentNode = $('<div>').addClass('attachments-container row-fluid').appendTo(this);//else build new
            }
            $('<span>').text(gt('Attachments \u00A0\u00A0')).addClass('field-label attachments span4').appendTo(attachmentNode);
            var linkContainer = $('<div>').addClass('span8 field-value attachments-value').appendTo(attachmentNode);
            require(['io.ox/core/api/attachment'], function (api) {
                api.getAll({folder_id: contact.folder_id, id: contact.id, module: 7}).done(function (data) {
                    _(data).each(function (a, index) {
                        // draw
                        buildDropdown(linkContainer, _.noI18n(a.filename), a);
                    });
                    if (data.length > 1) {
                        buildDropdown(linkContainer, gt('all'), data);
                    }
                    attachmentNode.delegate('a', 'click', function (e) {e.preventDefault(); });
                }).fail(function () {
                    attachmentFail(attachmentNode, contact);
                });
            });
        }
    });

    var attachmentFail = function (container, contact) {
        container.empty().append(
                $.fail(gt('Could not load attachments for this contact.'), function () {
                    ext.point('io.ox/contacts/detail-attach').invoke('draw', container, contact);
                })
            );
    };

    var buildDropdown = function (container, label, data) {
        new links.DropdownLinks({
                label: label,
                classes: 'attachment-item',
                ref: 'io.ox/contacts/attachment/links'
            }).draw.call(container, data);
    };

    ext.point("io.ox/contacts/detail").extend({
        index: 250,
        id: "description", // only for resources
        draw: function (baton) {
            if ('description' in baton.data) {
                addField(gt('Description'), true, this, function (node) {
                    var text = $.trim(baton.data.description);
                    if (looksLikeHTML(text)) {
                        node.html(text);
                    } else {
                        node.html(text.replace(/\n/g, '<br>'));
                    }
                });
                addField('', '\u00A0', this);
            }
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 300,
        id: 'company',
        draw: function (baton) {
            var r = 0, data = baton.data;
            r += addField(gt("Department"), data.department, this);
            r += addField(gt("Position"), data.position, this);
            r += addField(gt("Profession"), data.profession, this);
            if (r > 0) { addField("", "\u00A0", this); }
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 400,
        id: 'address',
        draw: function (baton) {
            var r = 0, data = baton.data;
            if (data.street_business || data.city_business) {
                r += addAddress(gt.pgettext("address", "Work"), data.street_business, data.postal_code_business, data.city_business, null, this);
            }
            if (data.street_home || data.city_home) {
                r += addAddress(gt.pgettext("address", "Home"), data.street_home, data.postal_code_home, data.city_home, null, this);
            }
            if (r > 0) { addField("", "\u00A0", this); }
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 500,
        id: 'phone',
        draw: function (baton) {
            var r = 0, data = baton.data;
            r += addPhone(gt("Phone (business)"), data.telephone_business1, this);
            r += addPhone(gt("Phone (business)"), data.telephone_business2, this);
            r += addPhone(gt("Phone (private)"), data.telephone_home1, this);
            r += addPhone(gt("Phone (private)"), data.telephone_home2, this);
            r += addPhone(gt("Mobile"), data.cellular_telephone1, this);
            r += addPhone(gt("Mobile"), data.cellular_telephone2, this);
            if (r > 0) {
                addField("", "\u00A0", this);
            }
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 600,
        id: 'mail-address',
        draw: function (baton) {
            var data = baton.data;
            if (data.mark_as_distributionlist === true) {
                var list = _.copy(data.distribution_list || [], true);
                // if there are no members in the list
                if (list.length === 0) {
                    addDistribMail(gt('Members'), gt('This list has no members yet'), "\u00A0", this);
                }
                _.each(list, function (val, key) {
                    if (key === 0) {
                        addDistribMail(gt('Members'), val.display_name, val.mail, this);
                    } else {
                        addDistribMail('', val.display_name, val.mail, this);
                    }
                }, this);
            } else {
                var dupl = {},
                r = 0;
                r += addMail.call(this, gt("Primary Email"), data.email1, data);
                dupl[data.email1] = true;
                if (dupl[data.email2] !== true) {
                    r += addMail.call(this, gt("Alternative Email"), data.email2, data);
                    dupl[data.email2] = true;
                }
                if (dupl[data.email3] !== true) {
                    r += addMail.call(this, gt("Alternative Email"), data.email3, data);
                }
                if (r > 0) {
                    addField("", "\u00A0", this);
                }
            }
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 700,
        id: 'birthday',
        draw: function (baton) {
            var r = 0, data = baton.data,
                date = new Date(data.birthday);
            if (data.birthday !== null && !isNaN(date.getDate())) {
                r += addField(gt("Birthday"), date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear(), this);
            }
            if (r > 0) {
                addField("", "\u00A0", this);
            }
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 10000,
        id: 'qr',
        draw: function (baton) {
            var data = baton.data;
            if (Modernizr.canvas && !data.mark_as_distributionlist) {
                addField("\u00A0", true, this, function (node) {
                    node.append(
                        $('<i class="icon-qrcode">'), $.txt(' '),
                        $("<a>", { href: '#' })
                        .text(gt('Show QR code'))
                        .on("click", function (e) {
                            e.preventDefault();
                            node.empty().busy();
                            require(["io.ox/contacts/view-qrcode"], function (qr) {
                                var vc = qr.getVCard(data);
                                node.idle().qrcode(vc);
                                vc = node = qr = null;
                            });
                        })
                    );
                });
                addField("", "\u00A0", this);
            }
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 20000,
        id: 'breadcrumb',
        draw: function (baton) {

            var options = { subfolder: false, prefix: gt('Folder'), module: 'contacts' };

            // this is also used by halo, so we might miss a folder id
            if (baton.data.folder_id) {
                // do we know the app?
                if (baton.app) {
                    options.handler = baton.app.folder.set;
                }
                this.append(
                    folderAPI.getBreadcrumb(baton.data.folder_id, options)
                );
            }
        }
    });

    function redraw(e, data) {
        $(this).replaceWith(e.data.view.draw(data));
    }
    
    function setAttachmentsbusy(e, data) {
        attachmentsBusy = data.state;
        if (data.redraw) {
            drawBusyAttachments(e.data.node, true);
        }
    }

    return {

        draw: function (baton) {

            if (!baton) return $();

            try {

                // make sure we have a baton
                baton = ext.Baton.ensure(baton);

                var node = $.createViewContainer(baton.data, api).on('redraw', { view: this }, redraw);
                api.on('AttachmentHandlingInProgress:' + encodeURIComponent(_.cid(baton.data)), {node: node}, setAttachmentsbusy);
                node.addClass('contact-detail view');
                ext.point('io.ox/contacts/detail').invoke('draw', node, baton);

                return node;

            } catch (e) {
                console.error('io.ox/contacts/view-detail:draw()', e);
            }
        }
    };
});
