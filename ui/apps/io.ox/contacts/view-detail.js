/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
    'io.ox/core/util',
    'io.ox/core/capabilities',
    'gettext!io.ox/contacts',
    'settings!io.ox/contacts',
    'io.ox/core/tk/attachments',
    'io.ox/core/http',
    'io.ox/core/locale/postal-address',
    'io.ox/backbone/views/actions/util',
    'io.ox/backbone/views/toolbar',
    'io.ox/backbone/views/action-dropdown',
    'static/3rd.party/purify.min.js',
    'less!io.ox/contacts/style'
], function (ext, util, api, actions, model, pViews, pModel, BreadcrumbView, coreUtil, capabilities, gt, settings, attachments, http, postalAddress, actionsUtil, ToolbarView, ActionDropdownView, DOMPurify) {

    'use strict';

    // smart join
    // var join = function () {
    //     return _(arguments)
    //         .select(function (obj, i) {
    //             return i > 0 && !!obj;
    //         })
    //         .join(arguments[0] || '');
    // };

    // function getDescription(data) {

    //     function single(index, value) {
    //         var params = new Array(index);
    //         params[index - 1] = value;
    //         return { format: '%' + index + '$s', params: params };
    //     }

    //     var count, desc;

    //     if (api.looksLikeDistributionList(data)) {
    //         count = data.number_of_distribution_list;
    //         //#. %1$d is a number of members in distribution list
    //         desc = count === 0 ?
    //             gt('Distribution list') :
    //             gt.ngettext('Distribution list with %1$d entry', 'Distribution list with %1$d entries', count, count);
    //         return single(7, desc, true);
    //     }

    //     if (api.looksLikeResource(data)) {
    //         return single(7, gt('Resource'), true);
    //     }

    //     if (data.position || data.profession) {
    //         return {
    //             format: join(', ', data.position ? '%1$s' : '', data.profession ? '%2$s' : ''),
    //             params: [data.position, data.profession]
    //         };
    //     }

    //     return util.getMailFormat(data);
    // }

    function hideAddressBook() {
        return !ox.ui.apps.get('io.ox/contacts');
    }

    // function createText(format, classes) {
    //     return _.aprintf(
    //         format.format,
    //         function (index) {
    //             return $('<span>').addClass(classes[index]).text(format.params[index]);
    //         },
    //         function (text) {
    //             return $.txt(text);
    //         }
    //     );
    // }

    // function buildDropdown(container, title, data) {
    //     var dropdown = new ActionDropdownView({ point: 'io.ox/core/tk/attachment/links', data: data, title: title });
    //     container.append(dropdown.$el);
    // }

    /*
     * Extensions
     */

    var INDEX = 100;

    ext.point('io.ox/contacts/detail').extend({
        index: (INDEX += 100),
        id: 'inline-actions',
        draw: function (baton) {
            if (api.looksLikeResource(baton.data)) return;
            if (hideAddressBook()) return;
            this.append(
                new ToolbarView({ point: 'io.ox/contacts/links/inline', inline: true })
                .setSelection(baton.array(), { data: baton.array() })
                .$el
            );
        }
    });

    ext.point('io.ox/contacts/detail').extend({
        index: (INDEX += 100),
        id: 'contact-header',
        draw: function (baton) {

            if (baton.data.mark_as_distributionlist) return;

            var $photo = $('<dt>');
            ext.point('io.ox/contacts/detail/photo').invoke('draw', $photo, baton);

            var $summary = $('<dd class="contact-summary">');
            ext.point('io.ox/contacts/detail/summary').invoke('draw', $summary, baton);

            this.append(
                // we use a definition list here to get exactily the same layout
                $('<dl class="dl-horizontal contact-header">').append($photo, $summary)
            );
        }
    });

    ext.point('io.ox/contacts/detail').extend({
        index: (INDEX += 100),
        id: 'list-header',
        draw: function (baton) {

            if (!baton.data.mark_as_distributionlist) return;

            var count = baton.data.number_of_distribution_list,
                desc = count === 0 ?
                    gt('Distribution list') :
                    //#. %1$d is a number of members in distribution list
                    gt.ngettext('Distribution list with %1$d entry', 'Distribution list with %1$d entries', count, count);

            this.addClass('distribution-list').append(
                $('<div class="contact-header">').append(
                    $('<h1 class="fullname">').text(util.getFullName(baton.data)),
                    $('<h2>').text(desc)
                )
            );
        }
    });

    // Contact Photo

    ext.point('io.ox/contacts/detail/photo').extend({
        draw: function (baton) {
            this.append(api.getContactPhoto(baton.data, { size: 120 }));
        }
    });

    // Contact Summary
    var countryFlag = settings.get('features/countryFlag', false),
        flags = {
            US: '\uD83C\uDDFA\uD83C\uDDF8',
            GB: '\uD83C\uDDEC\uD83C\uDDE7',
            DE: '\uD83C\uDDE9\uD83C\uDDEA',
            FR: '\uD83C\uDDEB\uD83C\uDDF7',
            ES: '\uD83C\uDDEA\uD83C\uDDF8',
            IT: '\uD83C\uDDEE\uD83C\uDDF9',
            NL: '\uD83C\uDDF3\uD83C\uDDF1',
            FI: '\uD83C\uDDEB\uD83C\uDDEE',
            JP: '\uD83C\uDDEF\uD83C\uDDF5',
            AT: '\uD83C\uDDE6\uD83C\uDDF9',
            CH: '\uD83C\uDDE8\uD83C\uDDED',
            BE: '\uD83C\uDDE7\uD83C\uDDEA'
        };

    ext.point('io.ox/contacts/detail/summary').extend(
        {
            index: 100,
            id: 'fullname',
            draw: function (baton) {
                var options = { html: util.getFullNameWithFurigana(baton.data), tagName: 'h1 class="fullname"' },
                    node = coreUtil.renderPersonalName(options, baton.data);
                // a11y: headings must not be empty
                if (!node.text()) return;
                this.append(node);
            }
        },
        {
            index: 110,
            id: 'flag',
            draw: function (baton) {
                if (!countryFlag) return;
                if (_.device('smartphone')) return;
                var country = baton.data.country_home || baton.data.country_business;
                if (!country) return;
                var flag = flags[postalAddress.getCountryCode(country)];
                if (!flag) return;
                // h1.fullname maybe missing (a11y: headings must not be empty)
                this.find('h1.fullname').append($.txt(' ' + flag));
            }
        },
        {
            index: 120,
            id: 'private_flag',
            draw: function (baton) {
                if (_.device('smartphone') || !baton.data.private_flag) return;
                this.find('h1.fullname').append($('<div class="sr-only">').attr('aria-label', gt('Private contact')), $('<i class="fa fa-lock private-flag" aria-hidden="true">').attr('title', gt('Private')));
            }
        },
        {
            index: 200,
            id: 'business',
            draw: function (baton) {
                var value = util.getSummaryBusiness(baton.data);
                if (!value) return;
                // a11y: headings must not be empty
                this.append(
                    $('<h2 class="business hidden-xs">').text(value)
                );
            }
        },
        {
            index: 300,
            id: 'location',
            draw: function (baton) {
                var value = util.getSummaryLocation(baton.data);
                if (!value) return;
                // a11y: headings must not be empty
                this.append(
                    $('<h2 class="location hidden-xs">').text(value)
                );
            }
        }
    );

    // var name =

    // var job = createText(getDescription(baton.data), ['position', 'profession', 'type']),
    //     company = $.trim(baton.data.company),
    //     container;

    // this.append(
    //     $('<div class="next-to-picture">').append(
    //         // right side
    //         $('<i class="fa fa-lock private-flag" aria-hidden="true">').attr('title', gt('Private')).hide(),
    //         name.children().length ? name.addClass('header-name') : [],
    //         company ? $('<h2 class="header-company">').append($('<span class="company">').text(company)) : [],
    //         job.length ? $('<h2 class="header-job">').append(job) : [],
    //         container = $('<section class="attachments-container clear-both">')
    //             .hide()
    //     )
    // );

    // if (baton.data.private_flag) {
    //     this.find('.private-flag').show();
    // }

    // if (api.uploadInProgress(_.ecid(baton.data))) {
    //     var progressview = new attachments.progressView({ cid: _.ecid(baton.data) });
    //     container.append(progressview.render().$el).show();
    // } else if (baton.data.number_of_attachments > 0) {
    //     ext.point('io.ox/contacts/detail/attachments').invoke('draw', container, baton.data);
    // }

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
                    halo: true,
                    isMail: true,
                    // forces the use of the correct mailfield (disables fallback). User is no longer misslead by the ui showing a mail address, that is not used by this distributionlist
                    strict: true
                }).render().$el
            );
        }
    });

    ext.point('io.ox/contacts/detail/list').extend({

        draw: function (baton) {

            var list = _.copy(baton.data.distribution_list || [], true),
                count = list.length,
                hash = {}, $list,
                offset = 0,
                limit = baton.options.limit || 100;
            this.append(
                count === 0 ? $('<div class="list-count">').text(gt('This list has no members yet')) : $(),
                $list = $('<ul class="member-list list-unstyled">')
            );

            if (!count) return;

            // remove duplicates to fix backend bug
            var filteredList = _(list)
            .chain()
            .filter(function (member) {
                if (hash[member.display_name + '_' + member.mail]) return false;
                return (hash[member.display_name + '_' + member.mail] = true);
            });

            // need the rightside div, to register the scroll handler correctly
            var $right = baton.app.right.parent();

            var onScroll = _.debounce(function (e) {
                // ignore lazy load scroll event triggered by contact images
                if (typeof e.originalEvent === 'undefined') return;
                var height = $right.outerHeight(),
                    scrollTop = $right[0].scrollTop,
                    scrollHeight = $right[0].scrollHeight,
                    bottom = scrollTop + height;

                if (bottom / scrollHeight < 0.80) return;
                var defer = window.requestAnimationFrame || window.setTimeout;
                defer(function renderMoreItems() {
                    offset = offset + limit;
                    render();
                });
            }, 50);

            function render() {
                if (count < offset) $right.off('scroll', onScroll);
                // force contacts?ation=search into multiple
                var list = filteredList.slice(offset, offset + limit);

                list.forEach(function (member) {
                    ext.point('io.ox/contacts/detail/member').invoke('draw', $list, member);
                });
            }

            render();
            $right.on('scroll', onScroll);
        }
    });

    function block() {

        var rows = _(arguments).compact(),
            block = $('<section class="block">'),
            dl = $('<dl class="dl-horizontal">');

        // if block empty
        if (rows.length < 1) return $();

        _.each(rows, function (row) {
            dl.append(row);
        });

        return block.append(dl);
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
        if (capabilities.has('webmail')) {
            e.preventDefault();
            // set recipient and open compose
            ox.registry.call('mail-compose', 'open', { to: [[e.data.display_name, e.data.email]] });
        }
    }

    function mail(address, name, id) {
        if (!address) return null;
        return function () {
            $(this).append(
                $('<dt>').text(model.fields[id]),
                $('<dd>').append(
                    $('<a>').attr('href', 'mailto:' + address).text(address)
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
                    $('<a>').attr({
                        href: _.device('smartphone') ? 'tel:' + number : 'callto:' + number,
                        'aria-label': label || model.fields[id]
                    }).text(number)
                )
            );
        };
    }

    function note(data) {
        var text = $.trim(data.note);
        if (!text) return null;
        return function () {
            $(this).append(
                $('<dt>').text(model.fields.note),
                _.nltobr(text, $('<dd class="note">'))
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

        var text = postalAddress.format(data, type);
        if (!text) return null;

        var services = {
            google: { label: gt('Google Maps'), url: 'https://www.google.com/maps?q=' },
            osm: { label: gt('Open Street Map'), url: 'https://www.openstreetmap.org/search?query=' },
            apple: { label: gt('Apple Maps'), url: 'https://maps.apple.com/?q=' }
        };

        var i18n = {
            home: gt('Home address'),
            business: gt('Business address'),
            other: gt('Other address')
        };

        return function () {

            var address = $('<address>').attr('data-property', type).text($.trim(text)),
                service = settings.get('mapService', 'google'),
                dd = $('<dd>').append(address);

            $(this).append($('<dt>').text(i18n[type]), dd);

            // Apple Maps only works on iOS and MacOS
            if (service === 'apple' && !_.device('ios || macos')) service = 'none';
            if (service === 'none') return $(this);

            var query = encodeURIComponent(text.replace(/\n*/, '\n').trim().replace(/\n/g, ', '));

            dd.append(
                $('<a class="maps-service" target="_blank" rel="noopener">')
                .attr('href', services[service].url + query)
                .append(
                    $('<i class="fa fa-external-link" aria-hidden="true">'),
                    //#. %1$s is a map service, like "Google Maps"
                    $.txt(' ' + gt('Open in %1$s', services[service].label))
                )
            );
        };
    }

    function attachmentlist(label, list) {

        function dropdown(data, label) {
            return new ActionDropdownView({
                point: 'io.ox/core/tk/attachment/links',
                data: data,
                title: data.filename || label
            }).$el;
        }

        return function () {
            $(this).append(
                $('<dt>').text(label),
                $('<dd>').append(function () {
                    var nodes = _.map(list, dropdown);
                    // if more than one attachment add "All Downloads" dropdown
                    return list.length < 2 ? nodes : nodes.concat(dropdown(list, gt('All attachments')));
                })
            );
        };
    }

    ext.point('io.ox/contacts/detail/content')

        .extend({
            id: 'personal',
            index: 200,
            draw: function (baton) {

                var data = baton.data;

                this.append(
                    block(
                        simple(data, 'title'),
                        simple(data, 'second_name'),
                        simple(data, 'nickname'),
                        simple(data, 'suffix'),
                        row('birthday', function () {
                            // check if null, undefined, empty string
                            // 0 is valid (1.1.1970)
                            if (!_.isNumber(baton.data.birthday)) return;
                            return util.getBirthday(baton.data.birthday, true);
                        }),
                        row('url', function () {
                            var url = $.trim(baton.data.url);
                            if (!url) return;
                            if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
                            var node = $('<a target="_blank" rel="noopener">').attr('href', encodeURI(decodeURI(url))).text(url);
                            return DOMPurify.sanitize(node.get(0), { ALLOW_TAGS: ['a'], ADD_ATTR: ['target'], RETURN_DOM_FRAGMENT: true });
                        }),
                        // --- rare ---
                        simple(data, 'marital_status'),
                        simple(data, 'number_of_children'),
                        simple(data, 'spouse_name'),
                        row('anniversary', function () {
                            // check if null, undefined, empty string
                            // 0 is valid (1.1.1970)
                            if (_.isNumber(baton.data.anniversary)) {
                                // use same mechanic as with birthdays
                                return util.getBirthday(baton.data.anniversary);
                            }
                        })
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
                    block(
                        simple(data, 'company'),
                        simple(data, 'department'),
                        simple(data, 'position'),
                        simple(data, 'profession'),
                        simple(data, 'room_number'),
                        simple(data, 'manager_name'),
                        simple(data, 'assistant_name'),
                        // --- rare ---
                        simple(data, 'employee_type'),
                        simple(data, 'number_of_employees'),
                        simple(data, 'sales_volume'),
                        simple(data, 'tax_id'),
                        simple(data, 'commercial_register'),
                        simple(data, 'branches'),
                        simple(data, 'business_category'),
                        simple(data, 'info')
                    )
                    .attr('data-block', 'job')
                );
            }
        })

        .extend({
            id: 'communication',
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
                    block(
                        mail(addresses[0], fullname, 'email1'),
                        mail(addresses[1], fullname, 'email2'),
                        mail(addresses[2], fullname, 'email3'),
                        IM(data.instant_messenger1, 'instant_messenger1'),
                        IM(data.instant_messenger2, 'instant_messenger2'),
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
                    .attr('data-block', 'communication')
                );
            }
        })

        .extend({
            id: 'home-address',
            index: 600,
            draw: function (baton) {
                this.append(
                    block(
                        address(baton.data, 'home')
                    )
                    .attr('data-block', 'home-address')
                );
            }
        })

        .extend({
            id: 'business-address',
            index: 700,
            draw: function (baton) {
                this.append(
                    block(
                        address(baton.data, 'business')
                    )
                    .attr('data-block', 'business-address')
                );
            }
        })

        .extend({
            id: 'other-address',
            index: 800,
            draw: function (baton) {
                this.append(
                    block(
                        address(baton.data, 'other')
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
                        note(data, 'note'),
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
        })

        .extend({
            id: 'attachments',
            index: 1000,
            draw: function (baton) {
                // TODO: add proper contact model update after attachment api calls
                if (!baton.data.number_of_attachments) return;
                if (baton.data.mark_as_distributionlist) return;

                var section = $('<section class="block hidden">'),
                    hasPendingAttachments = !!api.pendingAttachments[_.ecid(baton.data)];

                if (hasPendingAttachments) {
                    var progressview = new attachments.progressView({ cid: _.ecid(baton.data) });
                    return this.append(progressview.render().$el).show();
                }

                require(['io.ox/core/api/attachment'], function (api) {

                    function get() {
                        // this request might take a while; not cached
                        api.getAll({ folder_id: baton.data.folder_id, id: baton.data.id, module: 7 }).then(success, fail);
                    }

                    function success(list) {
                        if (!list.length) return section.remove();

                        _(list).each(function (attachment) {
                            // cut off prefix con://0/ because document converter can only handle old folder ids atm
                            attachment.folder = attachment.folder.split('/');
                            // just take the last part
                            attachment.folder = attachment.folder[attachment.folder.length - 1];
                        });

                        section.replaceWith(
                            block(
                                attachmentlist(gt('Attachments'), list)
                            )
                            .addClass('contains-dropdown')
                            .attr('data-block', 'attachments')
                        );
                    }

                    function fail() {
                        section.show().append(
                            $.fail(gt('Could not load attachments for this contact.'), get)
                        );
                    }

                    get();
                });

                this.append(section);
            }
        });

    // Resource description
    // only applies to resource because they have a "description" field.
    // contacts just have a "note"

    // this matches phone numbers in 4 cases:
    // string has phone number with empty space in front of it and after it
    // string has starts with phone number and has an empty space after it
    // string ends with phone number and has an empty space in front of it
    // string starts and ends with phone number
    // what we don't want is match numbers inside links for example: http://some.service.com/begin?123456?pwd=7890
    var regPhone = /(^|\s+)(\+?[\d\x20/()]{4,})($|\s+)/g,
        regClean = /[^+0-9]/g;

    ext.point('io.ox/contacts/detail/content').extend({
        index: 1000000000000,
        id: 'description',
        draw: function (baton) {

            var str = _.escape($.trim(baton.data.description || ''));
            if (str === '') return;

            // find phone numbers & links
            str = str.replace(regPhone, function (match) {
                var number = match.replace(regClean, '');
                // check if we have an empty match after cleaning. We want to avoid phone numbers like (((( etc
                if (number.length === 0) return match;

                return '<a href="callto:' + number + '">' + match + '</a>';
            });

            str = coreUtil.urlify(str);

            // fix missing newlines
            str = str.replace(/\n/g, '<br>');

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
    });

    ext.point('io.ox/contacts/detail').extend({
        index: 1000000000000,
        id: 'breadcrumb',
        draw: function (baton) {

            var id = baton.data.folder_id;

            // this is also used by halo, so we might miss a folder id
            if (!id) return;
            if (hideAddressBook()) return;

            // don't show folders path for folder 6 if global address book is disabled
            if (String(id) === util.getGabId() && !capabilities.has('gab')) return;

            this.append(
                $('<div class="clearfix">'),
                new BreadcrumbView({ folder: id, app: baton.app, display: 'block', label: gt('Saved in:'), disable: ['2', '3'] }).render().$el
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
                        'role': 'region',
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
