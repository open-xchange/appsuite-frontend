/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/views/actions/util', [
    'io.ox/core/extensions',
    'io.ox/core/upsell',
    'io.ox/core/folder/api',
    'io.ox/core/collection',
    'io.ox/core/capabilities'
], function (ext, upsell, api, Collection, capabilities) {

    'use strict';

    var util = {

        // just to make identifying actions easier
        Action: function (id, options) {
            ext.point(id).extend(_.extend({ id: 'default', index: 100 }, options));
        },

        createListItem: function () {
            return $('<li role="presentation">');
        },

        createDivider: function () {
            return $('<li class="divider" role="separator">');
        },

        createCaption: function (text) {
            return $('<li class="dropdown-header dropdown-description" role="presentation">').text(text);
        },

        createSectionTitle: function (text) {
            return $('<li class="dropdown-header" role="presentation">').text(text);
        },

        createDropdownToggle: function () {
            return $('<a href="#" role="button" class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" draggable="false" tabindex="-1">');
        },

        createDropdownList: function () {
            return $('<ul class="dropdown-menu" role="menu">');
        },

        createCaret: function () {
            return $('<i class="fa fa-caret-down" aria-hidden="true">');
        },

        processItem: function (baton, link) {
            // skip dropdowns
            if (link.dropdown || link.custom) return { link: link, available: true, enabled: true };
            // check link
            if (!util.checkLink(link)) return { link: link, available: false };
            // get actions
            var actions = ext.point(link.ref).list();
            // check general availability
            var available = actions.some(util.checkActionAvailability);
            if (!available) return { link: link, available: false };
            // check collection && matches
            var enabled = actions.some(util.checkActionEnabled.bind(null, baton));
            baton.resumePropagation();
            if (/\bactions/.test(_.url.hash('debug'))) {
                console.debug('item', link.ref, 'available', available, 'enabled', enabled, actions, baton.data, baton);
            }
            return { link: link, available: true, enabled: enabled };
        },

        checkLink: function (link) {
            if (!link.ref) return false;
            if (link.mobile === 'none' && _.device('smartphone')) return false;
            return true;
        },

        checkActionAvailability: function (action) {
            // feature toggle?
            if ('toggle' in action && !action.toggle) return false;
            // device?
            if (!_.device(action.device)) return false;
            // capabilities?
            if (!upsell.visible(action.capabilities)) return false;
            // otherwise
            return true;
        },

        checkActionEnabled: function (baton, action) {
            // stopped? (special case, e.g. first action stops other actions)
            if (baton.isPropagationStopped()) return false;
            // has required attribute and some items are missing it
            if (action.every && !util.every(baton.data, action.every)) return false;
            // matches as string?
            if (action.collection && !baton.collection.matches(action.collection)) return false;
            // folder check?
            if (action.folder && !util.checkFolder(baton, action)) return false;
            // matches as function?
            if (_.isFunction(action.matches)) {
                try {
                    return action.matches(baton);
                } catch (e) {
                    console.error(e);
                    return false;
                }
            }
            // otherwise
            return true;
        },

        createItem: function (baton, item) {
            if (!item.available) return;
            if (!item.enabled && !item.link.steady) return;
            var $li = util.createListItem(), def;
            // nested dropdown?
            if (item.link.dropdown) {
                def = util.renderDropdown($li, baton, { point: item.link.dropdown, title: item.link.title, icon: item.link.icon });
                return { $li: $li, def: def };
            }
            // use own draw function?
            if (item.link.custom) {
                item.link.draw.call($li, baton);
            } else {
                util.renderListItem($li, baton, item);
            }
            // finally looks for async checks
            return { $li: $li, def: util.processAsync($li, baton, item) };
        },

        // cover matchesAsync
        // some actions need to run async checks
        // toolbar item gets hidden or disabled (if steady) until function resolves
        processAsync: function ($li, baton, item) {
            var list = ext.point(item.link.ref).list().filter(function (action) {
                return _.isFunction(action.matchesAsync);
            });
            // return early if there is no matchesAsync
            if (!list.length) return [];
            // hide element
            if (item.link.steady) $li.children('a').addClass('disabled').attr('aria-disabled', true);
            else $li.addClass('hidden');
            // process matchesAsync
            var deps = list.map(function (action) {
                return $.when(action.matchesAsync(baton)).pipe(null, _.constant(false));
            });
            // wait for all matchesAsync
            return $.when.apply($, deps).done(function () {
                var state = _(arguments).every(Boolean);
                if (!state) {
                    if (!item.link.steady) $li.remove();
                    return;
                }
                if (item.link.steady) $li.children('a').removeClass('disabled').attr('aria-disabled', null);
                else $li.removeClass('hidden');
            });
        },

        waitForAllAsyncItems: function (items, callback) {
            var defs = _(items).chain().pluck('def').flatten().compact().value();
            return $.when.apply($, defs).done(callback);
        },

        renderListItem: function ($li, baton, item) {
            $li
            .attr('data-prio', item.link[_.device('smartphone') ? 'mobile' : 'prio'] || 'lo')
            .data({
                section: item.link.section,
                sectionTitle: item.link.sectionTitle,
                caption: item.link.caption
            })
            .on('shown.bs.dropdown dispose', function () {
                $(this).children('a').tooltip('destroy');
            })
            .append(function () {
                var icon = item.link.icon,
                    title = item.link.title,
                    tooltip = item.link.tooltip || (icon && title),
                    $a = $('<a href="#" role="button" draggable="false" tabindex="-1">')
                    .data({ baton: baton })
                    .attr({ 'data-action': item.link.ref, 'title': title });
                // icon vs title
                if (icon) $a.append($('<i>').addClass(icon));
                else if (title) $a.text(title);
                if (!item.enabled) {
                    // style as disabled
                    $a.addClass('disabled').attr('aria-disabled', true);
                } else if (tooltip) {
                    $a.addActionTooltip(tooltip);
                }
                // customize (setTimeout so that the node is already added)
                if (item.link.customize) setTimeout(item.link.customize.bind($a, baton));
                return $a;
            });
        },

        renderDropdown: function ($el, baton, options) {

            var $toggle = util.createDropdownToggle();
            if (options.title) $toggle.text(options.title).append(util.createCaret());
            else if (options.icon) $toggle.append($('<i>').addClass(options.icon));

            $el.addClass('dropdown').append($toggle, util.createDropdownList());

            return baton ? util.renderDropdownItems($el, baton, options) : $.when();
        },

        renderDropdownItems: function ($el, baton, options) {

            var items = ext.point(options.point).list()
                    .map(util.processItem.bind(null, baton))
                    .map(util.createItem.bind(null, baton))
                    .filter(Boolean);

            var $ul = $el.find('> .dropdown-menu');
            $ul.empty().append(_(items).pluck('$li'));
            $ul.find('a[role="button"]').attr('role', 'menuitem');

            return util.waitForAllAsyncItems(items, function () {
                util.injectSectionDividers($ul);
                // disable empty or completely disabled drop-downs
                var disabled = !$ul.find('[data-action]:not(.disabled)').length;
                $el.find('.dropdown-toggle').toggleClass('disabled', disabled).attr('aria-disabled', disabled);
            });
        },

        injectSectionDividers: function ($ul) {
            var section = null;
            $ul.children().each(function (i, node) {
                var data = $(node).data();
                // add link caption?
                if (data.caption) util.createCaption(data.caption).insertAfter(node);
                if (data.section === section) return;
                section = data.section;
                // inject divider
                // avoid divider before first item
                if (i !== 0) util.createDivider().insertBefore(node);
                // inject section title (also for first item)
                if (data.sectionTitle) util.createSectionTitle(data.sectionTitle).insertBefore(node);
            });
        },

        hasActions: function ($el) {
            return $el.find('ul > li > a:not(.disabled)').length > 0;
        },

        invokeByEvent: function (e) {
            e.preventDefault();
            var node = $(e.currentTarget), baton = node.data('baton'), action = node.data('action');
            // baton might be undefined if the toolbar gets removed by other handlers (e.g. viewer closes)
            if (node.hasClass('disabled') || !baton) return;
            baton.e = e;
            util.invoke(action, baton);
            _.defer(function () { node.tooltip('hide'); });
        },

        // fast simple one-way variant of _.cid
        cid: function (data) {
            return [data.folder_id || data.folder, data.id, data.recurrenceId].filter(Boolean).join('.');
        },

        // every item in array needs to match given condition
        every: function (array, condition) {
            var expr = String(condition || '').replace(/\w[\w:]+/ig, function (match) {
                if (/^(undefined|null|true|false)$/.test(match)) return match;
                return 'data["' + match + '"]';
            });
            try {
                /*eslint no-new-func: 0*/
                var fn = new Function('data', 'return !!(' + expr + ')');
                return array.every(fn);
            } catch (e) {
                console.error('every', e, condition, array);
                return false;
            }
        },

        // check folder-specific capabilities
        checkFolder: function (baton, action) {
            if (baton.folder_id === undefined) {
                console.error('ToolbarView > checkFolder: No folder_id given', action, baton);
                return false;
            }
            var model = api.pool.models[baton.folder_id];
            if (!model) return false;
            var condition = String(action.folder).replace(/\w[\w:]+/ig, function (match) {
                if (/^(undefined|null|true|false)$/.test(match)) return match;
                return model.can(match.toLowerCase());
            });
            try {
                /*eslint no-new-func: 0*/
                return new Function('return !!(' + condition + ')')();
            } catch (e) {
                console.error('checkFolder', action.folder, 'condition', condition, model, e);
                return false;
            }
        },

        setSelection: function (selection, options) {

            // inject finalize per instance
            if (!this.setSelection.finalize) addFinalize(this.setSelection);

            if (!options) options = {};
            else if (_.isFunction(options)) options = options.call();

            // true = sync; this = thisArg for finalize
            var cont = _.lfo(true, this, this.setSelection.finalize);

            (options.promise ? options : $.when(options)).done(function (options) {
                if (this.options.simple) {
                    cont(options, selection, new Collection.Simple(selection));
                } else {
                    // we prefer options.data as it might provide object_permissions
                    var collection = new Collection(options.data || selection);
                    collection.getProperties().done(function () { cont(options, selection, collection); });
                }
            }.bind(this));

            return this;
        },

        // convenience function (data is object or array of object)
        setData: function (data) {
            data = [].concat(data);
            this.setSelection(data, { data: data });
            return this;
        },

        getBaton: function (data, options) {
            return ext.Baton(_.extend({ data: data, selection: data, collection: new Collection.Simple(data) }, options));
        },

        invoke: function (ref, baton) {

            var point = ext.point(ref),
                // get all sets of capabilities including empty sets
                sets = point.pluck('capabilities'),
                list = point.list(),
                done = $.Deferred();

            // check capabilities upfront; if no action can be applied due to missing
            // capabilities, we try to offer upsell
            // if an action has an empty set we must not run into upsell (see bug 39009)
            if (sets.length && !upsell.any(sets)) {
                if (upsell.enabled(sets)) {
                    upsell.trigger({
                        type: 'inline-action',
                        id: ref,
                        missing: upsell.missing(sets)
                    });
                }
                return done.resolve();
            }

            baton = ensureBaton(baton);

            new (baton.simple ? Collection.Simple : Collection)(baton.array())
                .getPromise()
                .pipe(function (collection) {
                    baton.collection = collection;
                    nextAction();
                });

            function nextAction() {
                var action = list.shift();
                if (action) checkAction(action); else done.resolve();
            }

            function checkAction(action) {
                // has action callback?
                if (!_.isFunction(action.action)) return nextAction();
                // avoid default behaviour?
                if (action.id === 'default' && baton.isDefaultPrevented()) return nextAction();
                // check for disabled extensions
                if (baton.isDisabled(point.id, action.id)) return nextAction();
                // has all capabilities?
                if (action.capabilities && !capabilities.has(action.capabilities)) return nextAction();
                // check general availability
                if (!util.checkActionAvailability(action)) return nextAction();
                // check specific context
                if (!util.checkActionEnabled(baton, action)) return nextAction();
                // check async matches
                if (_.isFunction(action.matchesAsync)) return checkMatchesAsync(action, baton);
                // call action directly
                callAction(action, baton);
            }

            function checkMatchesAsync(action, baton) {
                // use pipe to avoid async behavior
                $.when(action.matchesAsync(baton)).pipe(function (state) {
                    if (state) callAction(action, baton); else nextAction();
                });
            }

            function callAction(action, baton) {
                try {
                    action.action(baton);
                } catch (e) {
                    console.error('point("' + ref + '") > invoke()', e.message, {
                        baton: baton,
                        action: action,
                        exception: e
                    });
                } finally {
                    done.resolve();
                }
            }

            return done;
        },

        checkAction: function (action, baton) {
            var actions = ext.point(action).list();
            if (!actions.some(util.checkActionAvailability)) return $.when(false);
            baton = ensureBaton(baton);
            return new (baton.simple ? Collection.Simple : Collection)(baton.array())
                .getPromise()
                .pipe(function (collection) {
                    baton.collection = collection;
                    if (!actions.some(util.checkActionEnabled.bind(null, baton))) return $.when([false]);
                    var defs = actions
                        .filter(function (action) {
                            return _.isFunction(action.matchesAsync);
                        })
                        .map(function (action) {
                            return $.when(action.matchesAsync(baton));
                        });
                    return $.when.apply($, defs);
                })
                .pipe(function () {
                    return _(arguments).some(Boolean) ? $.when(baton) : $.Deferred().reject();
                });
        }
    };

    function addFinalize(fn) {
        fn.finalize = function (options, selection, collection) {
            if (this.disposed) return;
            var baton = ext.Baton(_.extend(options, { selection: selection, collection: collection }));
            this.render(baton);
        };
    }

    function ensureBaton(data) {
        if (data instanceof ext.Baton) return data;
        if (!_.isArray(data)) data = [data];
        return ext.Baton({ data: data });
    }

    $.fn.addActionTooltip = function (title) {
        return $(this)
            .attr({
                'data-original-title': title,
                // tooltip removes title attribute, therefore we always add aria-label for screen reader support
                'aria-label': title,
                'data-placement': 'bottom',
                'data-animation': 'false',
                'data-container': 'body'
            })
            .tooltip({ trigger: 'hover' });
    };

    return util;
});
