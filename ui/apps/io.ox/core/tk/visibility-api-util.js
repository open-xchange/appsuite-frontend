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

define('io.ox/core/tk/visibility-api-util', [
], function () {

    // use this util when wanting to use the visibility api
    // just listen to 'visibility-changed' on the api instead of the specific browser related events

    var api = {
            isHidden: false,
            isSupported: false,
            hiddenAttribute: '',
            visibilityChangeEvent: ''
        },
        tempHiddenAttribute,
        tempVisibilityChangeEvent;

    //try to find the visibility api attributes
    //using some modified code snippets from https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API
    if (typeof document.hidden !== 'undefined') {
        tempHiddenAttribute = 'hidden';
        tempVisibilityChangeEvent = 'visibilitychange';
    } else if (typeof document.mozHidden !== 'undefined') {
        tempHiddenAttribute = 'mozHidden';
        tempVisibilityChangeEvent = 'mozvisibilitychange';
    } else if (typeof document.msHidden !== 'undefined') {
        tempHiddenAttribute = 'msHidden';
        tempVisibilityChangeEvent = 'msvisibilitychange';
    } else if (typeof document.webkitHidden !== 'undefined') {
        tempHiddenAttribute = 'webkitHidden';
        tempVisibilityChangeEvent = 'webkitvisibilitychange';
    }

    if (typeof document[tempHiddenAttribute] !== 'undefined') {
        api.isSupported = true;

        api.hiddenAttribute = tempHiddenAttribute;
        api.visibilityChangeEvent = tempVisibilityChangeEvent;

        api.isHidden = !!document[tempHiddenAttribute];
        $(document).on(tempVisibilityChangeEvent, function handleVisibilityChange() {
            var oldState = api.isHidden;
            api.isHidden = !!document[api.hiddenAttribute];
            $(api).trigger('visibility-changed', { currentHiddenState: api.isHidden, oldState: oldState });
        });
    }

    return api;
});
