/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define("io.ox/tasks/util", function () {
    
    "use strict";
    //order is important! Must be the same as in dropdownmenu
    var lookupArray = [60000 * 5,           //five minutes
                       60000 * 15,          //fifteen minutes
                       60000 * 30,          //thirty minutes
                       60000 * 60,          //one hour
                       60000 * 60 * 3,      //three hours
                       60000 * 60 * 6,      //six hours
                       60000 * 60 * 24,     //one day
                       60000 * 60 * 24 * 3, //three days
                       60000 * 60 * 24 * 7];//one week
    
    var util = {
            computePopupTime: function (time, selectorIndex)
            {
                var endDate = time;
                console.log(selectorIndex);
                var offset = endDate.getTimezoneOffset() * -1 * 60000;
                
                if (selectorIndex < lookupArray.length)
                        {
                    endDate.setTime(endDate.getTime() + lookupArray[selectorIndex]);
                } else
                    {
                    endDate.setMilliseconds(0);
                    endDate.setSeconds(0);
                    endDate.setMinutes(0);
                    
                    switch (selectorIndex)
                    {
                    case 9:
                        endDate.setTime(endDate.getTime() + 60000 * 60 * 24);
                        break;
                    case 10:
                        var day = (((endDate.getDay() - 1) % 7) + 7) % 7;//workaroundjavascript modulo operator to stupid to handle negative numbers
                        endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - day));
                        break;
                    case 11:
                        var day = (((endDate.getDay() - 5) % 7) + 7) % 7;//workaround again
                        console.log(day);
                        endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * (7 - day));
                        break;
                    }
                    
                    endDate.setHours(5);
                }
                
                endDate.setTime(endDate.getTime() + offset);
                
                return endDate;
            }
        };
    return util;
});