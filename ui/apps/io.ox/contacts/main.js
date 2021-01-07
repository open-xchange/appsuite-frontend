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
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 *
 */

define('io.ox/contacts/main', [
    'io.ox/contacts/util',
    'io.ox/core/util',
    'io.ox/contacts/api',
    'io.ox/core/tk/vgrid',
    'io.ox/contacts/view-detail',
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/commons',
    'io.ox/core/capabilities',
    'io.ox/contacts/toolbar',
    'gettext!io.ox/contacts',
    'settings!io.ox/contacts',
    'io.ox/core/folder/api',
    'io.ox/core/toolbars-mobile',
    'io.ox/core/page-controller',
    'io.ox/core/folder/tree',
    'io.ox/core/folder/view',
    'io.ox/core/svg',
    'io.ox/contacts/mobile-navbar-extensions',
    'io.ox/contacts/mobile-toolbar-actions',
    'less!io.ox/contacts/style'
], function (util, coreUtil, api, VGrid, viewDetail, ext, actionsUtil, commons, capabilities, toolbar, gt, settings, folderAPI, Bars, PageController, TreeView, FolderView, svg) {

    'use strict';

    // application object
    var app = ox.ui.createApp({
        name: 'io.ox/contacts',
        id: 'io.ox/contacts',
        title: 'Address Book'
    });

    app.mediator({
        /*
         * Init pages for mobile use
         * Each View will get a single page with own
         * toolbars and navbars. A PageController instance
         * will handle the page changes and also maintain
         * the state of the toolbars and navbars
         */
        'pages-mobile': function (app) {
            if (_.device('!smartphone')) return;
            var win = app.getWindow(),
                navbar = $('<div class="mobile-navbar">'),
                toolbar = $('<div class="mobile-toolbar">')
                    .on('hide', function () { win.nodes.body.removeClass('mobile-toolbar-visible'); })
                    .on('show', function () { win.nodes.body.addClass('mobile-toolbar-visible'); }),
                baton = ext.Baton({ app: app });

            app.navbar = navbar;
            app.toolbar = toolbar;
            app.pages = new PageController({ appname: app.options.name, toolbar: toolbar, navbar: navbar, container: win.nodes.main });

            win.nodes.body.addClass('classic-toolbar-visible').append(navbar, toolbar);

            // create 3 pages with toolbars and navbars
            app.pages.addPage({
                name: 'folderTree',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/contacts/mobile/navbar'
                })
            });

            app.pages.addPage({
                name: 'listView',
                startPage: true,
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/contacts/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'listView',
                    extension: 'io.ox/contacts/mobile/toolbar'
                }),
                secondaryToolbar: new Bars.ToolbarView({
                    baton: baton,
                    // nasty, but saves duplicate code. We reuse the toolbar from detailView for multiselect
                    page: 'detailView',
                    extension: 'io.ox/contacts/mobile/toolbar'
                })
            });

            app.pages.addPage({
                name: 'detailView',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/contacts/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'detailView',
                    extension: 'io.ox/contacts/mobile/toolbar'

                })
            });

            // important
            // tell page controller about special navigation rules
            app.pages.setBackbuttonRules({
                'listView': 'folderTree'
            });
        },

        'pages-desktop': function (app) {
            if (_.device('smartphone')) return;

            // add page controller
            app.pages = new PageController(app);

            // create 2 pages
            // legacy compatibility
            app.getWindow().nodes.main.addClass('vsplit');

            app.pages.addPage({
                name: 'listView',
                container: app.getWindow().nodes.main,
                classes: 'leftside border-right'
            });
            app.pages.addPage({
                name: 'detailView',
                container: app.getWindow().nodes.main,
                classes: 'rightside'
            });

        },

        'subscription': function (app) {
            app.subscription = {
                wantedOAuthScopes: ['contacts_ro']
            };
        },

        'folder-view-mobile': function (app) {

            if (_.device('!smartphone')) return;

            var nav = app.pages.getNavbar('folderTree'),
                page = app.pages.getPage('folderTree');

            nav.on('rightAction', function () {
                app.toggleFolders();
            });

            var tree = new TreeView({ app: app, contextmenu: true, flat: true, indent: false, module: 'contacts' });

            // initialize folder view
            FolderView.initialize({ app: app, tree: tree });
            page.append(tree.render().$el);
        },

        /*
         * Split into left and right pane
         */
        'vsplit': function (app) {
            // replacing vsplit with new pageController
            // TODO: refactor app.left and app.right
            var left = app.pages.getPage('listView'),
                right = app.pages.getPage('detailView');

            app.left = left;
            app.right = right.addClass('default-content-padding f6-target')
                .attr({
                    'tabindex': -1,
                    'aria-label': gt('Contact Details')
                }).scrollable();
        },

        'vgrid': function (app) {
            var grid = app.grid,
                savedWidth = app.settings.get('vgrid/width/' + _.display());

            // do not apply on touch devices. it's not possible to change the width there
            if (!_.device('touch') && savedWidth) {
                app.right.parent().css('left', savedWidth + 'px');
                app.left.css('width', savedWidth + 'px');
            }

            app.left.append(
                // grid container
                app.gridContainer
            );

            // add template
            grid.addTemplate({
                build: function () {
                    var name, description, location, photo, private_flag;
                    this.addClass('contact').append(
                        photo = $('<div class="contact-photo">').attr('aria-hidden', true),
                        private_flag = $('<i class="fa fa-lock private_flag" aria-hidden="true">').hide(),
                        name = $('<div class="fullname">').attr('aria-hidden', true),
                        description = $('<div class="description">').attr('aria-hidden', true),
                        location = $('<div class="gray">').attr('aria-hidden', true)
                    );
                    return { name: name, private_flag: private_flag, description: description, location: location, photo: photo };
                },
                set: function (data, fields) {
                    var fullname, name, description;
                    if (data.mark_as_distributionlist === true) {
                        name = data.display_name || '';
                        fields.name.text(name);
                        fields.private_flag.get(0).style.display = data.private_flag ? '' : 'none';
                        fields.description.text(gt('Distribution list'));
                        fields.location.text('');
                        fields.photo
                            .empty()
                            .append('<i class="fa fa-bars">')
                            .css('background-image', '');
                    } else {
                        fullname = $.trim(util.getFullName(data));
                        if (fullname) {
                            name = fullname;
                            // use html output
                            coreUtil.renderPersonalName({ $el: fields.name.empty(), html: util.getFullName(data, true) }, data);
                        } else {
                            name = $.trim(util.getFullName(data) || data.yomiLastName || data.yomiFirstName || data.display_name || util.getMail(data));
                            coreUtil.renderPersonalName({ $el: fields.name.empty(), name: name }, data);
                        }
                        description = util.getSummaryBusiness(data);
                        fields.private_flag.get(0).style.display = data.private_flag ? '' : 'none';
                        fields.description.text(description);
                        fields.location.text(util.getSummaryLocation(data));
                        var url = api.getContactPhotoUrl(data, 48);
                        var node = fields.photo.empty();
                        if (url) {
                            node.css('background-image', url ? 'url(' + url + ')' : '');
                        } else {
                            node.addClass('empty').append(svg.circleAvatar(util.getInitials(data)));
                        }
                        if (name === '' && description === '') {
                            // nothing is written down, add some text, so user isn’t confused
                            fields.name.addClass('gray').text(gt('Empty name and description found.'));
                            fields.description.text(gt('Edit to set a name.'));
                        } else {
                            fields.name.removeClass('gray');
                        }
                    }
                    this.attr('aria-label', name);
                }
            });

            // The label function can be overwritten by an extension.
            var getLabel = function (data) {
                return $.trim(data.sort_name || 'Ω').slice(0, 1).toUpperCase()
                    // 'ß'.toUpperCase() === 'SS'
                    .slice(0, 1)
                    .replace(/[ÄÀÁÂÃÄÅ]/g, 'A')
                    .replace(/[Ç]/g, 'C')
                    .replace(/[ÈÉÊË]/g, 'E')
                    .replace(/[ÌÍÎÏ]/g, 'I')
                    .replace(/[Ñ]/g, 'N')
                    .replace(/[ÖÒÓÔÕØ]/g, 'O')
                    .replace(/[ß]/g, 'S')
                    .replace(/[ÜÙÚÛ]/g, 'U')
                    .replace(/[ÝŸ]/g, 'Y')
                    // digits, punctuation and others
                    .replace(/[[\u0000-\u0040\u005B-\u017E]/g, '#')
                    .replace(/[^A-Z#]/, 'Ω');
            };
            ext.point('io.ox/contacts/getLabel').each(function (extension) {
                if (extension.getLabel) getLabel = extension.getLabel;
            });

            // add label template
            grid.addLabelTemplate({
                build: function () {
                    //need to apply this here or label is not affected by correct css when height is calculated
                    this.addClass('vgrid-label');
                },
                set: function (data) {
                    this.text(getLabel(data));
                }
            });

            // requires new label?
            grid.requiresLabel = function (i, data, current) {
                if (!data) { return false; }
                var prefix = getLabel(data);
                return (i === 0 || prefix !== current) ? prefix : false;
            };

            commons.wireGridAndAPI(grid, api);
        },

        'thumbindex': function (app) {

            // A11y: This needs some work!

            var fullIndex = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

            /**
             * Thumb index
             */
            function Thumb(opt) {
                if (this instanceof Thumb) {
                    if (_.isString(opt)) {
                        this.text = opt;
                    } else {
                        _.extend(this, opt || {});
                    }
                } else {
                    return new Thumb(opt);
                }
            }

            Thumb.prototype.draw = function (baton) {
                var node = $('<li class="thumb-index" role="option">')
                    .attr('id', _.uniqueId('ti_'))
                    .text(this.label || this.text);
                if (this.enabled(baton)) {
                    node.data('text', this.text);
                } else {
                    node.addClass('thumb-index-disabled').attr('aria-disabled', true);
                }
                return node;
            };

            Thumb.prototype.enabled = function (baton) {
                return this.text in baton.labels;
            };

            function thumbClick(e, params) {
                params = _.extend({ inputdevice: 'mouse' }, params);
                var text = $(this).data('text'),
                    silent = _.device('smartphone') || params.inputdevice !== 'keyboard';
                if (text) app.grid.scrollToLabelText(text, silent);
            }

            function thumbMove(e) {
                e.preventDefault();
                if (e.originalEvent && e.originalEvent.targetTouches) {
                    var touches = e.originalEvent.targetTouches[0],
                        x = touches.clientX,
                        y = touches.clientY,
                        element = document.elementFromPoint(x, y),
                        text = $(element).data('text');
                    if (text) app.grid.scrollToLabelText(text, /* silent? */ _.device('smartphone'));
                }
            }

            app.Thumb = Thumb;

            app.left.prepend(
                // thumb index
                app.thumbs = $('<ul class="atb contact-grid-index listbox" tabindex="0" role="listbox">')
                    //#. index used in contacts list to jump to names with a specific starting letter
                    .attr('aria-label', gt('Starting letter index'))
                    .on('click', '.thumb-index', thumbClick)
                    .on('touchmove', thumbMove)
            );
            // draw thumb index
            var baton = new ext.Baton({ app: app, data: [], Thumb: Thumb });

            ext.point('io.ox/contacts/thumbIndex').extend({
                index: 100,
                id: 'draw',
                draw: function () {

                    // get labels
                    baton.labels = app.grid.getLabels().textIndex || {};

                    // update thumb list
                    ext.point('io.ox/contacts/thumbIndex').invoke('getIndex', app.thumbs, baton);

                    app.thumbs.empty();

                    _(baton.data).each(function (thumb) {
                        app.thumbs.append(thumb.draw(baton));
                    });
                },
                getIndex: function (baton) {
                    var keys = _(baton.labels).keys();
                    baton.data = _.map(fullIndex, baton.Thumb);

                    // add omega thumb for any other leading chars
                    if (!_(keys).any(function (char) { return char === 'Ω'; })) return;
                    baton.data.push(new baton.Thumb({
                        label: 'Ω',
                        text: 'Ω',
                        enabled: _.constant(true)
                    }));
                }
            });
        },

        /*
         * Init all nav- and toolbar labels for mobile
         */
        'navbars-mobile': function (app) {

            if (!_.device('smartphone')) return;

            app.pages.getNavbar('listView')
                .setLeft(gt('Folders'))
                .setRight(
                    //#. Used as a button label to enter the "edit mode"
                    gt('Edit')
                );

            app.pages.getNavbar('folderTree')
                .setTitle(gt('Folders'))
                .setLeft(false)
                .setRight(gt('Edit'));

            app.pages.getNavbar('detailView')
                .setTitle('')
                .setLeft(
                    //#. Used as button label for a navigation action, like the browser back button
                    gt('Back')
                );

        },
        'toolbars-mobile': function () {

            if (!_.device('smartphone')) return;

            // tell each page's back button what to do
            app.pages.getNavbar('listView').on('leftAction', function () {
                app.pages.goBack();
            });

            app.pages.getNavbar('detailView').on('leftAction', function () {
                app.pages.goBack();
            });

            // checkbox toggle
            app.pages.getNavbar('listView').on('rightAction', function () {
                if (app.props.get('checkboxes') === true) {
                    // leave multiselect? -> clear selection
                    app.grid.selection.clear();
                    // hide folder button on the left
                    app.pages.getNavbar('listView').setRight(gt('Edit')).show('.left');
                } else {
                    app.pages.getNavbar('listView').setRight(gt('Cancel')).hide('.left');
                }
                app.props.set('checkboxes', !app.props.get('checkboxes'));
            });
        },

        'swipe-mobile': function () {
        },

        'show-contact': function (app) {
            if (_.device('smartphone')) return;
            // LFO callback
            var showContact, drawContact, drawFail, grid = app.grid;

            showContact = function (obj) {
                // get contact
                app.right.parent().off('scroll');
                app.right.busy({ empty: true });
                if (obj && obj.id !== undefined) {
                    app.currentContact = api.reduce(obj);
                    api.get(app.currentContact)
                        .done(_.lfo(drawContact))
                        .fail(_.lfo(drawFail, obj));
                } else {
                    app.right.idle().empty();
                }
            };

            showContact.cancel = function () {
                _.lfo(drawContact);
                _.lfo(drawFail);
            };

            drawContact = function (data) {
                var baton = ext.Baton({ data: data, app: app });
                baton.disable('io.ox/contacts/detail', 'inline-actions');
                if (grid.getMode() === 'all') baton.disable('io.ox/contacts/detail', 'breadcrumb');
                app.right.idle().empty().append(viewDetail.draw(baton));
            };

            drawFail = function (obj) {
                app.right.idle().empty().append(
                    $.fail(gt('Couldn\'t load contact data.'), function () {
                        showContact(obj);
                    })
                );
            };

            app.showContact = showContact;
            commons.wireGridAndSelectionChange(grid, 'io.ox/contacts', showContact, app.right, api);
        },

        'show-contact-mobile': function (app) {
            if (_.device('!smartphone')) return;
            // LFO callback
            var showContact, drawContact, drawFail, grid = app.grid;

            showContact = function (obj) {
                // get contact
                //app.pages.getPage('detailView').busy();
                if (obj && obj.id !== undefined) {
                    app.right.empty().busy();
                    app.currentContact = api.reduce(obj);
                    api.get(app.currentContact)
                        .done(_.lfo(drawContact))
                        .fail(_.lfo(drawFail, obj));
                } else {
                    app.right.idle();
                }
            };

            showContact.cancel = function () {
                _.lfo(drawContact);
                _.lfo(drawFail);
            };

            drawContact = function (data) {
                var baton = ext.Baton({ data: data, app: app });
                baton.disable('io.ox/contacts/detail', 'inline-actions');
                app.right.idle().empty().append(viewDetail.draw(baton));
            };

            drawFail = function (obj) {
                app.right.idle().empty().append(
                    $.fail(gt('Couldn\'t load contact data.'), function () {
                        showContact(obj);
                    })
                );
            };

            app.showContact = showContact;
            commons.wireGridAndSelectionChange(grid, 'io.ox/contacts', showContact, app.right, api);
        },
        /*
         * Always change pages on tap, don't wait for data to load
         */
        'select:contact-mobile': function (app) {
            if (_.device('!smartphone')) return;
            app.grid.getContainer().on('click', '.vgrid-cell.selectable', function () {
                if (app.props.get('checkboxes') === true) return;
                // hijack selection event hub to trigger page-change event
                app.grid.selection.trigger('pagechange:detailView');
                app.pages.changePage('detailView');
            });
        },

        /*
         * Add support for selection:
         */
        'selection-doubleclick': function (app) {
            // detail app does not make sense on small devices
            // they already see tasks in full screen
            if (_.device('smartphone')) return;
            app.grid.selection.on('selection:doubleclick', function (e, key) {
                ox.launch('io.ox/contacts/detail/main', { cid: key });
            });
        },

        'delete:contact-mobile': function (app) {
            if (_.device('!smartphone')) return;
            api.on('delete', function () {
                if (app.pages.getCurrentPage().name === 'detailView') {
                    app.pages.goBack();
                }
            });
        },

        'update:image': function () {
            api.on('update:image', function (evt, updated) {
                //compare cids, because of all kind of different results from some strange API
                if (_.cid(updated) === _.cid(app.currentContact)) {
                    app.showContact(app.currentContact);
                }
            });
        },

        'update:contact': function () {
            api.on('update:contact', function (e, updated) {
                if (_.cid(updated) === _.cid(app.currentContact)) {
                    app.showContact(app.currentContact);
                }
            });
        },
        /*
         * Folder view support
         */
        'folder-view': function (app) {

            app.treeView = new TreeView({ app: app, contextmenu: true, flat: true, indent: false, module: 'contacts' });
            FolderView.initialize({ app: app, tree: app.treeView });
            app.folderView.resize.enable();
        },

        /*
         * Default application properties
         */
        'props': function (app) {
            // introduce shared properties
            app.props = new Backbone.Model({
                'checkboxes': _.device('smartphone') ? false : app.settings.get('showCheckboxes', false),
                'mobileFolderSelectMode': false
            });
        },

        'vgrid-checkboxes': function (app) {
            // always hide checkboxes on small devices initially
            if (_.device('smartphone')) return;
            var grid = app.getGrid();
            grid.setEditable(app.props.get('checkboxes'));
        },

        'vgrid-checkboxes-mobile': function (app) {
            // always hide checkboxes on small devices initially
            if (_.device('!smartphone')) return;
            var grid = app.getGrid();
            app.props.on('change:checkboxes', function () {
                grid.setEditable(app.props.get('checkboxes'));
            });

        },

        'prop-fullnameformat': function (app) {
            // redraw contact if fullNameFormat changes to correctly display selected contact name
            settings.on('change:fullNameFormat', function () {
                app.showContact(app.currentContact);
            });
        },

        'prop-mapService': function (app) {
            // redraw contact if mapService changes
            settings.on('change:mapService', function () {
                app.showContact(app.currentContact);
            });
        },

        /*
         * Set folderview property
         */
        'prop-folderview': function (app) {
            app.props.set('folderview', _.device('smartphone') ? false : app.settings.get('folderview/visible/' + _.display(), true));
        },

        /*
         * Store view options
         */
        'store-view-options': function (app) {
            if (_.device('smartphone')) return;
            app.props.on('change', _.debounce(function () {
                if (app.props.get('find-result')) return;
                var data = app.props.toJSON();
                app.settings
                    .set('showCheckboxes', data.checkboxes)
                    .save();
            }, 500));
        },

        /*
         * Respond to folder view changes
         */
        'change:folderview': function (app) {
            if (_.device('smartphone')) return;
            app.props.on('change:folderview', function (model, value) {
                app.folderView.toggle(value);
            });
            app.on('folderview:close', function () {
                app.props.set('folderview', false);
            });
            app.on('folderview:open', function () {
                app.props.set('folderview', true);
            });
        },

        'change:folder': function (app) {
            if (_.device('smartphone')) return;
            // folder change
            app.grid.on('change:ids', function () {
                ext.point('io.ox/contacts/thumbIndex').invoke('draw', app.thumbs, app.baton);
            });
        },

        'folder-view-mobile-listener': function () {
            if (_.device('!smartphone')) return;
            // always change folder on click
            // No way to use tap here since folderselection really messes up the event chain
            app.pages.getPage('folderTree').on('click', '.folder.selectable', function (e) {
                if (app.props.get('mobileFolderSelectMode') === true) {
                    // open menu
                    $(e.currentTarget).trigger('contextmenu');
                    // do not change page in edit mode
                    return;
                }

                // do not open listview when folder is virtual
                var id = $(e.target).closest('.folder').data('id');
                if (folderAPI.isVirtual(id)) return;

                app.pages.changePage('listView');
            });
        },

        'change:folder-mobile': function () {
            if (_.device('!smartphone')) return;
            app.grid.on('change:ids', function () {
                ext.point('io.ox/contacts/thumbIndex').invoke('draw', app.thumbs, app.baton);
                app.folder.getData().done(function (d) {
                    app.pages.getNavbar('listView').setTitle(d.title);
                });

            });
        },

        'toggle-folder-editmode': function (app) {

            if (_.device('!smartphone')) return;

            var toggle =  function () {

                var page = app.pages.getPage('folderTree'),
                    state = app.props.get('mobileFolderSelectMode'),
                    right = state ? gt('Edit') : gt('Cancel');

                app.props.set('mobileFolderSelectMode', !state);
                app.pages.getNavbar('folderTree').setRight(right);
                page.toggleClass('mobile-edit-mode', !state);
            };

            app.toggleFolders = toggle;
        },

        /*
         * Respond to change:checkboxes
         */
        'change:checkboxes': function (app) {
            if (_.device('smartphone')) return;
            app.props.on('change:checkboxes', function (model, value) {
                var grid = app.getGrid();
                grid.setEditable(value);
            });
        },

        /*
         * Folderview toolbar
         */
        'folderview-toolbar': function (app) {
            if (_.device('smartphone')) return;
            commons.mediateFolderView(app);
        },

        'premium-area': function (app) {

            ext.point('io.ox/contacts/sidepanel').extend({
                id: 'premium-area',
                index: 10000,
                draw: function () {
                    this.append(
                        commons.addPremiumFeatures(app, {
                            append: false,
                            upsellId: 'folderview/contacts/bottom',
                            upsellRequires: 'carddav'
                        })
                    );
                }
            });
        },

        /*
         * change to default folder on no permission or folder not found errors
         */
        'folder-error': function (app) {
            app.folder.handleErrors();
        },

        'account-errors': function (app) {
            var accountError;
            app.treeView.on('click:account-error', function (folder) {

                accountError = folder.meta && folder.meta.errors ? folder.meta : false;

                if (!accountError) return;
                accountError.error = gt('The subscription could not be updated due to an error and must be recreated.');

                require(['io.ox/backbone/views/modal', 'io.ox/core/notifications'], function (ModalDialog) {
                    new ModalDialog({
                        point: 'io.ox/contacts/account-errors',
                        //#. title of dialog when contact subscription needs to be recreated on error
                        title: gt('Contacts account error')
                    })
                    .extend({
                        default: function () {
                            this.$body.append(
                                $('<div class="info-text">')
                                    .css('word-break', 'break-word')
                                    .text(accountError.error)
                            );
                        }
                    })
                    .addCancelButton()
                    .addButton({ label: gt('Edit subscription'), action: 'subscription', className: 'btn-primary' })
                    .on('subscription', function () {
                        var options = { id: 'io.ox/core/sub' };
                        ox.launch('io.ox/settings/main', options).done(function () {
                            this.setSettingsPane(options);
                        });
                    })
                    .open();
                });
            });
        },

        'api-events': function (app) {
            api.on('create update delete refresh.all', function () {
                folderAPI.reload(app.folder.get());
            });
        },

        'import': function () {
            api.on('import', function () {
                //update current detailview
                api.trigger('update:' + _.ecid(app.currentContact));
            });
        },

        'api-create-event': function (app) {
            if (_.device('smartphone')) return;

            api.on('create', function (e, data) {
                data.folder_id = data.folder_id || data.folder;
                app.folder.set(data.folder_id).done(function () {
                    app.grid.setPreSelection(data);
                });
            });
        },

        'drag-and-drop': function (app) {
            // drag & drop
            app.getWindow().nodes.outer.on('selection:drop', function (e, baton) {
                actionsUtil.invoke('io.ox/contacts/actions/move', baton);
            });
        },

        'inplace-find': function (app) {
            if (_.device('smartphone') || !capabilities.has('search')) return;
            if (!app.isFindSupported()) return;
            app.initFind();
        },

        'contextual-help': function (app) {
            app.getContextualHelp = function () {
                return 'ox.appsuite.user.sect.contacts.gui.html';
            };
        },

        // reverted for 7.10
        // 'primary-action': function (app) {

        //     app.addPrimaryAction({
        //         point: 'io.ox/contacts/sidepanel',
        //         label: gt('New contact'),
        //         action: 'io.ox/contacts/actions/create',
        //         toolbar: 'create'
        //     });
        // },

        'sidepanel': function (app) {

            ext.point('io.ox/contacts/sidepanel').extend({
                id: 'tree',
                index: 100,
                draw: function (baton) {
                    // add border & render tree and add to DOM
                    this.addClass('border-right').append(baton.app.treeView.$el);
                }
            });

            var node = app.getWindow().nodes.sidepanel;
            ext.point('io.ox/contacts/sidepanel').invoke('draw', node, ext.Baton({ app: app }));
        },

        'detailviewResizehandler': function (app) {
            if (_.device('smartphone')) return;
            app.right.toggleClass('small-width', app.right.width() < 500);
            $(document).on('resize', function () {
                app.right.toggleClass('small-width', app.right.width() < 500);
            });
        },

        'metrics': function (app) {

            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;

                var nodes = app.getWindow().nodes,
                    sidepanel = nodes.sidepanel;

                function track(target, node) {
                    node = $(node);
                    var isSelect = !!node.attr('data-name'),
                        action = (node.attr('data-action') || '').replace(/^io\.ox\/contacts\/(detail\/)?/, '');
                    metrics.trackEvent({
                        app: 'contacts',
                        target: target,
                        type: 'click',
                        action: isSelect ? node.attr('data-name') : action,
                        detail: isSelect ? node.attr('data-value') : ''
                    });
                }

                // main toolbar: actions, view dropdown
                nodes.body.on('track', '.classic-toolbar-container', function (e, node) {
                    track('toolbar', node);
                });

                // vgrid toolbar
                nodes.main.find('.vgrid-toolbar').on('mousedown', 'a[data-name], a[data-action]', function (e) {
                    var node = $(e.currentTarget);
                    var action = node.attr('data-name') || node.attr('data-action');
                    if (!action) return;
                    metrics.trackEvent({
                        app: 'contacts',
                        target: 'list/toolbar',
                        type: 'click',
                        action: action
                    });
                });
                // folder tree action
                _.defer(function () {
                    sidepanel.find('.context-dropdown').on('mousedown', 'a', function (e) {
                        metrics.trackEvent({
                            app: 'contacts',
                            target: 'folder/context-menu',
                            type: 'click',
                            action: $(e.currentTarget).attr('data-action')
                        });
                    });
                });
                sidepanel.find('.bottom').on('mousedown', 'a[data-action]', function (e) {
                    var node = $(e.currentTarget);
                    if (!node.attr('data-action')) return;
                    metrics.trackEvent({
                        app: 'contacts',
                        target: 'folder/toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // check for clicks in folder trew
                app.on('folder:change folder-virtual:change', function (folder) {
                    metrics.getFolderFlags(folder)
                        .then(function (list) {
                            metrics.trackEvent({
                                app: 'contacts',
                                target: 'folder',
                                type: 'click',
                                action: 'select',
                                detail: list.join('/')
                            });
                        });
                });
                // selection in listview
                app.grid.selection.on({
                    'change': function (event, list, opt) {
                        if (opt && opt.retriggerUnlessEmpty) return;
                        if (!list.length) return;
                        metrics.trackEvent({
                            app: 'contacts',
                            target: 'list',
                            type: 'click',
                            action: 'select',
                            detail: list.length > 1 ? 'multiple' : 'one'
                        });
                    }
                });
            });
        }
    });

    // launcher
    app.setLauncher(function (options) {

        // get window
        var win = ox.ui.createWindow({
            name: 'io.ox/contacts',
            chromeless: true,
            find: capabilities.has('search')
        });

        app.setWindow(win);
        app.settings = settings;

        app.gridContainer = $('<div class="abs border-left border-right contact-grid-container">')
            .attr({
                role: 'navigation',
                'aria-label': gt('Contacts')
            });

        app.grid = new VGrid(app.gridContainer, {
            settings: settings,
            hideTopbar: _.device('smartphone'),
            hideToolbar: _.device('smartphone'),
            containerLabel: gt('Contact list. Select a contact to view details.'),
            dividerThreshold: settings.get('dividerThreshold', 30)
            //swipeRightHandler: swipeRightHandler,
        });

        app.gridContainer.find('.vgrid-toolbar').attr('aria-label', gt('Contacts toolbar'));

        commons.wireGridAndWindow(app.grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(app.grid, api, win);
        if (_.device('!smartphone')) commons.addGridToolbarFolder(app, app.grid, 'CONTACTS');

        app.getGrid = function () {
            return app.grid;
        };

        if (capabilities.has('gab !alone') && !options.folder && app.settings.get('startInGlobalAddressbook', true)) options.folder = '6';

        // go!
        var def = $.Deferred();
        commons.addFolderSupport(app, app.grid, 'contacts', options.folder)
            .always(function () {
                app.mediate();
                // only resolve once mediate was called otherwise we get ugly runtime issues
                def.resolve();
                win.show();
            });
        return def;
    });

    // set what to do if the app is started again
    // this way we can react to given options, like for example a different folder
    app.setResume(function (options) {
        // only consider folder option for now
        if (options && options.folder && options.folder !== this.folder.get()) {
            var appNode = this.getWindow();
            appNode.busy();
            return this.folder.set(options.folder).always(function () {
                appNode.idle();
            });
        }
        return $.when();
    });

    return {
        getApp: app.getInstance
    };
});
