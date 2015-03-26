/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
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

        api.isHidden = document[tempHiddenAttribute] ? true : false;
        $(document).on(tempVisibilityChangeEvent, function handleVisibilityChange() {
            var oldState = api.isHidden;
            api.isHidden = document[api.hiddenAttribute] ? true : false;
            $(api).trigger('visibility-changed', { currentHiddenState:api.isHidden, oldState: oldState });
        });
    }

    return api;
});
