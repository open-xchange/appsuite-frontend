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
    'l10n/ja_JP/io.ox/collation',
    'gettext!io.ox/contacts',
    'gettext!io.ox/core',
    'settings!io.ox/contacts',
    'settings!io.ox/mail',
    'io.ox/core/yell',
    'less!io.ox/contacts/addressbook/style'
], function (http, folderAPI, ModalDialog, ListView, ext, util, api, collation, gt, gtCore, settings, mailSettings, yell) {

    'use strict';

    var names = 'yomiLastName yomiFirstName last_name first_name display_name'.split(' '),
        addresses = 'email1 email2 email3'.split(' ');

    // limits
    var LIMITS = {
        departments: settings.get('picker/limits/departments', 100),
        fetch: settings.get('picker/limits/fetch', 10000),
        labels: settings.get('picker/limits/labels', 1000),
        more: settings.get('picker/limits/more', 100),
        render: settings.get('picker/limits/list', 100),
        search: settings.get('picker/limits/search', 50)
    };

    // special folder id
    var collected_id = mailSettings.get('contactCollectFolder', 0);

    // split words
    var regSplitWords = /[\s,.\-:;<>()_@/'"]/;
    // '

    // feature toggles
    var useInitials = settings.get('picker/useInitials', true),
        useInitialsColor = useInitials && settings.get('picker/useInitialsColor', true),
        useLabels = settings.get('picker/useLabels', false),
        closeOnDoubleClick = settings.get('picker/closeOnDoubleClick', true),
        useGlobalAddressBook = settings.get('picker/globalAddressBook', true),
        //TODO: unify feature toggles: showDepartment is a newer backend toggle, picker/departments is frontend only
        showDepartment = settings.get('showDepartment'),
        useDepartments = typeof showDepartment === 'undefined' ? settings.get('picker/departments', true) : showDepartment;

    if (useDepartments) names.push('department');

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

        var informUserOnce = _.once(function (limit) {
            yell('warning', gt('This dialog is limited to %1$d entries and your address book exceeds this limitation. Therefore, some entries are not listed.', limit));
        });

        return function (options) {
            options = options || {};
            return $.when(
                fetchAddresses(options),
                useLabels ? fetchLabels() : $.when()
            )
            .then(function (contacts, labels) {
                var result = [], hash = {};
                processAddresses(contacts, result, hash, options);
                if (useLabels) processLabels(labels[0], result, hash);
                return { items: result, hash: hash, index: buildIndex(result) };
            });
        };

        function fetchAddresses(options) {

            options = _.extend({
                // keep this list really small for good performance!
                columns: '1,20,500,501,502,505,519,524,555,556,557,592,602,606,616,617',
                exclude: useGlobalAddressBook ? [] : ['6'],
                limit: LIMITS.fetch,
                lists: true
            }, options);

            var data = {
                exclude_folders: options.exclude
            };

            if (options.folder === 'all') delete options.folder;
            if (options.useGABOnly) data.folder = ['6'];
            return http.PUT({
                module: 'contacts',
                params: {
                    action: 'search',
                    admin: settings.get('showAdmin', false),
                    columns: options.columns,
                    right_hand_limit: options.limit,
                    sort: 608,
                    order: 'desc'
                },
                // emailAutoComplete doesn't work; need to clean up client-side anyway
                data: data
            }).then(function (list) {
                if (list && list.length === options.limit) informUserOnce(options.limit);
                if (options.lists) return list;
                return _.filter(list, function (item) {
                    return !item.distribution_list;
                });
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

        function processAddresses(list, result, hash, opt) {

            list.forEach(function (item, rank) {
                // remove quotes from display name (common in collected addresses)
                item.display_name = getDisplayName(item.display_name);
                var sort_name = [], address;
                // distribution list?
                if (item.mark_as_distributionlist) {
                    // get sort name
                    sort_name = [item.display_name];
                    // get a match for the entire list
                    address = _(item.distribution_list)
                        .filter(function (obj) {
                            return obj.mail;
                        })
                        .map(function (obj) {
                            // mail address only
                            return $.trim(obj.mail).toLowerCase();
                        })
                        .join(', ');
                    // overwrite last name to get a nicer full name
                    item.last_name = item.display_name;
                    var obj = process(item, sort_name, address, 0, rank);
                    if (obj) {
                        obj.full_name_html += ' <span class="gray">' + gt('Distribution list') + '</span>';
                        result.push((hash[obj.cid] = obj));
                    }
                } else {
                    // get sort name
                    names.forEach(function (name) {
                        // use diplay name as fallback only, to avoid inconsistencies
                        // example if we would not do this: yomiLastname: a => sort_name: a, lastname: a => sortname: a_a, reason behind this is that for yomis no display name is created
                        if (name === 'display_name' && sort_name.length) return;
                        if (item[name]) sort_name.push(item[name]);
                    });
                    if (opt.useGABOnly) addresses = ['email1'];
                    // get a match for each address
                    addresses.forEach(function (field, i) {
                        var obj = process(item, sort_name, (item[field] || '').toLowerCase(), rank, i, field);
                        if (obj) {
                            result.push((hash[obj.cid] = obj));
                        }
                    });
                }
            });
            return { items: result, hash: hash, index: buildIndex(result) };
        }

        function process(item, sort_name, address, rank, i, field) {
            // skip if empty
            address = $.trim(address);
            if (!address) return;
            // drop no-reply addresses
            if (/^(noreply|no-reply|do-not-reply)@/.test(address)) return;
            // drop broken imports
            if (/^=\?iso-8859-1\?q\?=22/i.test(item.display_name)) return;
            // add to results
            // do all calculations now; during rendering is more expensive
            var folder_id = String(item.folder_id),
                department = (useDepartments && folder_id === '6' && $.trim(item.department)) || '',
                full_name = util.getFullName(item).toLowerCase(),
                initials = util.getInitials(item);
            return {
                caption: address,
                cid: item.folder_id + '.' + item.id + '.' + i,
                department: department,
                display_name: item.display_name,
                email: address,
                field: field,
                first_name: item.first_name,
                folder_id: folder_id,
                full_name: full_name,
                full_name_html: util.getFullName(item, true),
                image: util.getImage(item) || (!useInitials && api.getFallbackImage()),
                id: String(item.id),
                initials: useInitials && initials,
                initial_color: util.getInitialsColor(useInitialsColor && initials),
                keywords: (full_name + ' ' + address + ' ' + department).toLowerCase(),
                last_name: item.last_name,
                list: processLists(item),
                mail_full_name: util.getMailFullName(item),
                // all lower-case to be case-insensitive; replace spaces to better match server-side collation
                sort_name: sort_name.concat(address).join('_').toLowerCase().replace(/\s/g, '_'),
                // allow sorters to have special handling for sortnames and addresses
                sort_name_without_mail: sort_name.join('_').toLowerCase().replace(/\s/g, '_'),
                title: item.title,
                rank: 1000 + ((folder_id === '6' ? 10 : 0) + rank) * 10 + i,
                user_id: item.internal_userid
            };
        }

        function processLists(item) {
            // avoid needless pmodel display name lookups/redraws after 'select' (bug 51755)
            if (!item.mark_as_distributionlist) return false;
            return _.map(item.distribution_list, function (listitem) {
                return _.extend(listitem, { mail_full_name: util.getMailFullName(listitem) });
            });
        }

        function getDisplayName(str) {
            return $.trim(str).replace(/^["']+|["']+$/g, '');
        }

        function processLabels(list, result, hash) {

            list.forEach(function (item, i) {

                // translate into array of object
                item.members = _(item.members)
                    .chain()
                    .map(function (member) {
                        return {
                            display_name: util.getMailFullName(member),
                            id: member.id,
                            folder_id: member.folder_id,
                            email: $.trim(member.email1 || member.email2 || member.email3).toLowerCase()
                        };
                    })
                    .filter(function (member) {
                        // drop members without an email address
                        return !!member.email;
                    })
                    .value();

                // drop empty groups
                if (!item.members.length) return;

                item.display_name = String(item.title);

                var full_name = util.getFullName(item).toLowerCase(),
                    addresses = _(item.members).pluck('email').join(', ');

                item = {
                    caption: _(item.members).pluck('display_name').join(', '),
                    cid: 'virtual/label.' + item.id + '.' + i,
                    display_name: item.display_name,
                    email: addresses,
                    first_name: '',
                    folder_id: 'virtual/label',
                    full_name: full_name,
                    full_name_html: util.getFullName(item, true),
                    image: '',
                    id: String(item.id),
                    initials: '',
                    initial_color: '',
                    keywords: (full_name + ' ' + addresses).toLowerCase(),
                    label: item.members,
                    last_name: '',
                    mail_full_name: util.getMailFullName(item),
                    // all lower-case to be case-insensitive; replace spaces to better match server-side collation
                    sort_name: item.display_name.toLowerCase().replace(/\s/g, '_'),
                    title: item.title,
                    rank: i
                };
                result.push((hash[item.cid] = item));
            });
        }

    }());

    //
    // Sorter for use_count and sort_name
    //
    var sorter = (function () {

        if (_.device('ja_JP')) return collation.sorterWithMail;

        return function sorter(a, b) {
            // asc with locale compare
            return a.sort_name.localeCompare(b.sort_name);
        };
    }());

    function rankSorter(a, b) {
        return a.rank - b.rank;
    }

    //
    // Match all words
    //
    function matchAllWords(list, words) {
        if (_.isEmpty(words)) return list;
        return _(list).filter(function (item) {
            return _(words).every(function (word) {
                return item.keywords.indexOf(word) > -1;
            });
        });
    }

    //
    // Open dialog
    //

    var isOpen = false, cachedResponse = null, folder = 'all', appeared = {};

    // clear cache on address book changes
    api.on('create update delete import', function () {
        cachedResponse = null;
    });

    var sections = {
        'private': gt('My address books'),
        'public':  gt('Public address books'),
        'shared':  gt('Shared address books')
    };

    function open(callback, options) {

        options = _.extend({
            build: _.noop,
            //#. Context: Add selected contacts; German "Auswählen", for example
            button: gt.pgettext('select-contacts', 'Select'),
            enter: false,
            focus: '.search-field',
            //600px
            height: '37.5rem',
            point: 'io.ox/contacts/addressbook-popup',
            help: 'ox.appsuite.user.sect.email.send.addressbook.html',
            title: gt('Select contacts'),
            useGABOnly: false
        }, options);

        if (options.useGABOnly) folder = 'folder/6';

        // avoid parallel popups
        if (isOpen) return;
        isOpen = true;

        return new ModalDialog(options)
        .inject({
            renderFolders: function (folders) {
                var $dropdown = this.$('.folder-dropdown'),
                    useGABOnly = this.options.useGABOnly,
                    count = 0;
                // remove global address book?
                if (!useGlobalAddressBook && folders.public) {
                    folders.public = _(folders.public).reject({ id: '6' });
                }
                if (this.options.useGABOnly) {
                    folders = _.pick(folders, 'public');
                }
                $dropdown.append(
                    _(folders).map(function (section, id) {
                        // skip empty and (strange) almost empty folders
                        if (!sections[id] || !section.length) return $();
                        if (!section[0].id && !section[0].title) return $();
                        return $('<optgroup>').attr('label', sections[id]).append(
                            _(section).map(function (folder) {
                                count++;
                                if (useGABOnly && folder.id !== '6') return;
                                return $('<option>').val('folder/' + folder.id).text(folder.title);
                            })
                        );
                    })
                );
                if (count > 1) $dropdown.removeClass('invisible');
            },
            renderDepartments: function (result) {
                var departments = this.getDepartments(result.items);
                if (!departments.length) return;
                this.$('.folder-dropdown')
                    .append(
                        $('<optgroup>').attr('label', gt('Departments')).append(
                            departments.map(function (item) {
                                return $('<option>').val('department/' + item.name).text(item.name);
                            })
                        )
                    )
                    // finally set current folder
                    .val(folder);
            },
            getDepartments: function (items) {
                var departments = {};
                _(items).each(function (item) {
                    if (!item.department || item.department.length <= 1) return;
                    departments[item.department] = (departments[item.department] || 0) + 1;
                });
                return _(departments)
                    .chain()
                    .map(function (count, name) {
                        return { name: name, count: count };
                    })
                    // limit to largest departments; then sort by name
                    .sortBy('count').reverse().first(LIMITS.departments).sortBy('name').value();
            },
            onChangeFolder: function () {
                this.folder = folder = this.$('.folder-dropdown').val() || 'all';
                this.lastJSON = null;
                this.search(this.$('.search-field').val());
            }
        })
        .extend({
            addClass: function () {
                this.$el.addClass('addressbook-popup');
            },
            header: function () {

                this.$('.modal-header').append(
                    $('<div class="row">').append(
                        $('<div class="col-xs-6">').append(
                            $('<input type="text" class="form-control search-field">')
                            .attr('placeholder', gt('Search'))
                            .attr('aria-label', gt('Search'))
                        ),
                        $('<div class="col-xs-6">').append(
                            $('<select class="form-control folder-dropdown invisible">').append(
                                this.options.useGABOnly ? $() : $('<option value="all">').text(gt('All folders')),
                                this.options.useGABOnly || useLabels ? $() : $('<option value="all_lists">').text(gt('All distribution lists')),
                                useLabels ? $('<option value="all_labels">').text(gt('All groups')) : $()
                            ).attr('aria-label', gt('Apply filter')).val(folder)
                        )
                    )
                );

                this.defFolder = folderAPI.flat({ module: 'contacts' }).done(this.renderFolders.bind(this));
                this.defAddresses = $.Deferred();
                $.when(this.defAddresses, this.defFolder).done(this.renderDepartments.bind(this));

                this.folder = folder;
                this.$('.folder-dropdown').on('change', $.proxy(this.onChangeFolder, this));
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
                this.$body.append(this.listView.render().$el.addClass('address-picker'));
            },
            onOpen: function () {

                // hide body initially / add busy animation
                this.busy(true);

                function success(response) {
                    if (this.disposed) return;
                    cachedResponse = response;
                    this.items = response.items.sort(sorter);
                    this.store.setHash(response.hash);
                    this.index = response.index;
                    this.search('');
                    this.idle();
                    this.defAddresses.resolve(response);
                }

                function fail(e) {
                    // remove animation but block form
                    if (this.disposed) return;
                    this.idle().disableFormElements();
                    this.trigger('error', e);
                }

                this.on('open', function () {
                    _.defer(function () {
                        if (cachedResponse && !this.options.useGABOnly) return success.call(this, cachedResponse);
                        getAllMailAddresses({ useGABOnly: this.options.useGABOnly }).then(success.bind(this), fail.bind(this));
                    }.bind(this));
                });
            },
            search: function () {

                this.search = function (query) {
                    query = $.trim(query);
                    var result, isSearch = query.length && query !== '@';
                    if (isSearch) {
                        result = search(query, this.index, this.store.getHash());
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
                        if (/^folder\//.test(folder)) return item.folder_id === folder.substr(7);
                        if (/^department\//.test(folder)) return item.department === folder.substr(11);
                        return false;
                    });
                    // render
                    this.renderItems(result, { isSearch: isSearch });
                };
            },
            tokenview: function () {
                this.tokenview = new TokenView({ useLabels: useLabels });
                // handle remove
                this.tokenview.on('remove', function (cid) {
                    // remove selected (non-visible)
                    // TODO: use custom global events
                    this.store.remove(cid);
                    // remove selected (visible)
                    var selection = this.listView.selection;
                    selection.uncheck(selection.getNode(cid));
                    selection.triggerChange();
                }.bind(this));
                // handle clear
                this.tokenview.on('clear', function () {
                    this.store.clear();
                    this.listView.selection.clear();
                    this.listView.selection.triggerChange();
                }.bind(this));
            },
            store: function () {
                this.store = createStore();
                this.listenTo(this.listView, 'selection:clear', this.store.clear);
                this.listenTo(this.listView, 'selection:add', this.store.add);
                this.listenTo(this.listView, 'selection:remove', this.store.remove);

                function createStore() {
                    var hash = {}, selection = {};
                    return {
                        setHash: function (data) {
                            // full data
                            hash = data;
                        },
                        getHash: function () {
                            return hash;
                        },
                        add: function (list) {
                            _(list).each(function (id) { selection[id] = true; });
                        },
                        remove: function (list) {
                            list = [].concat(list);
                            _(list).each(function (id) {
                                delete selection[id];
                            });
                        },
                        clear: function () {
                            selection = {};
                        },
                        getIds: function () {
                            return _(selection).keys();
                        },
                        get: function () {
                            return _(selection)
                                .chain()
                                .keys()
                                .map(function (cid) { return hash[cid]; }, this)
                                .compact()
                                .value();
                        },
                        resolve: function (cid) {
                            return hash[cid];
                        }
                    };
                }
            },
            footer: function () {
                this.$('.modal-footer').prepend(
                    this.tokenview.$el
                );
            },
            onInput: function () {
                var view = this;
                var onInput = _.debounce(function () {
                    view.search($(this).val());
                }, 100);
                this.$('.search-field').on('input', onInput);
            },
            onCursorDown: function () {
                this.$('.search-field').on('keydown', function (e) {
                    if (!(e.which === 40 || e.which === 13)) return;
                    this.listView.selection.focus(0);
                    e.preventDefault();
                }.bind(this));
            },
            onDoubleClick: function () {
                if (!closeOnDoubleClick) return;
                this.$('.list-view').on('dblclick', '.list-item', function (e) {
                    // emulate a third click
                    // as users expect this one to be part of the selection (dialog also closes)
                    if (!$(e.currentTarget).hasClass('selected')) this.listView.selection.onClick(e);
                    this.trigger('select');
                    this.close();
                }.bind(this));
            },
            onEscape: function () {
                this.$('.list-view').on('keydown', function (e) {
                    if (e.which !== 27) return;
                    e.preventDefault();
                    this.$('.search-field').focus();
                }.bind(this));
            },
            onSelectionChange: function () {

                if (!this.tokenview) return;

                this.listenTo(this.listView, 'selection:change', function () {

                    var list = this.store.get();
                    // pick relavant values
                    this.tokenview.render(_.map(list, function (obj) {
                        return {
                            title: obj.list ? obj.display_name + ' - ' + gt('Distribution list') : obj.email,
                            cid: obj.cid,
                            dist_list_length: obj.list ? obj.list.length : undefined };
                    }));

                    if (!list.length) return;

                    // adjust scrollTop to avoid overlapping of last item (bug 49035)
                    var focus = this.listView.$('.list-item:focus');
                    if (!focus.hasClass('selected')) return;

                    var itemHeight = focus.outerHeight(),
                        bottom = focus.position().top + itemHeight,
                        height = this.listView.$el.outerHeight();

                    if (bottom > height) this.listView.el.scrollTop += bottom - height;
                }.bind(this));
            }
        })
        .build(function () {
            var self = this;

            this.$el.on('appear', onAppear);

            this.renderItems = function (list, options) {
                options.renderEmpty = this.renderEmpty.bind(this, options);
                renderItems.call(this.$('.list-view'), list, options);
                // restore selection
                var ids = this.store.getIds();
                this.listView.selection.set(ids);
            };

            this.renderEmpty = function (options) {
                var $el = this.$('.list-view');
                $el[0].innerHTML = '';
                $el.append(
                    $('<div class="notification">').text(
                        options.isSearch ? gt('No matching items found.') : gt('Empty')
                    )
                );
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
                return resolveItems(this.store.getHash(), ids);
            };

            this.flattenItems = function (ids, options) {
                options = options || {};
                if (options.yellOmitted) {
                    self.omittedContacts = [];
                    var items = flatten(this.resolveItems(ids));
                    util.validateDistributionList(self.omittedContacts);
                    delete self.omittedContacts;
                    return items;
                }
                return flatten(this.resolveItems(ids));
            };

            function flatten(list) {
                return _(list)
                    .chain()
                    .filter(function (item) {
                        if (self.omittedContacts !== undefined && !item.list && !(item.mail || item.email)) self.omittedContacts.push(item);
                        // only distribution lists and items with a mail address
                        return (item.list || item.label) || (item.mail || item.email);
                    })
                    .map(function (item) {
                        if (item.list || item.label) return flatten(item.list || item.label);
                        var name = item.mail_full_name, mail = item.mail || item.email;
                        return {
                            array: [name || null, mail || null],
                            display_name: name,
                            id: item.id,
                            folder_id: item.folder_id,
                            email: mail,
                            // mail_field is used in distribution lists
                            field: item.mail_field ? 'email' + item.mail_field : item.field,
                            user_id: item.user_id
                        };
                    }, this)
                    .flatten()
                    .uniq(function (item) { return item.email; })
                    .value();
            }
        })
        .build(options.build)
        .on({
            'close': function () {
                // reset folder to default
                folder = 'all';
                isOpen = false;
            },
            'error': function (e) {
                this.$body.empty().addClass('error').text(e.error || e);
            },
            'select': function () {
                var ids = this.store.getIds();
                if (ox.debug) console.log('select', ids, this.flattenItems(ids));
                if (_.isFunction(callback)) callback(this.flattenItems(ids, { yellOmitted: true }));
            }
        })
        .addCancelButton()
        //#. Context: Add selected contacts; German "Auswählen", for example
        .addButton({ label: options.button, action: 'select' })
        .open();
    }

    function search(query, index, hash, ranked) {
        // split query into single words (without leading @; covers edge-case)
        var words = query.replace(/^@/, '').split(regSplitWords), firstWord = words[0], result;
        // use first word for the index-based lookup
        result = searchIndex(index, firstWord);
        result = resolveItems(hash, result).sort(ranked ? rankSorter : sorter);
        // final filter to match all words
        return matchAllWords(result, words.slice(1));
    }

    // use a template for maximum performance
    // yep, no extensions here; too slow for find-as-you-type
    var template = _.template(
        '<% _(list).each(function (item) { %>' +
        '<li class="list-item selectable" aria-selected="false" role="option" tabindex="-1" data-cid="<%- item.cid %>">' +
        '  <div class="list-item-checkmark"><i class="fa fa-checkmark" aria-hidden="true"></i></div>' +
        '  <div class="list-item-content">' +
        '    <% if (item.list) { %>' +
        '      <div class="contact-picture distribution-list" aria-hidden="true"><i class="fa fa-align-justify" aria-hidden="true"></i></div>' +
        '    <% } else if (item.label) { %>' +
        '      <div class="contact-picture label" aria-hidden="true"><i class="fa fa-users" aria-hidden="true"></i></div>' +
        '    <% } else if (item.image) { %>' +
        '      <div class="contact-picture image" data-original="<%= item.image %>" aria-hidden="true"></div>' +
        '    <% } else { %>' +
        '      <div class="contact-picture initials <%= item.initial_color %>" aria-hidden="true"><%- item.initials %></div>' +
        '    <% } %>' +
        '    <div class="name">' +
        '       <%= item.full_name_html || item.email || "\u00A0" %>' +
        '       <% if (item.department) { %><span class="gray">(<%- item.department %>)</span><% } %>' +
        '    </div>' +
        '    <div class="email gray"><%- item.caption || "\u00A0" %></div>' +
        '  </div>' +
        '</li>' +
        '<% }); %>'
    );

    function onAppear(e) {
        // track contact pictures that appear; we assume they get cached
        appeared[$(e.target).attr('data-original')] = true;
    }

    // keeps order
    function groupBy(list, iteratee) {
        var result = [];
        _(list).each(function (item, index) {
            var cid = iteratee(item, index),
                group = this[cid] = this[cid] || [];
            // when empty it was not added to result list yet
            if (!group.length) result.push(group);
            group.push(item);
        }, {});
        return result;
    }

    function flattenBy(list, iteratee) {
        return _(list).map(function (group) {
            return _.chain(group)
                    .sortBy(iteratee)
                    .first()
                    .value();
        });
    }

    function renderItems(list, options) {
        // avoid duplicates (name + email address; see bug 56040)
        list = groupBy(list, function (item) {
            // returns cid as grouping criteria
            return item.label ? _.uniqueId(item.keywords) : item.full_name + ' ' + item.email;
        });
        list = flattenBy(list, function (item) {
            // returns sort order to prefer users to contacts
            return item.user_id ? -1 : 1;
        });

        // get defaults
        options = _.extend({
            limit: options.isSearch ? LIMITS.search : LIMITS.render,
            offset: 0
        }, options);
        // empty?
        if (!list.length) {
            if (options.renderEmpty) options.renderEmpty(options);
        }
        // get subset; don't draw more than n items by default
        var subset = list.slice(options.offset, options.limit);
        // clear if offset is zero
        if (options.offset === 0) this[0].innerHTML = '';
        this[0].innerHTML += template({ list: subset });
        if (options.offset === 0) this.scrollTop(0);
        this.data({ list: list, options: options });
        this.find('.contact-picture[data-original]').each(function () {
            // appeared before? show now; no lazyload; better experience
            var node = $(this), url = node.attr('data-original');
            if (appeared[url]) node.css('background-image', 'url(' + url + ')'); else node.lazyload();
        });
    }

    function resolveItems(hash, ids) {
        return _(ids)
            .chain()
            .map(function (cid) { return hash[cid]; })
            .compact()
            .value();
    }

    /* Debug lines

    require(['io.ox/contacts/addressbook/popup'], function (popup) { popup.getAllMailAddresses().always(_.inspect); });
    require('io.ox/contacts/addressbook/popup').searchIndex(window.index, 'b');

    void require(['io.ox/contacts/addressbook/popup'], function (popup) { popup.open(_.inspect); });
    */

    function addToken(item, index) {
        return $('<li class="list-item selectable removable token" role="option">').attr({
            'id': _.uniqueId('token'),
            'data-cid': item.cid,
            'data-index': index
        }).append(
            $('<span class="token-label">').text(item.title),
            $('<a href="#" class="token-action remove" tabindex="-1" aria-hidden="true">').attr('title', gt('Remove')).append(
                // TODO: title=remove
                $('<i class="fa fa-times" aria-hidden="true">')
            )
        );
    }

    // TODO: core a11y
    function Iterator(context) {
        function get(index) {
            return context.$list.get(index);
        }
        return {
            first: function () {
                return get(0);
            },
            last: function () {
                return get(context.$list.length - 1);
            },
            next: function () {
                if (context.$selected.is(':last-child')) return this.first();
                var index = this.current();
                return index < 0 ? this.first() : get(index + 1);
            },
            prev: function () {
                if (context.$selected.is(':first-child')) return this.last();
                var index = this.current();
                return index < 0 ? this.last() : get(index - 1);
            },
            current: function () {
                return context.$list.index(context.$selected);
            }
        };
    }

    /**
    * - summary of an externally managed selection
    * - minimal set of actions (remove single item, clear whole selection)
    * - external logic has to trigger render() on selection change
    * - external logic has to process triggered events: 'remove' and 'clear'
    */

    var TokenView = Backbone.DisposableView.extend({

        className: 'selection-summary',

        attributes: { role: 'region' },

        initialize: function (opt) {
            this.opt = _.extend({
                selector: '.addresses',
                useLabels: false
            }, opt);
            // references
            this.$list = $();
            this.$selected = $();
            // listen
            this.$el
                // a11y.js
                .on('remove', this.opt.selector, this.onRemove.bind(this))
                .on('click', '.token', this.onClick.bind(this))
                .on('click', '.remove', this.onRemove.bind(this))
                .on('click', '.clear', this.onClear.bind(this));
            // iterator
            this.iterator = Iterator(this);
        },

        getContainer: function () {
            return this.$(this.opt.selector);
        },

        // param: index or node
        select: function (node) {
            // reset old
            this.$selected
                .attr('aria-checked', false)
                .removeClass('selected');
            // set new
            this.$selected = $(node)
                .attr('aria-checked', true)
                .addClass('selected');
            // update container
            this.getContainer().attr('aria-activedescendant', this.$selected.attr('id'));
        },

        render: function (list) {
            var length = _(list).reduce(function (agg, item) {
                    return agg + (item.dist_list_length ? item.dist_list_length : 1);
                }, 0),
                selectionLabel, description;

            this.$el.empty();

            if (!length) {
                this.$el.hide();
                return this;
            }

            // TODO: gt comment
            if (this.opt.useLabels) {
                //#. %1$d is number of selected items (addresses/groups) in the list
                selectionLabel = gt.ngettext('%1$d item selected', '%1$d items selected', length, length);
                description = gt('The selected items. Press Backspace or Delete to remove.');
            } else {
                //#. %1$d is number of selected addresses
                selectionLabel = gt.ngettext('%1$d address selected', '%1$d addresses selected', length, length);
                description = gt('The selected addresses. Press Backspace or Delete to remove.');
            }

            this.$el.append(
                // toolbar
                $('<div class="toolbar">').append(
                    $('<span role="heading" aria-level="2" aria-live="polite" class="count pull-left">').text(selectionLabel),
                    $('<a href="#" class="pull-right clear" role="button">').text(gt('Clear selection'))
                ),
                // list
                $('<div aria-live="polite" aria-relevant="removals">').attr('aria-label', description).append(
                    $('<ul class="addresses unstyled listbox" tabindex="0" role="listbox">')
                        .append(_(list).map(addToken))
                )
            );

            // update references
            this.$list = this.getContainer().children();
            // restore selection
            this.restore();
            this.$el.show();

            return this;
        },

        restore: function () {
            var node;
            if (!this.$list.length || this.$list.index(this.$selected) > -1) return;
            // redraw of previously selected
            if (this.$selected.attr('data-cid')) {
                node = this.$list.filter('[data-cid="' + this.$selected.attr('data-cid') + '"]');
                if (node.length) return this.select(node);
            }
            // TODO: use memory instead of dom
            // restore index of removed token
            if (this.$selected.attr('data-index')) {
                node = this.$list.get(parseInt(this.$selected.attr('data-index'), 10));
                if (node) return this.select(node);
                return this.select(this.iterator.last());
            }
            this.select(this.iterator.first());
        },

        onClick: function (e) {
            this.select($(e.target).closest('.token'));
        },

        onRemove: function (e) {
            var node = $(e.target).closest('.token');
            if (!node || !node.length) node = this.$selected;
            // propagate
            this.trigger('remove', node.attr('data-cid'));
            // restore focus after remove/render was triggered
            if (this.$list.length) this.getContainer().focus();
        },

        onClear: function (e) {
            e.preventDefault();
            this.trigger('clear');
        }
    });

    return {
        buildIndex: buildIndex,
        searchIndex: searchIndex,
        getAllMailAddresses: getAllMailAddresses,
        sorter: sorter,
        onAppear: onAppear,
        renderItems: renderItems,
        search: search,
        TokenView: TokenView,
        open: open
    };
});
