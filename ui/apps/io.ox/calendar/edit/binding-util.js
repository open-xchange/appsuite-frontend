/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/edit/binding-util',
      ['io.ox/core/date'], function (dateAPI) {
    'use strict';

    var BinderUtils = {
        convertDate: function (direction, value, attribute, model) {
            if (direction === 'ModelToView') {
                return BinderUtils._toDate(value, attribute, model);
            } else {
                return BinderUtils._dateStrToDate(value, attribute, model);
            }
        },
        convertTime: function (direction, value, attribute, model) {
            console.log("converttime ", direction);
            if (direction === 'ModelToView') {
                return BinderUtils._toTime(value, attribute, model, direction);
            } else {
                return BinderUtils._timeStrToDate(value, attribute, model);
            }
        },
        numToString: function (direction, value, attribute, model) {
            if (direction === 'ModelToView') {
                return value + '';
            } else {
                return parseInt(value, 10);
            }
        },

        _toDate: function (value, attribute, model) {

            var mydate, formatted;
            if (!value) {
                return null;
            }
            if (!_.isNumber(value)) {
                return value; //do nothing
            }
            mydate = dateAPI.Local.utc(parseInt(value, 10));

            if (_.isNull(mydate)) {
                return value;
            }

            formatted = new dateAPI.Local(mydate).format(dateAPI.DATE);
            console.log('_toDate ', value, attribute, formatted);
            return formatted;
        },
        _toTime: function (value, attribute, model) {

            var myTime, formatted;
            if (!value) {
                return null;
            }
            myTime = /*dateAPI.Local.utc*/(parseInt(value, 10)); // for edit this is right, but nor for lasso

            if (_.isNull(myTime)) {
                return value;
            }
            formatted =  new dateAPI.Local(myTime).format(dateAPI.TIME);
            console.log('_toTime ', value, attribute, formatted);
            return formatted;
        },
        _timeStrToDate: function (value, attribute, model) {

            var myValue = parseInt(model.get(attribute), 10) || false;
            if (!myValue) {
                return value;
            }
            var mydate = new dateAPI.Local(dateAPI.Local.utc(myValue));
            var parsedDate = dateAPI.Local.parse(value, dateAPI.TIME);

            if (_.isNull(parsedDate)) {
                return mydate.getTime();
            }


            if (parsedDate.getTime() === 0) {
                return model.get(attribute);
            }

            mydate.setHours(parsedDate.getHours());
            mydate.setMinutes(parsedDate.getMinutes());
            mydate.setSeconds(parsedDate.getSeconds());

            console.log('_timeStrToDate ', value, attribute, dateAPI.Local.localTime(mydate.getTime()));
            return dateAPI.Local.localTime(mydate.getTime());
        },
        _dateStrToDate: function (value, attribute, model) {

            var myValue = parseInt(model.get(attribute), 10) || false;
            if (!myValue) {
                return value;
            }
            var mydate = new dateAPI.Local(dateAPI.Local.utc(myValue));
            var parsedDate = dateAPI.Local.parse(value, dateAPI.DATE);

            if (_.isNull(parsedDate)) {
                return value;
            }

            // just reject the change, if it's not parsable
            if (parsedDate.getTime() === 0) {
                return model.get(attribute);
            }

            mydate.setDate(parsedDate.getDate());
            mydate.setMonth(parsedDate.getMonth());
            mydate.setYear(parsedDate.getYear());
            console.log('_dateStrToDate ', value, attribute,  dateAPI.Local.localTime(mydate.getTime()));
            return dateAPI.Local.localTime(mydate.getTime());
        }
    };

    return BinderUtils;

});
