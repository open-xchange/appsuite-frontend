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
    'io.ox/core/capabilities',
    'settings!io.ox/core'
], function (ext, upsell, api, Collection, capabilities, settings) {

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
            // check priority (none)
            if (!util.checkPriority(link)) return { link: link, available: false };
            // skip dropdowns
            if (link.dropdown || link.custom) return { link: link, available: true, enabled: true };
            // get actions
            var actions = link.ref ? ext.point(link.ref).list() : [];
            // check general availability
            var available = actions.filter(util.checkActionAvailability);
            if (!available.length) return { link: link, available: false };
            // check collection && matches
            var enabled = available.filter(util.checkActionEnabled.bind(null, baton));
            if (/\bactions/.test(_.url.hash('debug'))) {
                console.debug('item', link.ref, 'available', available, 'enabled', enabled.length > 0, 'action', actions, 'baton', baton);
            }
            return { link: link, available: true, enabled: enabled.length > 0, actions: enabled };
        },

        checkPriority: function (link) {
            return link[_.device('smartphone') ? 'mobile' : 'prio'] !== 'none';
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
            // otherwise
            return true;
        },

        createItem: function (baton, item) {
            if (!item.available) return;
            if (!item.enabled && !item.link.drawDisabled) return;
            var $li = util.createListItem(), link = item.link, def;
            // nested dropdown?
            if (link.dropdown) {
                def = util.renderDropdown($li, baton, {
                    caret: link.caret,
                    customize: link.customize,
                    drawDisabled: link.drawDisabled,
                    icon: link.icon,
                    point: link.dropdown,
                    title: getTitle(link.title || link.label, baton),
                    tooltip: link.tooltip
                });
                return { $li: $li, def: def };
            }
            // use own draw function?
            if (link.custom) {
                link.draw.call($li, baton);
            } else {
                util.renderListItem($li, baton, item);
            }
            // finally looks for dynamic checks
            return { $li: $li, def: util.processMatches($li, baton, item) };
        },

        // some actions need to run further checks
        // toolbar item gets hidden or disabled (if drawDisabled) until function resolves
        processMatches: function ($li, baton, item) {

            var actions = item.actions || [],
                result = $.Deferred();

            // return true if there is no action to check
            if (actions.length) nextAction(); else result.resolve(true);

            function nextAction() {
                var action = actions.shift();
                if (action && !baton.isPropagationStopped()) checkAction(action); else result.resolve(false);
            }

            function checkAction(action) {
                matches(baton, action, false)
                    .done(function (state) {
                        if (state) result.resolve(true); else nextAction();
                    })
                    .fail(nextAction);
            }

            return result.done(function (state) {
                baton.resumePropagation();
                if (state) return;
                if (item.link.drawDisabled) $li.children('a').addClass('disabled').attr('aria-disabled', true);
                else $li.addClass('hidden');
            });
        },

        waitForMatches: function (items, callback) {
            var defs = _(items).chain().pluck('def').flatten().compact().value();
            return $.when.apply($, defs).done(callback);
        },

        renderListItem: function ($li, baton, item) {

            function isUpsell(item) {
                if (!item.actions[0]) return false;
                var requires = item.actions[0].capabilities;
                return !upsell.has(requires) && upsell.enabled(requires);
            }

            $li
            .attr('data-prio', item.link[_.device('smartphone') ? 'mobile' : 'prio'] || 'lo')
            .data({
                section: item.link.section,
                sectionTitle: item.link.sectionTitle,
                caption: item.link.caption
            })
            .on('shown.bs.dropdown', hideTooltip)
            .append(function () {
                var $a = $('<a href="#" role="button" draggable="false" tabindex="-1">')
                    .data({ baton: baton })
                    .attr({ 'data-action': item.link.ref });
                applyIconTitleTooltip($a, item.link, baton, item.enabled);
                if (!item.enabled) $a.addClass('disabled').attr('aria-disabled', true);
                if (!isUpsell(item)) return $a;
                // add upsell icon
                return $a.addClass('upsell').append(
                    $('<i class="upsell-icon fa">').addClass(settings.get('upsell/defaultIcon', 'fa-star'))
                );
            });
        },

        renderDropdown: function ($el, baton, options) {

            var $toggle = util.createDropdownToggle().attr('data-dropdown', options.point);
            applyIconTitleTooltip($toggle, options, baton);
            if (options.caret !== false) $toggle.append(util.createCaret());

            var $ul = util.createDropdownList();
            $el.addClass('dropdown').append($toggle, $ul);
            // close tooltip when opening the dropdown
            $el.on('shown.bs.dropdown', hideTooltip);
            if (_.device('smartphone')) util.bindActionEvent($ul);

            return baton ? util.renderDropdownItems($el, baton, options) : $.when();
        },

        renderDropdownItems: function ($el, baton, options) {

            var items = ext.point(options.point).list()
                    .map(util.processItem.bind(null, baton))
                    .map(util.createItem.bind(null, baton))
                    .filter(Boolean);

            var $ul = $el.find('> .dropdown-menu');
            $ul.empty().append(_(items).pluck('$li'));

            return util.waitForMatches(items, function () {
                util.injectSectionDividers($ul);
                // disable empty or completely disabled drop-downs
                var disabled = !$ul.find('[data-action]:not(.disabled)').length;
                if (disabled) if (options.drawDisabled) $el.find('.dropdown-toggle').addClass('disabled').attr('aria-disabled', true); else $el.hide();
            });
        },

        injectCaption: function name(li) {
            li = $(li);
            var link = li.find('a'), id,
                caption = util.createCaption(li.data('caption'));
            // screenreader support
            id = _.uniqueId('link-description-');
            caption.attr('id', id);
            link.attr('aria-describedby', id);
            // ux convenience: retrigger clicks
            caption.on('click', link.trigger.bind(link, 'click'));
            caption.insertAfter(li);
        },

        injectSectionDividers: function ($ul) {
            var section = null;
            // clean up first
            $ul.find('li.hidden').remove();
            $ul.find('a[role="button"]').attr('role', 'menuitem');
            // inject sections
            $ul.children().each(function (i, node) {
                var data = $(node).data();
                // add link caption?
                if (data.caption) util.injectCaption(node);
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
                if (match === 'gab') return String(baton.folder_id) === '6';
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
            if (!this.setSelectionFinalize) addFinalize(this);

            if (!options) options = {};
            else if (_.isFunction(options)) options = options.call();

            // true = sync; this = thisArg for finalize
            var cont = _.lfo(true, this, this.setSelectionFinalize);

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

        invoke: function (ref, baton, checkOnly) {

            var point = ext.point(ref),
                // get all sets of capabilities including empty sets
                sets = point.pluck('capabilities'),
                list = point.list(),
                done = $.Deferred();

            // check capabilities upfront; if no action can be applied due to missing
            // capabilities, we try to offer upsell
            // if an action has an empty set we must not run into upsell (see bug 39009)
            if (sets.length && !upsell.any(sets)) {
                if (!checkOnly && upsell.enabled(sets)) {
                    upsell.trigger({
                        type: 'inline-action',
                        id: ref,
                        missing: upsell.missing(sets)
                    });
                }
                return done.resolve(false);
            }

            baton = ensureBaton(baton);

            if (!baton.collection) {
                new (baton.simple ? Collection.Simple : Collection)(baton.array())
                    .getPromise()
                    .pipe(function (collection) {
                        baton.collection = collection;
                        nextAction();
                    });
            } else {
                nextAction();
            }

            function nextAction() {
                var action = list.shift();
                if (action) checkAction(action); else done.resolve(false);
            }

            function checkAction(action) {
                // avoid default behaviour?
                if (action.id === 'default' && baton.isDefaultPrevented()) return nextAction();
                // check for disabled extensions
                if (baton.isDisabled(point.id, action.id)) return nextAction();
                // has all capabilities?
                if (action.capabilities && !capabilities.has(action.capabilities)) return nextAction();
                // check general availability
                if (!util.checkActionAvailability(action)) return nextAction();
                // static checks
                if (!util.checkActionEnabled(baton, action)) return nextAction();
                // dynamic checks
                if (hasMatches(action)) return checkMatches(action, baton);
                // call action directly
                callAction(action, baton);
            }

            function checkMatches(action, baton) {
                try {
                    matches(baton, action, true)
                        .done(function (state) {
                            if (state) callAction(action, baton); else nextAction();
                        })
                        .fail(nextAction);
                } catch (e) {
                    console.error(e);
                    nextAction();
                }
            }

            function callAction(action, baton) {
                try {
                    if (!checkOnly) {
                        if (_.isFunction(action.action)) action.action(baton);
                        else if (_.isString(action.action)) require([action.action], function (fn) { fn(baton); });
                        else if (_.isFunction(action.multiple)) action.multiple(baton.array(), baton);
                        ox.trigger('action:invoke action:invoke:' + ref, baton, action, ref);
                    }
                } catch (e) {
                    console.error('point("' + ref + '") > invoke()', e.message, {
                        baton: baton,
                        action: action,
                        exception: e
                    });
                } finally {
                    done.resolve(true);
                }
            }

            return done;
        },

        checkAction: function (action, baton) {
            return util.invoke(action, baton, true).pipe(function (state) {
                return state ? baton : $.Deferred().reject();
            });
        },

        addBackdrop: function ($el) {

            var $toggle = $el.find('.dropdown-toggle'),
                $menu = $el.find('.dropdown-menu'),
                $backdrop = $('<div class="smart-dropdown-container dropdown open" role="navigation">').on('click contextmenu', toggle),
                className = $el.attr('class');

            // listen for click event directly on menu for proper backdrop support
            util.bindActionEvent($menu);
            $el.on({ 'show.bs.dropdown': show, 'hide.bs.dropdown': hide, 'dispose': dispose });

            function show() {
                $backdrop.append($menu).addClass(className).appendTo('body');
                adjustPosition($toggle, $menu);
            }

            function hide() {
                $backdrop.detach();
                $menu.insertAfter($toggle);
            }

            function toggle() {
                if ($toggle) $toggle.dropdown('toggle');
                return false;
            }

            function dispose() {
                // make sure backdrop and menu are removed (might be open during dispose)
                if ($backdrop) $backdrop.remove();
                $toggle = $menu = $backdrop = null;
            }
        },

        bindActionEvent: function ($el) {
            $el.on('click', 'a[data-action]', util.invokeByEvent);
        }
    };

    function addFinalize(fn) {
        fn.setSelectionFinalize = function (options, selection, collection) {
            if (this.disposed) return;
            var baton = ext.Baton(_.extend(options, { selection: selection, collection: collection, list: this.options.list, restoreFocus: '' }));
            this.render(baton);
        };
    }

    function ensureBaton(data) {
        if (data instanceof ext.Baton) return data;
        if (!_.isArray(data)) data = [data];
        return ext.Baton({ data: data });
    }

    function hasMatches(action) {
        // action.requires is DEPRECATED
        return _.isFunction(action.quick || action.matches || action.requires);
    }

    function matches(baton, action, allowQuick) {
        // action.requires is DEPRECATED
        // action.quick is a workaround (similar to former "filter") to do a "quick" check which is not async (e.g. popup blocker problem)
        var ret = true;
        if (allowQuick && action.quick) ret = action.quick(baton);
        else if (action.matches) ret = action.matches(baton);
        else if (_.isFunction(action.requires)) ret = action.requires({ baton: baton, collection: baton.collection, data: baton.data, extension: action });
        return $.when(ret).pipe(null, _.constant(false));
    }

    function applyIconTitleTooltip($el, link, baton, enabled) {
        var icon = link.icon,
            title = getTitle(link.title || link.label, baton),
            tooltip = enabled !== false && (link.tooltip || (icon && title)),
            checkmarkFn = link.checkmarkFn;
        // icon vs title
        if (icon) $el.attr('title', title).append($.icon(icon));
        else if (title) $el.text(title);
        if (_.isFunction(checkmarkFn)) $el.prepend($('<i class="fa fa-fw" aria-hidden="true">').addClass(checkmarkFn(baton) ? 'fa-check' : 'fa-none'));
        if (tooltip) $el.addActionTooltip(tooltip);
        // setTimeout so that the node is already added
        if (link.customize) setTimeout(link.customize.bind($el, baton));
    }

    function getTitle(arg, baton) {
        return _.isFunction(arg) ? arg(baton) : arg;
    }

    // simple but sufficient so far
    function adjustPosition($toggle, $ul) {
        var data = $ul.data(),
            pos = { right: 'auto', bottom: 'auto' },
            menu = $ul.get(0).getBoundingClientRect(),
            vh = $(window).height() - 16,
            vw = $(window).width() - 16;
        if (data.top !== undefined) {
            // use predefined position, e.g. originating from a right click
            pos.top = data.top;
            pos.left = data.left;
        } else {
            var box = $toggle.get(0).getBoundingClientRect();
            pos.top = box.top + box.height;
            pos.left = $ul.hasClass('dropdown-menu-right') ? box.right - menu.width : box.left;
        }
        // ensure proper position inside viewport
        pos.top = Math.max(0, Math.min(pos.top, vh - menu.height));
        pos.left = Math.max(0, Math.min(pos.left, vw - menu.width));
        $ul.css(pos);
    }

    $.fn.addActionTooltip = function (title) {
        if (_.device('smartphone')) return $(this);
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

    function hideTooltip() {
        $(this).children('a').tooltip('hide');
    }

    return util;
});
