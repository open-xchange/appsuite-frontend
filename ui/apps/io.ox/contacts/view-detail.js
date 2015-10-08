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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/contacts/view-detail', [
    'io.ox/core/extensions',
    'io.ox/contacts/util',
    'io.ox/contacts/api',
    'io.ox/contacts/actions',
    'io.ox/contacts/model',
    'io.ox/participants/views',
    'io.ox/participants/model',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/extPatterns/links',
    'io.ox/core/util',
    'io.ox/core/capabilities',
    'gettext!io.ox/contacts',
    'less!io.ox/contacts/style'
], function (ext, util, api, actions, model, pViews, pModel, BreadcrumbView, links, coreUtil, capabilities, gt) {

    'use strict';

    // smart join
    var join = function () {
        return _(arguments)
            .select(function (obj, i) {
                return i > 0 && !!obj;
            })
            .join(arguments[0] || '');
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

        if (data.position || data.profession) {
            return {
                format: join(', ', data.position ? '%1$s' : '', data.profession ? '%2$s' : ''),
                params: [_.noI18n(data.position), _.noI18n(data.profession)]
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

    function buildDropdown(container, label, data) {
        return new links.Dropdown({
            label: label,
            classes: 'attachment-item',
            ref: 'io.ox/core/tk/attachment/links'
        }).draw.call(container, data);
    }

    /*
     * Extensions
     */

    var INDEX = 100;

    ext.point('io.ox/contacts/detail').extend({
        index: (INDEX += 100),
        id: 'inline-actions',
        draw: function (baton) {
            if (!api.looksLikeResource(baton.data)) {
                ext.point('io.ox/contacts/detail/actions').invoke('draw', this, baton.data);
            }
        }
    });

    ext.point('io.ox/contacts/detail').extend({
        index: (INDEX += 100),
        id: 'contact-details',
        draw: function (baton) {
            var node;
            this.append(
                node = $('<header class="contact-header" role="heading">')
            );
            ext.point('io.ox/contacts/detail/head').invoke('draw', node, baton);
        }
    });

    // HEAD

    ext.point('io.ox/contacts/detail/head').extend({
        index: 100,
        id: 'contact-picture',
        draw: function (baton) {
            if (api.looksLikeDistributionList(baton.data)) return;
            this.append(
                api.pictureHalo(
                    $('<div class="picture" aria-hidden="true">'),
                    baton.data,
                    { width: 64, height: 64 }
                )
            );
        }
    });

    ext.point('io.ox/contacts/detail/head').extend({
        index: 200,
        id: 'contact-title',
        draw: function (baton) {

            var name = coreUtil.renderPersonalName({
                html: util.getFullName(baton.data, true),
                tagName: 'h1'
            }, baton.data);

            var job = createText(getDescription(baton.data), ['position', 'profession', 'type']),
                company = $.trim(baton.data.company);

            this.append(
                $('<div class="next-to-picture">').append(
                    // right side
                    $('<i class="fa fa-lock private-flag">').attr('title', gt('Private')).hide(),
                    name.children().length ? name.addClass('header-name') : [],
                    company ? $('<h2 class="header-company">').append($('<span class="company">').text(company)) : [],
                    job.length ? $('<h2 class="header-job">').append(job) : [],
                    $('<section class="attachments-container clear-both">')
                        .append($('<span class="attachments-in-progress">').busy())
                        .hide()
                )
            );

            if (baton.data.private_flag) {
                this.find('.private-flag').show();
            }

            if (api.uploadInProgress(_.ecid(baton.data))) {
                this.find('.attachments-container').show();
            } else if (baton.data.number_of_attachments > 0) {
                ext.point('io.ox/contacts/detail/attachments').invoke('draw', this.find('.attachments-container'), baton.data);
            }
        }
    });

    // Attachments

    ext.point('io.ox/contacts/detail/attachments').extend({
        draw: function (contact) {

            var section = this.show();

            require(['io.ox/core/api/attachment'], function (api) {
                // this request might take a while; not cached
                api.getAll({ folder_id: contact.folder_id, id: contact.id, module: 7 }).then(
                    function success(data) {
                        section.empty();
                        _(data).each(function (a) {
                            // draw
                            buildDropdown(section, _.noI18n(a.filename), a);
                        });
                        if (data.length > 1) {
                            buildDropdown(section, gt('All attachments'), data).find('a').removeClass('attachment-item');
                        }
                        section.on('a', 'click', function (e) { e.preventDefault(); });
                    },
                    function fail() {
                        section.empty().append(
                            $.fail(gt('Could not load attachments for this contact.'), function retry() {
                                ext.point('io.ox/contacts/detail/attachments').invoke('draw', section, contact);
                            })
                        );
                    }
                );
            });
        }
    });

    // Content

    ext.point('io.ox/contacts/detail').extend({
        index: (INDEX += 100),
        id: 'contact-content',
        draw: function (baton) {

            //clearfix needed or halo design is broken
            var node = $('<article class="clearfix">').appendTo(this),
                id = baton.data.mark_as_distributionlist ?
                    'io.ox/contacts/detail/list' :
                    'io.ox/contacts/detail/content';

            ext.point(id).invoke('draw', node, baton);
        }
    });

    // Distribution list members

    ext.point('io.ox/contacts/detail/member').extend({

        draw: function (data) {
            // draw member
            this.append(
                new pViews.ParticipantEntryView({
                    tagName: 'li',
                    model: new pModel.Participant(data),
                    halo: true
                }).render().$el
            );
        }
    });

    ext.point('io.ox/contacts/detail/list').extend({

        draw: function (baton) {

            var list = _.copy(baton.data.distribution_list || [], true),
                hash = {},
                $list = $('<ul class="member-list list-unstyled">');

            this.append($list);

            // if there are no members in the list
            if (list.length === 0) {
                this.append(
                    $('<div>').text(gt('This list has no contacts yet'))
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
                    ext.point('io.ox/contacts/detail/member').invoke('draw', $list, member);
                }, this);
        }
    });

    function block() {

        function removeAndSplice() {
            rows.splice(-1, 1);
            return args.slice(-1)[0];
        }

        var args = _(arguments).toArray(),
            rows = _(args.slice(1)).compact(),
            noDl = _.isBoolean(args.slice(-1)[0]) ? removeAndSplice() : false,
            block = $('<fieldset class="block">'),
            dl = $('<dl class="dl-horizontal">'),
            self = noDl ? block : dl.appendTo(block);

        // if block empty
        if (rows.length < 1) return $();

        _.each(rows, function (el) {
            self.append(el);
        });

        return block.prepend(
            $('<legend>').text(args[0])
        );
    }

    function row(id, builder) {
        var build = builder();
        if (!build) return null;
        return function () {
            $(this).append(
                $('<dt>').text(model.fields[id]),
                $('<dd>').append(_.isString(build) ? $.txt(build) : build)
            );
        };
    }

    function simple(data, id, label) {
        var value = $.trim(data[id]);
        if (!value) return null;
        return function () {
            $(this).append(
                $('<dt>').text(label || model.fields[id]),
                $('<dd>').text(value)
            );
        };
    }

    function clickMail(e) {
        e.preventDefault();
        // set recipient and open compose
        ox.registry.call('mail-compose', 'compose', { to: [[e.data.display_name, e.data.email]] });
    }

    function mail(address, name, id) {
        if (!address) return null;
        return function () {
            $(this).append(
                $('<dt>').text(model.fields[id]),
                $('<dd>').append(
                    $('<a>', { href: 'mailto:' + address })
                        .text(_.noI18n(address))
                        .on('click', { email: address, display_name: name }, clickMail)
                )
            );
        };
    }

    function phone(data, id, label) {
        var number = $.trim(data[id]);
        if (!number) return null;
        return function () {
            $(this).append(
                $('<dt>').text(label || model.fields[id]),
                $('<dd>').append(
                    $('<a>', { href: _.device('smartphone') ? 'tel:' + number : 'callto:' + number }).text(number)
                )
            );
        };
    }

    function IM(number, id) {
        number = $.trim(number);
        if (!number) return null;

        var obj = {};

        if (/^skype:/.test(number)) {
            number = number.split('skype:')[1];
            return function () {
                $(this).append(
                    $('<dt>').text('Skype'),
                    $('<dd>').append(
                        $('<a>', { href: 'callto:' + number + '?call' }).text(number)
                    )
                );
            };
        }

        if (/^x-apple:/.test(number)) {
            number = number.split('x-apple:')[1];
            return function () {
                $(this).append(
                    $('<dt>').text('iMessage'),
                    $('<dd>').append(
                        $('<a>', { href: 'imessage://' + number + '@me.com' }).text(number)
                    )
                );
            };
        }

        obj[id] = number;
        return simple(obj, id, gt('Messenger'));
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

        return function () {
            $(this).append(
                $('<a class="google-maps" target="_blank">')
                    .attr('href', 'http://www.google.com/maps?q=' + encodeURIComponent(text.replace(/\n*/, '\n').trim().replace(/\n/g, ', ')))
                    .attr('data-property', type)
                    .append(
                        $('<address>').text($.trim(text)),
                        $('<p>').append(
                            $('<i class="fa fa-external-link">'),
                            // \u2122 = &trade;
                            $.txt(' Google Maps \u2122')
                        )
                    )
            );
        };
    }

    ext.point('io.ox/contacts/detail/content')

        // Contact note/comment
        .extend({
            id: 'comment',
            index: 100,
            draw: function (baton) {

                var comment = $.trim(baton.data.note || '');
                if (comment !== '') {
                    this.append(
                        $('<fieldset>').append(
                            $('<legend class="sr-only">').text(gt('Comment')),
                            _.nltobr(comment, $('<div class="comment">'))
                        )
                    );
                }
            }
        })

        .extend({
            id: 'personal',
            index: 200,
            draw: function (baton) {

                var data = baton.data,
                    fullname = util.getFullName(baton.data);

                this.append(
                    block(gt('Personal'),
                        simple(data, 'title'),
                        simple({ fullname: fullname }, 'name', gt('Name')),
                        simple(data, 'second_name'),
                        simple(data, 'suffix'),
                        simple(data, 'nickname'),
                        row('birthday', function () {
                            if (baton.data.birthday) {
                                //use utc time. birthdays must not be converted
                                var birthday = moment.utc(baton.data.birthday);
                                if (birthday.year() === 1) {
                                    //Year 0 is special for birthdays without year (backend changes this to 1...)
                                    return birthday.format(moment.localeData().longDateFormat('l').replace(/Y/g, ''));
                                } else {
                                    return birthday.format('l');
                                }
                            }
                        }),
                        row('url', function () {
                            if (baton.data.url) {
                                if (baton.data.url.indexOf('http://') !== 0 && baton.data.url.indexOf('https://') !== 0) {
                                    //fix urls
                                    return $('<a>', { href: 'http://' + baton.data.url, target: '_blank' }).text(baton.data.url);
                                } else {
                                    return $('<a>', { href: baton.data.url, target: '_blank' }).text(baton.data.url);
                                }
                            }
                        }),
                        // --- rare ---
                        simple(data, 'marital_status'),
                        simple(data, 'number_of_children'),
                        simple(data, 'spouse_name'),
                        simple(data, 'anniversary')
                    )
                    .attr('data-block', 'personal')
                );
            }
        })

        .extend({
            id: 'job',
            index: 300,
            draw: function (baton) {

                var data = baton.data;

                this.append(
                    block(gt('Job'),
                        simple(data, 'position'),
                        simple(data, 'department'),
                        simple(data, 'profession'),
                        simple(data, 'company'),
                        simple(data, 'room_number'),
                        // --- rare ---
                        simple(data, 'employee_type'),
                        simple(data, 'number_of_employees'),
                        simple(data, 'sales_volume'),
                        simple(data, 'tax_id'),
                        simple(data, 'commercial_register'),
                        simple(data, 'branches'),
                        simple(data, 'business_category'),
                        simple(data, 'info'),
                        simple(data, 'manager_name'),
                        simple(data, 'assistant_name')
                    )
                    .attr('data-block', 'job')
                );
            }
        })

        .extend({
            id: 'messaging',
            index: 400,
            draw: function (baton) {

                var data = baton.data,
                    fullname = util.getFullName(data),
                    addresses = _([data.email1, data.email2, data.email3])
                        .chain()
                        .map(function (address) {
                            return $.trim(address).toLowerCase();
                        })
                        .value();

                this.append(
                    block(gt('Mail and Messaging'),
                        mail(addresses[0], fullname, 'email1'),
                        mail(addresses[1], fullname, 'email2'),
                        mail(addresses[2], fullname, 'email3'),
                        IM(data.instant_messenger1, 'instant_messenger1'),
                        IM(data.instant_messenger2, 'instant_messenger2')
                    )
                    .attr('data-block', 'messaging')
                );
            }
        })

        .extend({
            id: 'phone',
            index: 500,
            draw: function (baton) {

                var data = baton.data;

                this.append(
                    block(gt('Phone numbers'),
                        phone(data, 'cellular_telephone1'),
                        phone(data, 'cellular_telephone2'),
                        phone(data, 'telephone_business1'),
                        phone(data, 'telephone_business2'),
                        phone(data, 'telephone_home1'),
                        phone(data, 'telephone_home2'),
                        phone(data, 'telephone_other'),
                        simple(data, 'fax_business'),
                        simple(data, 'fax_home'),
                        simple(data, 'fax_other'),
                        // --- rare ---
                        phone(data, 'telephone_company'),
                        phone(data, 'telephone_car'),
                        phone(data, 'telephone_isdn'),
                        phone(data, 'telephone_pager'),
                        phone(data, 'telephone_primary'),
                        phone(data, 'telephone_radio'),
                        phone(data, 'telephone_telex'),
                        phone(data, 'telephone_ttytdd'),
                        phone(data, 'telephone_ip'),
                        phone(data, 'telephone_assistant'),
                        phone(data, 'telephone_callback')
                    )
                    .attr('data-block', 'phone')
                );
            }
        })

        .extend({
            id: 'business-address',
            index: 600,
            draw: function (baton) {

                var data = baton.data;

                this.append(
                    block(
                        gt('Business Address'),
                        address(data, 'business'),
                        true
                    )
                    .attr('data-block', 'business-address')
                );
            }
        })

        .extend({
            id: 'home-address',
            index: 700,
            draw: function (baton) {

                var data = baton.data;

                this.append(
                    block(
                        gt('Home Address'),
                        address(data, 'home'),
                        true
                    )
                    .attr('data-block', 'home-address')
                );
            }
        })

        .extend({
            id: 'other-address',
            index: 800,
            draw: function (baton) {

                var data = baton.data;

                this.append(
                    block(
                        gt('Other Address'),
                        address(data, 'other'),
                        true
                    )
                    .attr('data-block', 'other-address')
                );
            }
        })

        .extend({
            id: 'misc',
            index: 900,
            draw: function (baton) {

                var data = baton.data;

                this.append(
                    block(
                        //#. section name for contact fields in detail view
                        gt('Miscellaneous'),
                        // looks stupid but actually easier to read and not much shorter than any smart-ass solution
                        simple(data, 'userfield01'),
                        simple(data, 'userfield02'),
                        simple(data, 'userfield03'),
                        simple(data, 'userfield04'),
                        simple(data, 'userfield05'),
                        simple(data, 'userfield06'),
                        simple(data, 'userfield07'),
                        simple(data, 'userfield08'),
                        simple(data, 'userfield09'),
                        simple(data, 'userfield10'),
                        simple(data, 'userfield11'),
                        simple(data, 'userfield12'),
                        simple(data, 'userfield13'),
                        simple(data, 'userfield14'),
                        simple(data, 'userfield15'),
                        simple(data, 'userfield16'),
                        simple(data, 'userfield17'),
                        simple(data, 'userfield18'),
                        simple(data, 'userfield19'),
                        simple(data, 'userfield20')
                    )
                    .attr('data-block', 'misc')
                );
            }
        });

    // Resource description
    // only applies to resource because they have a "description" field.
    // contacts just have a "note"

    var regPhone = /(\+?[\d\x20\/()]{4,})/g,
        regClean = /[^+0-9]/g;

    ext.point('io.ox/contacts/detail/content').extend({
        index: 1000000000000,
        id: 'description',
        draw: function (baton) {

            var str = $.trim(baton.data.description || ''), isHTML;
            if (str !== '') {

                isHTML = looksLikeHTML(str);

                // find phone numbers & links
                str = str.replace(regPhone, function (match) {
                    var number = match.replace(regClean, '');
                    return '<a href="callto:' + number + '">' + match + '</a>';
                });

                // fix missing newlines
                if (!isHTML) {
                    str = str.replace(/\n/g, '<br>');
                }

                this.append(
                    $('<div class="description">').append(
                        $('<div>').html(str),
                        // add callback?
                        baton.data.callbacks && 'extendDescription' in baton.data.callbacks ?
                            $('<a href="#">').text(gt('Copy to description'))
                            .on('click', { description: $('<div>').html(str.replace(/[ \t]+/g, ' ').replace(/<br>/g, '\n')).text() }, baton.data.callbacks.extendDescription)
                            : []
                    )
                );
            }
        }
    });

    ext.point('io.ox/contacts/detail').extend({
        index: 1000000000000,
        id: 'breadcrumb',
        draw: function (baton) {

            var id = baton.data.folder_id;

            // this is also used by halo, so we might miss a folder id
            if (!id) return;

            // don't show folders path for folder 6 if global address book is disabled
            if (String(id) === '6' && !capabilities.has('gab')) return;

            this.append(
                $('<div class="clearfix">'),
                new BreadcrumbView({ folder: id, app: baton.app, label: gt('Saved in:') }).render().$el
            );
        }
    });

    function redraw(e, data) {
        var baton = e.data.baton;
        //use old baton with new data(keep disabled extensionpoints)
        baton.data = data;
        $(this).replaceWith(e.data.view.draw(baton));
    }

    return {

        draw: function (baton) {

            if (!baton) return $('<div>');

            try {

                // make sure we have a baton
                baton = ext.Baton.ensure(baton);

                var node = $.createViewContainer(baton.data, api)
                    .on('redraw', { view: this, data: baton.data, baton: baton }, redraw)
                    .addClass('contact-detail view')
                    .attr({
                        'role': 'complementary',
                        'aria-label': gt('Contact Details')
                    });
                ext.point('io.ox/contacts/detail').invoke('draw', node, baton);

                return node;

            } catch (e) {
                console.error('io.ox/contacts/view-detail:draw()', e);
            }
        }
    };
});
