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
     'io.ox/core/date',
     "less!io.ox/contacts/style.less"
    ], function (ext, gt, util, api, actions, folderAPI, links, date) {

    "use strict";

    // smart join
    var join = function () {
        return _(arguments)
            .select(function (obj, i) {
                return i > 0 && !!obj;
            })
            .join(arguments[0] || "");
    };

    function getDescription(data) {
        function single(index, value, translated) {
            var params = new Array(index);
            params[index - 1] = translated ? value : _.noI18n(value);
            return { format: _.noI18n('%' + index + '$s'), params: params };
        }
        if (api.looksLikeDistributionList(data)) {
            return single(7, gt('Distribution list'), true);
        }
        if (api.looksLikeResource(data)) {
            return single(7, gt('Resource'), true);
        }
        if (data.company || data.position || data.profession) {
            return {
                format: join(', ', data.company ? '%4$s' : '',
                                   data.position ? '%5$s' : '',
                                   data.profession ? '%6$s' : ''),
                params: ['', '', '', _.noI18n(data.company),
                         _.noI18n(data.position), _.noI18n(data.profession)]
            };
        }
        return util.getMailFormat(data);
    }

    function createText(format, classes) {
        return _.aprintf(
            format.format,
            function (index) {
                return $('<span>').addClass(classes[index]).text(_.noI18n(format.params[index]));
            },
            function (text) {
                return $.txt(text);
            }
        );
    }

    function looksLikeHTML(str) {
        return (/<\w/).test(str);
    }

    function drawBusyAttachments(node) {
        node.append(
            $('<section class="attachments-container">').append(
                $('<span class="field-label attachments">').text(gt('Attachments')),
                $.txt(' '),
                $('<span class="attachments-value">').css({ width: '70px', height: '12px', display: 'inline-block' }).busy()
            )
        );
    }

    function attachmentFail(container, contact) {
        container.empty().append(
            $.fail(gt('Could not load attachments for this contact.'), function () {
                ext.point('io.ox/contacts/detail/attachments').invoke('draw', container, contact);
            })
        );
    }

    function buildDropdown(container, label, data) {
        new links.DropdownLinks({
            label: label,
            classes: 'attachment-item',
            ref: 'io.ox/contacts/attachment/links'
        }).draw.call(container, data);
    }

    /*
     * Extensions
     */

    var INDEX = 100;

    ext.point("io.ox/contacts/detail").extend({
        index: (INDEX += 100),
        id: "inline-actions",
        draw: function (baton) {
            ext.point("io.ox/contacts/detail/actions").invoke("draw", this, baton.data);
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: (INDEX += 100),
        id: "contact-details",
        draw: function (baton) {
            var node;
            this.append(
                node = $('<header class="row-fluid contact-header">')
            );
            ext.point('io.ox/contacts/detail/head').invoke('draw', node, baton);
        }
    });

    // HEAD

    ext.point("io.ox/contacts/detail/head").extend({
        index: 100,
        id: 'contact-picture',
        draw: function (baton) {
            if (!api.looksLikeDistributionList(baton.data)) {
                this.append(
                    api.getPicture(baton.data, { scaleType: 'contain', width: 80, height: 80 }).addClass('picture')
                );
            }
        }
    });

    ext.point("io.ox/contacts/detail/head").extend({
        index: 200,
        id: 'contact-title',
        draw: function (baton) {

            var name = createText(util.getFullNameFormat(baton.data),
                    ['first_name', 'last_name', 'title', 'display_name']),
                job = createText(getDescription(baton.data),
                    ['email1', 'email2', 'email3', 'company', 'position',
                     'profession', 'type']);

            this.append(
                $('<div>').append(
                    // right side
                    $('<i class="icon-lock private-flag">').attr('title', gt('Private')).hide(),
                    $('<h1>').append(name),
                    $('<h2>').append(job)
                )
            );

            if (baton.data.private_flag) {
                this.find('.private-flag').show();
            }
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: (INDEX += 100),
        id: "attachments",
        draw: function (baton) {
            if (api.uploadInProgress(encodeURIComponent(_.cid(baton.data)))) {
                drawBusyAttachments(this);
            }
            else if (baton.data.number_of_attachments > 0) {
                ext.point('io.ox/contacts/detail/attachments').invoke('draw', this, baton.data);
            }
        }
    });

    // Attachments

    ext.point('io.ox/contacts/detail/attachments').extend({
        draw: function (contact) {
            var attachmentNode, linkContainer;
            if (this.hasClass('attachments-container')) { // if attachmentrequest fails the container is allready there
                attachmentNode = this;
            } else {
                attachmentNode = $('<section>').addClass('attachments-container').appendTo(this); //else build new
            }
            attachmentNode.append(
                $('<span class="field-label attachments">').text(gt('Attachments')),
                $.txt(' '),
                linkContainer = $('<span class="attachments-value">')
            );
            require(['io.ox/core/api/attachment'], function (api) {
                api.getAll({folder_id: contact.folder_id, id: contact.id, module: 7}).done(function (data) {
                    _(data).each(function (a, index) {
                        // draw
                        buildDropdown(linkContainer, _.noI18n(a.filename), a);
                    });
                    if (data.length > 1) {
                        buildDropdown(linkContainer, gt('All attachments'), data);
                    }
                    attachmentNode.delegate('a', 'click', function (e) { e.preventDefault(); });
                }).fail(function () {
                    attachmentFail(attachmentNode, contact);
                });
            });
        }
    });

    // Content

    ext.point("io.ox/contacts/detail").extend({
        index: (INDEX += 100),
        id: "contact-content",
        draw: function (baton) {

            var node = $('<article>').appendTo(this),
                id = baton.data.mark_as_distributionlist ?
                    'io.ox/contacts/detail/list' :
                    'io.ox/contacts/detail/content';

            ext.point(id).invoke('draw', node, baton);
        }
    });

    // Distribution list members

    ext.point("io.ox/contacts/detail/member").extend({

        draw: function (data) {
            // draw member
            this.append(
                $('<div class="member">').append(
                    api.getPicture(data, { scaleType: 'cover', width: 48, height: 48 }).addClass('member-picture'),
                    $('<div class="member-name">').text(data.display_name),
                    $('<a href="#" class="halo-link">').data({ email1: data.mail }).text(data.mail)
                )
            );
        }
    });

    ext.point("io.ox/contacts/detail/list").extend({

        draw: function (baton) {

            var list = _.copy(baton.data.distribution_list || [], true), hash = {};

            // if there are no members in the list
            if (list.length === 0) {
                this.append(
                    $('<div>').text(gt('This list has no members yet'))
                );
                return;
            }

            // remove duplicates to fix backend bug
            _(list)
                .chain()
                .filter(function (member) {
                    if (hash[member.mail]) {
                        return false;
                    } else {
                        return (hash[member.mail] = true);
                    }
                })
                .each(function (member) {
                    ext.point("io.ox/contacts/detail/member").invoke('draw', this, member);
                }, this);
        }
    });

    function block(legend, list) {

        var args = _(arguments).toArray(),
            rows = _(args.slice(1)).compact();

        if (rows.length === 0) return [];

        return $('<div class="block">').append(
            [$('<legend>').text(args[0])].concat(rows)
        );
    }

    function row(label, builder) {

        if (_.isFunction(label)) {
            builder = label;
            label = null;
        }

        var build = builder();

        if (!build) return null;

        return $('<div>').append(
            label ? $('<label>').text(label) : [],
            _.isString(build) ? $.txt(build) : build
        );
    }

    function simple(label, value) {
        value = $.trim(value);
        if (!value) return null;
        return $('<div>').append(
            $('<label>').text(label),
            $('<span>').text(value)
        );
    }

    function clickMail(e) {
        e.preventDefault();
        // set recipient
        var data = { to: [[e.data.display_name, e.data.email]] };
        // open compose
        ox.load(['io.ox/mail/write/main']).done(function (m) {
            m.getApp().launch().done(function () {
                this.compose(data);
            });
        });
    }

    function mail(address, name) {
        if (!address) return null;
        return $('<div>').append(
            $('<label>').text(gt('E-Mail')),
            $('<a>', { href: 'mailto:' + address })
                .text(_.noI18n(address))
                .on('click', { email: address, display_name: name }, clickMail)
        );
    }

    function getMailAddresses(data) {
        return _([data.email1, data.email2, data.email3])
            .chain()
            .compact()
            .map(function (address) {
                return $.trim(address).toLowerCase();
            })
            .uniq()
            .value();
    }

    function phone(label, number) {
        number = $.trim(number);
        if (!number) return null;
        return $('<div>').append(
            $('<label>').text(label),
            $('<a>', { href: _.device('smartphone') ? 'tel:' + number: 'callto:' + number }).text(number)
        );
    }

    function IM(number) {

        number = $.trim(number);
        if (!number) return null;

        if (/^skype:/.test(number)) {
            number = number.split('skype:')[1];
            return $('<div>').append(
                $('<label>').text('Skype'),
                $('<a>', { href: 'callto:' + number + '?call' }).text(number)
            );
        }

        if (/^x-apple:/.test(number)) {
            number = number.split('x-apple:')[1];
            return $('<div>').append(
                $('<label>').text('iMessage'),
                $('<a>', { href: 'imessage://' + number + '@me.com' }).text(number)
            );
        }

        return simple(gt('Messenger'), number);
    }

    // data is full contact data
    // type is 'business' or 'home' or 'other'
    function address(data, type) {

        data = _(['street', 'postal_code', 'city', 'state', 'country']).map(function (field) {
            return data[field + '_' + type] || '';
        });

        if (!_.some(data)) return null;

        var text =
            //#. Format of addresses
            //#. %1$s is the street
            //#. %2$s is the postal code
            //#. %3$s is the city
            //#. %4$s is the state
            //#. %5$s is the country
            gt('%1$s\n%2$s %3$s\n%4$s\n%5$s', data);

        return $('<a class="google-maps" target="_blank">')
            .attr('href', 'http://www.google.com/maps?q=' + encodeURIComponent(text.replace('/\n/g', ', ')))
            .append(
                $.txt($.trim(text)),
                $('<caption>').append(
                    $('<i class="icon-external-link">'),
                    $.txt(' Google Maps \u2122') // \u2122 = &trade;
                )
            );
    }

    ext.point("io.ox/contacts/detail/content")

        // Contact note/comment
        .extend({
            id: "comment",
            index: 100,
            draw: function (baton) {

                var comment = $.trim(baton.data.note || '');
                if (comment !== '') {
                    this.append(
                        $('<div class="comment">').text(comment)
                    );
                }
            }
        })

        // Personal
        .extend({
            id: 'personal',
            index: 200,
            draw: function (baton) {

                var data = baton.data,
                    addresses = getMailAddresses(data),
                    fullname = util.getFullName(baton.data);

                this.append(

                    block(gt('Personal'),
                        simple(gt('Name'), fullname),
                        simple(gt('Middle name'), data.second_name),
                        simple(gt('Suffix'), data.suffix),
                        simple(gt('Nickname'), data.nickname),
                        row(gt('Birthday'), function () {
                            if (baton.data.birthday)
                                return new date.Local(baton.data.birthday).format(date.DATE);
                        })
                    ),

                    block(gt('Job'),
                        simple(gt('Position'), data.position),
                        simple(gt('Department'), data.department),
                        simple(gt('Profession'), data.profession),
                        simple(gt('Company'), data.company),
                        simple(gt('Room number'), data.room_number)
                    ),

                    block(gt('Mail and Messaging'),
                        mail(addresses[0], fullname),
                        mail(addresses[1], fullname),
                        mail(addresses[2], fullname),
                        IM(data.instant_messenger1),
                        IM(data.instant_messenger2)
                    ),

                    block(gt('Phone numbers'),
                        phone(gt('Mobile'), data.cellular_telephone1),
                        phone(gt('Mobile'), data.cellular_telephone2),
                        phone(gt('Phone (business)'), data.telephone_business1),
                        phone(gt('Phone (business)'), data.telephone_business2),
                        phone(gt('Phone (private)'), data.telephone_home1),
                        phone(gt('Phone (private)'), data.telephone_home2),
                        phone(gt('Phone (other)'), data.telephone_other),
                        simple(gt('Fax (business)'), data.fax_business),
                        simple(gt('Fax (private)'), data.fax_home),
                        simple(gt('Fax (other)'), data.fax_other)
                    ),

                    block(gt('Business Address'),
                        address(data, 'business')
                    ),

                    block(gt('Home Address'),
                        address(data, 'home')
                    ),

                    block(gt('Other Address'),
                        address(data, 'other')
                    ),

                    block(
                        //#. section name for contact fields in detail view
                        gt('Miscellaneous'),
                        simple(gt('URL'), data.url),
                        // looks stupid but actually easier to read and not much shorter than any smart-ass solution
                        simple(gt('Optional 01'), data.userfield01),
                        simple(gt('Optional 02'), data.userfield02),
                        simple(gt('Optional 03'), data.userfield03),
                        simple(gt('Optional 04'), data.userfield04),
                        simple(gt('Optional 05'), data.userfield05),
                        simple(gt('Optional 06'), data.userfield06),
                        simple(gt('Optional 07'), data.userfield07),
                        simple(gt('Optional 08'), data.userfield08),
                        simple(gt('Optional 09'), data.userfield09),
                        simple(gt('Optional 10'), data.userfield10),
                        simple(gt('Optional 11'), data.userfield11),
                        simple(gt('Optional 12'), data.userfield12),
                        simple(gt('Optional 13'), data.userfield13),
                        simple(gt('Optional 14'), data.userfield14),
                        simple(gt('Optional 15'), data.userfield15),
                        simple(gt('Optional 16'), data.userfield16),
                        simple(gt('Optional 17'), data.userfield17),
                        simple(gt('Optional 18'), data.userfield18),
                        simple(gt('Optional 19'), data.userfield19),
                        simple(gt('Optional 20'), data.userfield20)
                    )
                );
            }
        });


    // Resource description
    // only applies to resource because they have a "description" field.
    // contacts just have a "note"

    ext.point("io.ox/contacts/detail/content").extend({
        index: 'last',
        id: "description", //
        draw: function (baton) {

            var str = $.trim(baton.data.description || '');
            if (str !== '') {
                this.append(
                    $('<div class="description">').append(
                        $('<div>').html(
                            looksLikeHTML(str) ? str : str.replace(/\n/g, '<br>')
                        ),
                        // add callback?
                        baton.data.callbacks && 'extendDescription' in baton.data.callbacks ?
                            $('<a href="#">').text(gt('Copy to description'))
                            .on('click', { description: str.replace(/[ \t]+/g, ' ') }, 'wurst' || baton.data.callbacks.extendDescription)
                            : []
                    )
                );
            }
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 'last',
        id: 'breadcrumb',
        draw: function (baton) {

            var options = { subfolder: false, prefix: gt('Saved in'), module: 'contacts' };

            // this is also used by halo, so we might miss a folder id
            if (baton.data.folder_id) {
                // do we know the app?
                if (baton.app) {
                    options.handler = baton.app.folder.set;
                }
                this.append(
                    folderAPI.getBreadcrumb(baton.data.folder_id, options)
                    .addClass('chromeless clear-both')
                );
            }
        }
    });

    function redraw(e, data) {
        $(this).replaceWith(e.data.view.draw(data));
    }

    return {

        draw: function (baton) {

            if (!baton) return $('<div>');

            try {

                // make sure we have a baton
                baton = ext.Baton.ensure(baton);

                var node = $.createViewContainer(baton.data, api).on('redraw', { view: this }, redraw);
                node.addClass('contact-detail view');
                ext.point('io.ox/contacts/detail').invoke('draw', node, baton);

                return node;

            } catch (e) {
                console.error('io.ox/contacts/view-detail:draw()', e);
            }
        }
    };
});
