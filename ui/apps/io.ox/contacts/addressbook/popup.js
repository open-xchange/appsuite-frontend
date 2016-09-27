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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/addressbook/popup', [
    'io.ox/core/http',
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/tk/list',
    'io.ox/core/extensions',
    'io.ox/contacts/util',
    'io.ox/contacts/api',
    'gettext!io.ox/contacts',
    'settings!io.ox/contacts',
    'settings!io.ox/mail',
    'less!io.ox/contacts/addressbook/style'
], function (http, folderAPI, ModalDialog, ListView, ext, util, api, gt, settings, mailSettings) {

    'use strict';

    var names = 'last_name first_name display_name'.split(' '),
        addresses = 'email1 email2 email3'.split(' ');

    // limits
    var LIMITS = {
        fetch: settings.get('picker/limits/fetch', 10000),
        render: settings.get('picker/limits/list', 100),
        search: settings.get('picker/limits/search', 50),
        more: settings.get('picker/limits/more', 100),
        labels: settings.get('picker/limits/labels', 1000)
    };

    // special folder id
    var collected_id = mailSettings.get('contactCollectFolder', 0);

    // split words
    var regSplitWords = /[\s,.\-:;\<\>\(\)\_\@\/\'\"]/;

    // feature toggles
    var useInitials = settings.get('picker/useInitials', true),
        useInitialsColor = useInitials && settings.get('picker/useInitialsColor', true),
        useLabels = settings.get('picker/useLabels', false);

    //
    // Build a search index
    //

    var buildIndex = (function () {

        var fields = names.concat('email');

        return function (list) {
            var index = {};
            list.forEach(function (item) {
                var words = getWords(item);
                firstLevel(index, words, item.cid);
            });
            return index;
        };

        function getWords(item) {
            var words = [];
            fields.forEach(function (name) {
                var value = item[name];
                if (typeof value === 'string' && value.length) words.push(value);
            });
            return words.join(' ').toLowerCase().split(regSplitWords);
        }

        function firstLevel(index, words, id) {
            // first char
            words.forEach(function (word) {
                var key = word.substr(0, 1), node;
                if (!key) return;
                node = (index[key] = index[key] || {});
                secondLevel(node, word, id);
            });
        }

        function secondLevel(index, word, id) {
            var key = word.substr(0, 2),
                node = (index[key] = index[key] || {});
            thirdLevel(node, word, id);
        }

        function thirdLevel(index, word, id) {
            var node = (index[word] = index[word] || {});
            node[id] = true;
        }

    }());

    //
    // Search index
    //

    var searchIndex = (function () {

        function traverse(index, query, level) {

            var part = query.substr(0, level);

            return _(index).reduce(function (array, node, word) {
                if (level <= 2) {
                    // recursion until third level; check partial query
                    return word.indexOf(part) === 0 ?
                        array.concat(traverse(node, query, level + 1)) : array;
                }
                // leaf node; return IDs
                return word.indexOf(query) === 0 ?
                    array.concat(_(node).keys()) : array;
            }, []);
        }

        return function (index, query) {
            // query must be string
            if (typeof query !== 'string' || !query.length) return [];
            // ensure lowercase
            query = query.toLowerCase();
            // traverse over index
            return _(traverse(index, query, 1).sort()).uniq(true);
        };

    }());

    //
    // Get all mail addresses (except collected addresses)
    //

    var getAllMailAddresses = (function () {

        return function (options) {
            return $.when(
                fetchAddresses(options),
                useLabels ? fetchLabels() : $.when()
            )
            .then(function (contacts, labels) {
                var result = [], hash = {};
                processAddresses(contacts[0], result, hash);
                if (useLabels) processLabels(labels[0], result, hash);
                return { items: result, hash: hash, index: buildIndex(result) };
            });
        };

        function fetchAddresses(options) {

            options = _.extend({
                // keep this list really small for good performance!
                columns: '1,20,500,501,502,505,555,556,557,592,602,606',
                limit: LIMITS.fetch
            }, options);

            if (options.folder === 'all') delete options.folder;

            return http.PUT({
                module: 'contacts',
                params: {
                    action: 'search',
                    columns: options.columns,
                    right_hand_limit: options.limit,
                    sort: 609
                },
                // emailAutoComplete doesn't work; need to clean up client-side anyway
                data: { last_name: '*' }
            });
        }

        function fetchLabels() {
            return http.GET({
                module: 'labels',
                params: {
                    action: 'all',
                    module: 'contacts',
                    members: true,
                    start: 0,
                    limit: LIMITS.labels
                }
            });
        }

        function processAddresses(list, result, hash) {

            list.forEach(function (item) {
                // remove quotes from display name (common in collected addresses)
                item.display_name = getDisplayName(item.display_name);
                // get sort name
                var sort_name = [], address;
                names.forEach(function (name) {
                    if (item[name]) sort_name.push(item[name]);
                });
                // distribution list?
                if (item.mark_as_distributionlist) {
                    // get a match for the entire list
                    address = _(item.distribution_list)
                        .map(function (obj) {
                            // mail address only
                            return $.trim(obj.mail).toLowerCase();
                        })
                        .join(', ');
                    // overwrite last name to get a nicer full name
                    item.last_name = item.display_name;
                    var obj = process(item, sort_name, address, 0);
                    if (obj) {
                        obj.full_name_html += ' <span class="gray">' + gt('Distribution list') + '</span>';
                        result.push((hash[obj.cid] = obj));
                    }
                } else {
                    // get a match for each address
                    addresses.forEach(function (address, i) {
                        var obj = process(item, sort_name, (item[address] || '').toLowerCase(), i);
                        if (obj) result.push((hash[obj.cid] = obj));
                    });
                }
            });
            return { items: result, hash: hash, index: buildIndex(result) };
        }

        function process(item, sort_name, address, i) {
            // skip if empty
            address = $.trim(address);
            if (!address) return;
            // drop no-reply addresses
            if (/^(noreply|no-reply|do-not-reply)@/.test(address)) return;
            // drop broken imports
            if (/^\=\?iso\-8859\-1\?q\?\=22/i.test(item.display_name)) return;
            // add to results
            // do all calculations now; during rendering is more expensive
            var initials = util.getInitials(item);
            return {
                cid: item.folder_id + '.' + item.id + '.' + i,
                display_name: item.display_name,
                email: address,
                first_name: item.first_name,
                folder_id: String(item.folder_id),
                full_name: util.getFullName(item).toLowerCase(),
                full_name_html: util.getFullName(item, true),
                image: util.getImage(item) || (!useInitials && api.getFallbackImage()),
                id: String(item.id),
                initials: useInitials && initials,
                initial_color: util.getInitialsColor(useInitialsColor && initials),
                last_name: item.last_name,
                list: item.mark_as_distributionlist ? item.distribution_list : false,
                mail_full_name: util.getMailFullName(item),
                // all lower-case to be case-insensitive; replace spaces to better match server-side collation
                sort_name: sort_name.concat(address).join('_').toLowerCase().replace(/\s/g, '_'),
                title: item.title
            };
        }

        function getDisplayName(str) {
            return $.trim(str).replace(/^["']+|["']+$/g, '');
        }

        function processLabels(list, result, hash) {

            list.forEach(function (item, i) {

                if (!item.members || !item.members.length) return;

                item.display_name = String(item.title);

                // translate into array of object
                item.members = _(item.members).map(function (data) {
                    return {
                        display_name: util.getMailFullName(data),
                        id: data.id,
                        folder_id: data.folder_id,
                        email: $.trim(data.email1 || data.email2 || data.email3).toLowerCase()
                    };
                });

                item = {
                    caption: _(item.members).pluck('display_name').join(', '),
                    cid: 'label.' + item.id + '.' + i,
                    display_name: item.display_name,
                    email: _(item.members).pluck('email').join(', '),
                    first_name: '',
                    folder_id: 'label',
                    full_name: util.getFullName(item).toLowerCase(),
                    full_name_html: util.getFullName(item, true),
                    image: '',
                    id: String(item.id),
                    initials: '',
                    initial_color: '',
                    label: item.members,
                    last_name: '',
                    mail_full_name: util.getMailFullName(item),
                    // all lower-case to be case-insensitive; replace spaces to better match server-side collation
                    sort_name: item.display_name.toLowerCase().replace(/\s/g, '_'),
                    title: item.title
                };
                result.push((hash[item.cid] = item));
            });
        }

    }());

    //
    // Sorter for use_count and sort_name
    //
    function sorter(a, b) {
        if (a.list && !b.list) return +1;
        if (b.list && !a.list) return -1;
        // asc with locale compare
        return a.sort_name.localeCompare(b.sort_name);
    }

    //
    // Match all words
    //
    function matchAllWords(list, words) {
        if (_.isEmpty(words)) return list;
        return _(list).filter(function (item) {
            return _(words).every(function (word) {
                return item.full_name.indexOf(word) > -1 || item.email.indexOf(word) > -1;
            });
        });
    }

    //
    // Open dialog
    //

    var isOpen = false, cachedResponse = null, folder = 'all', appeared = {};

    // clear cache on address book changes
    api.on('create update delete', function () {
        cachedResponse = null;
    });

    var sections = {
        'private': gt('My address books'),
        'public':  gt('Public address books'),
        'shared':  gt('Shared address books')
    };

    function open(callback) {
        // avoid parallel popups
        if (isOpen) return;
        isOpen = true;

        return new ModalDialog({
            enter: false,
            focus: '.search-field',
            invokeWithView: true,
            maximize: 600,
            point: 'io.ox/contacts/addressbook-popup',
            title: gt('Select contacts')
        })
        .extend({
            addClass: function () {
                this.$el.addClass('addressbook-popup');
            },
            header: function () {

                var view = this;

                this.$('.modal-header').append(
                    $('<div class="row">').append(
                        $('<div class="col-xs-6">').append(
                            $('<input type="text" class="form-control search-field" tabindex="1">')
                            .attr('placeholder', gt('Search'))
                        ),
                        $('<div class="col-xs-6">').append(
                            $('<select class="form-control folder-dropdown invisible" tabindex="1">').append(
                                $('<option value="all">').text(gt('All contacts')),
                                $('<option value="all_lists">').text(gt('All distribution lists')),
                                useLabels ? $('<option value="all_labels">').text(gt('All groups')) : $()
                            )
                        )
                    )
                );

                // fill folder drop-down
                var $dropdown = this.$('.folder-dropdown');
                folderAPI.flat({ module: 'contacts' }).done(function (folders) {
                    var count = 0;
                    $dropdown.append(
                        _(folders).map(function (section, id) {
                            // skip empty and (strange) almost empty folders
                            if (!sections[id] || !section.length) return $();
                            if (!section[0].id && !section[0].title) return $();
                            return $('<optgroup>').attr('label', sections[id]).append(
                                _(section).map(function (folder) {
                                    count++;
                                    return $('<option>').val(folder.id).text(folder.title);
                                })
                            );
                        })
                    );
                    if (count > 1) $dropdown.removeClass('invisible');
                });

                this.folder = folder;

                this.$('.folder-dropdown').val(folder).on('change', function () {
                    view.folder = folder = $(this).val() || 'all';
                    view.lastJSON = null;
                    view.search(view.$('.search-field').val());
                });
            },
            list: function () {
                // we just use a ListView to get its selection support
                // the collection is just a dummy; rendering is done
                // via templates to have maximum performance for
                // the find-as-you-type feature
                this.listView = new ListView({
                    collection: new Backbone.Collection(),
                    pagination: false,
                    ref: 'io.ox/contacts/addressbook-popup/list',
                    selection: { behavior: 'simple' }
                });
                this.$body.append(this.listView.render().$el);
            },
            footer: function () {
                this.$('.modal-footer').prepend(
                    $('<div class="selection-summary">').hide()
                );
            },
            onOpen: function () {

                // hide body initially / add busy animation
                this.busy(true);

                function success(response) {
                    if (this.disposed) return;
                    cachedResponse = response;
                    this.items = response.items.sort(sorter);
                    this.hash = response.hash;
                    this.index = response.index;
                    this.search('');
                    this.idle();
                }

                function fail(e) {
                    // remove animation but block form
                    if (this.disposed) return;
                    this.idle().disableFormElements();
                    this.trigger('error', e);
                }

                this.on('open', function () {
                    _.defer(function () {
                        if (cachedResponse) return success.call(this, cachedResponse);
                        getAllMailAddresses().then(success.bind(this), fail.bind(this));
                    }.bind(this));
                });
            },
            search: function () {

                this.search = function (query) {
                    var result, isSearch = query.length && query !== '@';
                    if (isSearch) {
                        // split query into single words (without leading @; covers edge-case)
                        var words = query.replace(/^@/, '').split(regSplitWords), firstWord = words[0];
                        // use first word for the index-based lookup
                        result = searchIndex(this.index, firstWord);
                        result = this.resolveItems(result).sort(sorter);
                        // final filter to match all words
                        result = matchAllWords(result, words.slice(1));
                        // render
                        var json = JSON.stringify(result);
                        if (json === this.lastJSON) return;
                        this.lastJSON = json;
                    } else {
                        result = this.items;
                        this.lastJSON = null;
                    }
                    // apply folder-based filter
                    var folder = this.folder;
                    result = _(result).filter(function (item) {
                        if (folder === 'all') return item.folder_id !== collected_id;
                        if (folder === 'all_lists') return item.list;
                        if (folder === 'all_labels') return item.label;
                        return item.folder_id === folder;
                    });
                    // render
                    this.renderItems(result, { isSearch: isSearch });
                };
            },
            onInput: function () {
                var view = this;
                var onInput = _.debounce(function () {
                    view.search($(this).val());
                }, 100);
                this.$('.search-field').on('input', onInput);
            },
            onCursorDown: function () {
                var view = this;
                this.$('.search-field').on('keydown', function (e) {
                    if (!(e.which === 40 || e.which === 13)) return;
                    view.listView.selection.select(0);
                });
            },
            onDoubleClick: function () {
                var view = this;
                this.$('.list-view').on('dblclick', '.list-item', function () {
                    view.trigger('select');
                    view.close();
                });
            },
            onEscape: function () {
                var view = this;
                this.$('.list-view').on('keydown', function (e) {
                    if (e.which !== 27) return;
                    e.preventDefault();
                    view.$('.search-field').focus();
                });
            },
            onSelectionChange: function () {

                var selection = this.selection = {};

                function clearSelection(e) {
                    e.preventDefault();
                    selection = this.selection = {};
                    this.listView.selection.clear();
                    this.listView.selection.triggerChange();
                }

                this.listenTo(this.listView, 'selection:change', function () {

                    var array = this.flattenItems(_(selection).keys()),
                        summary = this.$('.selection-summary').empty(),
                        n = array.length,
                        hasItems = !!n;

                    summary.toggle(hasItems);
                    if (!hasItems) return;

                    var addresses = _(array).pluck('email').join(', ');
                    summary.append(
                        $('<div>').append(
                            $('<span class="count pull-left">').text(
                                useLabels ?
                                //#. %1$d is number of selected items (addresses/groups) in the list
                                gt.format(gt.ngettext('%1$d item selected', '%1$d items selected', n), n) :
                                //#. %1$d is number of selected addresses
                                gt.format(gt.ngettext('%1$d address selected', '%1$d addresses selected', n), n)
                            ),
                            $('<a href="#" class="pull-right" role="button" tabindex="1">')
                            .text(gt('Clear selection'))
                            .on('click', $.proxy(clearSelection, this))
                        ),
                        $('<div class="addresses">').attr('title', addresses).text(addresses)
                    );
                });

                this.listenTo(this.listView, 'selection:add', function (array) {
                    _(array).each(function (id) { selection[id] = true; });
                });

                this.listenTo(this.listView, 'selection:remove', function (array) {
                    _(array).each(function (id) { delete selection[id]; });
                });
            }
        })
        .build(function () {

            // use a template for maximum performance
            // yep, no extensions here; too slow for find-as-you-type
            var template = _.template(
                '<% _(list).each(function (item) { %>' +
                '<li class="list-item selectable" aria-selected="false" role="option" tabindex="-1" data-cid="<%- item.cid %>">' +
                '  <div class="list-item-checkmark"><i class="fa fa-checkmark" aria-hidden="true"></i></div>' +
                '  <div class="list-item-content">' +
                '    <% if (item.list) { %>' +
                '      <div class="contact-picture distribution-list" aria-label="hidden"><i class="fa fa-align-justify"></i></div>' +
                '    <% } else if (item.label) { %>' +
                '      <div class="contact-picture label" aria-label="hidden"><i class="fa fa-users"></i></div>' +
                '    <% } else if (item.image) { %>' +
                '      <div class="contact-picture image" data-original="<%= item.image %>" aria-label="hidden"></div>' +
                '    <% } else { %>' +
                '      <div class="contact-picture initials <%= item.initial_color %>" aria-label="hidden"><%- item.initials %></div>' +
                '    <% } %>' +
                '    <div class="name"><%= item.full_name_html || "\u00A0" %></div>' +
                '    <div class="email gray"><%- item.caption || item.email || "\u00A0" %></div>' +
                '  </div>' +
                '</li>' +
                '<% }); %>'
            );

            this.$el.on('appear', function (e) {
                // track contact pictures that appear; we assume they get cached
                appeared[$(e.target).attr('data-original')] = true;
            });

            this.renderItems = function (list, options) {
                // avoid duplicates
                list = _(list).filter(function (item) {
                    if (item.label) return true;
                    if (this[item.email]) return false; return (this[item.email] = true);
                }, {});
                // get defaults
                options = _.extend({
                    limit: options.isSearch ? LIMITS.search : LIMITS.render,
                    offset: 0
                }, options);
                // get subset; don't draw more than n items by default
                var subset = list.slice(options.offset, options.limit),
                    $el = this.$('.list-view');
                // clear if offset is zero
                if (options.offset === 0) $el[0].innerHTML = '';
                $el[0].innerHTML += template({ list: subset });
                if (options.offset === 0) $el.scrollTop(0);
                $el.data({ list: list, options: options });
                this.$('.contact-picture[data-original]').each(function () {
                    // appeared before? show now; no lazyload; better experience
                    var node = $(this), url = node.attr('data-original');
                    if (appeared[url]) node.css('background-image', 'url(' + url + ')'); else node.lazyload();
                });
                // restore selection
                var ids = _(this.selection).keys();
                this.listView.selection.set(ids);
            };

            this.renderMoreItems = function () {
                var data = $list.data(), options = data.options;
                if (options.limit >= data.list.length) return;
                options.offset = options.limit;
                options.limit = options.limit + LIMITS.more;
                this.renderItems(data.list, options);
            };

            var $list = $();

            var onScroll = _.debounce(function () {

                var height = $list.outerHeight(),
                    scrollTop = $list[0].scrollTop,
                    scrollHeight = $list[0].scrollHeight,
                    bottom = scrollTop + height;

                if (bottom / scrollHeight < 0.80) return;

                var defer = window.requestAnimationFrame || window.setTimeout;
                defer(this.renderMoreItems.bind(this));

            }, 50);

            this.on('open', function () {
                $list = this.$('.list-view');
                $list.on('scroll', $.proxy(onScroll, this));
            });

            this.resolveItems = function (ids) {
                return _(ids)
                    .chain()
                    .map(function (cid) { return this.hash[cid]; }, this)
                    .compact()
                    .value();
            };

            this.flattenItems = function (ids) {
                return flatten(this.resolveItems(ids));
            };

            function flatten(list) {
                return _(list)
                    .chain()
                    .map(function (item) {
                        if (item.list || item.label) return flatten(item.list || item.label);
                        var name = item.mail_full_name, mail = item.mail || item.email;
                        return {
                            array: [name || null, mail || null],
                            display_name: name,
                            id: item.id,
                            folder_id: item.folder_id,
                            email: mail
                        };
                    }, this)
                    .flatten()
                    .uniq(function (item) { return item.email; })
                    .value();
            }
        })
        .on({
            'close': function () {
                isOpen = false;
            },
            'error': function (e) {
                this.$body.empty().addClass('error').text(e.error || e);
            },
            'select': function () {
                var ids = _(this.selection).keys();
                if (ox.debug) console.log('select', ids, this.flattenItems(ids));
                if (_.isFunction(callback)) callback(this.flattenItems(ids));
            }
        })
        .addCancelButton()
        //#. Context: Add selected contacts; German "Auswählen", for example
        .addButton({ label: gt.pgettext('select-contacts', 'Select'), action: 'select' })
        .open();
    }

    /* Debug lines

    require(['io.ox/contacts/addressbook/popup'], function (popup) { popup.getAllMailAddresses().always(_.inspect); });
    require('io.ox/contacts/addressbook/popup').searchIndex(window.index, 'b');

    void require(['io.ox/contacts/addressbook/popup'], function (popup) { popup.open(_.inspect); });
    */

    return {
        buildIndex: buildIndex,
        searchIndex: searchIndex,
        getAllMailAddresses: getAllMailAddresses,
        open: open
    };
});
