/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/search/plugins', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    // field facet 'subject' only once
    ext.point('io.ox/search/api/autocomplete').extend({
        id: 'only-once',
        index: 300,
        customize: function (baton) {
            var model = baton.app.getModel(),
                subject = _.where(model.get('poollist'), { facet: 'subject' });

            if (subject.length === 0) return;

            //filter subject facet
            baton.data = _.filter(baton.data, function (facet) {
                return facet.id !== 'subject';
            });
        }
    });

    // add history entries to autocomplete response
    ext.point('io.ox/search/api/autocomplete').extend({
        id: 'custom-facet-history',
        index: 300,
        customize: function (baton) {
            var model = baton.app.getModel(),
                facet = _.copy(baton.data[0]),
                history = model.get('extensions').history;

            if (!facet || facet.id !== 'global') return;
            // add last three machting history entries (substring compare)
            var query = model.get('query'),
                //global = data.list.shift(),
                entries = _.chain(history)
                    .filter(function (h) {
                        return h.name.indexOf(query) >= 0;
                    })
                    .last(3)
                    .value()
                    .reverse();
            // add entries right after index 0
            baton.data.splice.apply(
                baton.data,
                [1, 0].concat(
                    _.copy(entries)
                )
            );
        }
    });

    // register listerner to add history entries
    ext.point('io.ox/search').extend({
        index: 100,
        id: 'custom-facet-history',
        config: function () {
            var model = this;
            // listener that adds new history entries
            model.on({
                'facet:add': function (facet, value) {
                    var history = model.get('extensions').history;
                    // handle search history
                    if (facet === 'global') {
                        // copy global facet, manipulate and store as history entry
                        var entry = _.copy(model.get('pool')[facet].values[value]);
                        entry.id = facet + '.history' + history.length;
                        entry.flags.push('history');
                        history.push(entry);
                    }
                }
            });
        }
    });

    // add history icon to history entries
    ext.point('io.ox/search/autocomplete/item/global').extend({
        index: 100,
        id: 'custom-facet-history',
        draw: function (baton) {
            //default
            ext.point('io.ox/search/autocomplete/item').invoke('draw', this, baton);
            //add icon
            if (_.contains(baton.data.flags, 'history')) {
                this.find('.name').prepend(
                    $('<i class="fa fa-clock-o" aria-hidden="true">').css('margin-right', '6px')
                );
            }
        }
    });
});
