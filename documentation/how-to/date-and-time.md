---
title: Date and Time
description: The handling of date and time is a complicated mess of historical conventions, which are still changed from time to time by governments around the world
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Date_and_time
---

The handling of date and time is a complicated mess of historical conventions, which are still changed from time to time by governments around the world. 
To keep this away from day-to-day activities of developers, the OX App Suite platform provides the module date, which performs conversion between different time zones, formatting and parsing of date and time values.

The examples in this article use some global variables. 
For the examples to work the way they are intended, you will first need to load the [gettext module](TODO) and the date module and store them in variables gettext and date.

```javascript
var gettext, date;
require(['gettext!example', 'io.ox/core/date']).done(function (gt, d) {
    gettext = gt;
    date = d;
}); 
```

In real code, you should not use global variables. 
Instead, you would use the gt and d parameters directly, without storing them in another variable.

# Time Zones

The built-in JavaScript class Date supports calculations using UTC and the operating system's local time zone. Unfortunately, this is not enough.
Examples include using a time zone different from the time zone of the client system, or displaying times in multiple time zones at once.

The class Local is almost a drop-in replacement for Date, with the main difference being that it operates in the default time zone of the OX App Suite user, even if it is different from the time zone of the browser's operating system. 
The following code displays the current date and time. 
It will show a different time when called after changing the user's time zone.

```javascript
alert(new date.Local());
```

To work with other time zones, the function _getTimeZone()_ can be used to create replacement classes similar to Local, which are all descendants of the private class LocalDate (for which all methods are documented below). 
Since the time zone definitions are loaded on-demand, the function returns a jQuery promise, which is resolved to the class constructor once the time zone definition is loaded. 
This class can then be used to e.g. convert between time zones.

```javascript
date.getTimeZone('America/New_York').done(function (NewYork) {
  alert(gettext('New York celebrated New Year\'s at %1$s',
          new date.Local(new NewYork(2012, 0, 1))));
});
```

The function _getTimeZone()_ is memoized for performance reasons, i.e. multiple calls with the same argument will return the same promise and will therefore resolve to the same class object.

# Formatting

The default _LocalDate.prototype.toString()_ method displays the full date and time, including the day of week and the time zone. To allow better control of the resulting string, the method _LocalDate.prototype.format()_ accepts a set of format flags. The flags determine, which fields should be included in the output. Currently, there are four flags:

```javascript
var d = new date.Local();
alert(d.format(date.DATE));
alert(d.format(date.TIME));
alert(d.format(date.DAYOFWEEK));
alert(d.format(date.TIMEZONE));
```

Multiple flags can be combined by adding them, or by using one of the predefined combination constants. 
Not all possible combinations produce unique results. 
When DAYOFWEEK is specified together with any other fields, DATE is automatically included in the output. 
Similarly, TIMEZONE implies TIME when used with other fields.

```javascript
var d = new date.Local();
assert(d.format(date.DAYOFWEEK + date.TIMEZONE) === d.format(date.FULL_DATE));
```

The format flags select one of several predefined format strings, which is stored in the current locale settings. 
This frees both the developers and the translators from having to remember arcane letter combinations.

For the case that even finer control of the generated output is required, LocalDate.prototype.format() accepts a format string directly. 
The syntax of the format strings is a subset of CLDR date format patterns. Format specifiers which are not used in the Gregorian calendar will be implemented on-demand.

```javascript
alert(new date.Local().format('EEEE'));
```

In general, if format strings are required, this indicates that the current date API should be extended. Feedback is always welcome.

One situation where direct access to format strings is useful, is the manipulation of the localized format strings, e.g. to decorate individual fields in a displayed date with HTML markup. 
To achieve this, the localized format string is retrieved with getFormat(), and parts of it passed individually to LocalDate.prototype.format().

```javascript
// Get the original format string.
var fmt = date.getFormat(date.FULL_DATE);

// Regular expression to parse the format string.
//  .  .  ( time zone )|quote|'quoted  text'|rest
var re = /(v+|V+|z+|Z+)|(?:''|'(?:[^']|'')*'|[^vVzZ'])+/g;

// Appends a formatted date to a jQuery node and returns
// the time zone as a separate node.
function decorateTimeZone(d, parent) {
  var span;
  fmt.replace(re, function (match, tz) {
    if (tz) { // found the time zone field
      // Wrap the formatted time zone in a <span> element.
      span = $('<span>').text(d.format(match));
      parent.append(result);
    } else {
      // Append all other formatted text as plain text nodes.
      parent.append($.txt(d.format(match)));
    }
  });
  // Return the wrapped field for further customization.
  return span;
}
```

# Intervals

In addition to formatting individual dates, LocalDate instances can format intervals. 
The difference to simply inserting two dates into a translated string is that short intervals may have a compacter representation, e.g. 'Jan 1–10, 2012' instead of 'Jan 1, 2012 – Jan 10, 2012'.

```javascript
var start = new date.Local(), end = new date.Local(start);
end.add(date.DAY);
alert(start.formatInterval(end, date.DATE));
```

The methods LocalDate.prototype.formatInterval() and LocalDate.prototype.getIntervalFormat() are used like LocalDate.prototype.format() and getFormat(), with two differences. 
First, the interval functions accept the end of the interval as first parameter before the format flags. 
And second, since the format string depends on the actual interval, LocalDate.prototype.getIntervalFormat() is a member function and requires the same end value as used later for LocalDate.prototype.formatInterval().

# Parsing

Parsing is the reverse of formatting, except that ideally, users should be able to enter almost anything, as long as it is not ambiguous. 
The practice looks a bit more restricted. 
The LocalDate.parse() function takes a format parameter like the formatting functions, and expects the parsed string to match it very closely.

```javascript
var input = prompt(gettext('Please enter a date'), '');
var d = date.Local.parse(input, date.DATE);
alert(gettext('I understood %1$s', d));
```

If there is demand, we can implement some heuristics. There are a lot of abstract algorithm descriptions in the standards, which describe how to parse almost anything while using the format string only as disambiguation help.

# Manipulation of LocalDate objects

Since the LocalDate class is designed as a drop-in for the Date class, its instances support getter and setter methods for all fields of a date. 
They can be used to modify an existing LocalDate object, e. g. to round a date to the nearest day or hour.

```javascript
var start = new date.Local(), end = new date.Local(start);
start.setHours(0, 0, 0, 0);
end.setHours(24, 0, 0, 0);
alert(gettext('Today is %1$s', start.formatInterval(end)));
```

One manipulation, which is often needed in calendars, is iteration over time.
This operation seems simple, at least for iteration steps with a constant duration like hours, days or weeks. 
One just needs to add the step duration to the timestamp. 
While there is a method to do exactly this, LocalDate.prototype.addUTC(), you will encounter problems as soon as the iteration transcends a daylight savings switch. First, days and weeks are not actually constant. 
And second, sometimes the iteration might need to follow the displayed 'wall clock' time instead of the physical time. 
For these cases, the method LocalDate.prototype.add() increments the local time instead of the UTC time. 
Both methods accept an increment value in milliseconds, which can also be negative. 
There are predefined constants for the most common (almost-)fixed-duration periods.

```javascript
var d = new date.Local(2012, 2);
for (; d.getMonth() < 3; d.add(date.DAY)) {
  // Display a day in a month view.
}
```

Iteration with larger intervals like months and years has the additional difficulty, that a single numeric parameter like 30 * date.DAY cannot be interpreted as a month, because it might be just really 30 days. 
To solve this, there are separate methods for months and years: LocalDate.prototype.addMonths() and LocalDate.prototype.addYears(). They accept the number of months, respective years as parameter.

```javascript
var d = new date.Local(2012, 0);
for (; g.getYear() < 2013; d.addMonths(1)) {
  // Display a month in a year view.
}
```

Finally, most calendars default to displaying the current date, and therefore need to figure out the iteration range based on an arbitrary point inside that range. In most cases, the start can be computed by simply calling the appropriate setters with all zeros as parameters to find the start of the range, and adding the range duration to find the end. One exception is the week. There is no setter for the day of the week. Instead, the method LocalDate.prototype.setStartOfWeek() can be used to find the start of a week.


```javascript
// Find the start and the end of the current week
var d = new date.Local().setStartOfWeek();
var end = new date.Local(start).add(date.WEEK);
// Iterate over the week
for (; d < end; d.add(date.DAY)) {
  // Display a day in a week view.
}
```

In addition to explicit method calls, the JavaScript standard method LocalDate.prototype.valueOf() allows native comparison, addition and subtraction operators to work on LocalDate objects. The result of LocalDate.prototype.valueOf(), and therefore of addition and subtraction, is a timestamp, which can be passed to the LocalDate constructor to get a LocalDate object again.


```javascript
var start = date.Local.parse(prompt(gettext('Start date'), ''));
var end = date.Local.parse(prompt(gettext('End date'), ''));
if (end < start) alert(gettext('Invalid date range!'));
```

# Differences between LocalDate and Date

The LocalDate classes duplicate most of the Date API with a few exceptions:

- The constructor can not be called as a function. The Date constructor does in this case nothing useful anyway.
- The constructor always uses full years, it does not add 1900 for years 0 to 99.
- Date.UTC() should not be necessary, but since it returns a numeric timestamp and has nothing to do with time zones, it can still be used directly.
- Except for LocalDate.prototype.toString(), all to*String() methods are replaced by LocalDate.prototype.format().
- There are no UTC variants of getters and setters. They should not be necessary. But just in case, you can still use a LocalDate class for the time zone 'UTC' instead.
- The getter and setter for the year are called getYear and setYear instead of getFullYear and setFullYear since we have no legacy code with Y2K issues.
- Setters return the modified object instead of the timestamp. This is useful for chaining of method calls.
- Date.prototype.getTimeZoneOffset() should not be necessary, since hiding these details is the whole point of the date module. If still necessary, LocalDate.getTTInfo() can be used instead.

# API Reference

This section provides a short reference of the date API.

## Locale

A locale describes the localization settings which usually depend not only on the language, but also on the region and optionally even on the personal preferences of the user. The locale object is loaded at startup and provides various settings and translations.

Various arrays containing translations can be used directly without any other date function.

```javascript
locale.dayPeriods
```

A map from an identifier of a day period to the corresponding translation. The members am and pm are used in the 12h time format, but other members may be useful for greetings. Is anyone interested in a function which returns the correct greeting period for a given time? If not, maybe remove everything except AM and PM?

```javascript
  locale.days
```

An array with translated full names of days of the week, starting with Sunday. CLDR context: "format", CLDR width: "wide".

```javascript
  locale.daysShort
```

An array with translated abbreviated names of days of the week, starting with Sunday. CLDR context: "format", CLDR width: "abbreviated".

```javascript
  locale.daysStandalone
```

An array with translated standalone names of days of the week, starting with Sunday. CLDR context: "standalone", CLDR width: "abbreviated".

```javascript
  locale.eras
```

An array with translated abbreviations for the two eras of the Gregorian calendar: BC and AD (in that order).

```javascript
  locale.months
```

An array with translated full names of months. CLDR context: "format", CLDR width: "wide".

```javascript
  locale.monthsShort
```

An array with translated abbreviated names of months. CLDR context: "format", CLDR width: "abbreviated". Diverse week-based calculations need to know on which day the week starts and how the first week of the year is defined.

```javascript
  locale.daysInFirstWeek
```

The lowest number of days of a week which must be in the new year for that week to be considered week number 1. Common values are

- 1 if the week of January 1st is week number 1,
- 4 if the first week which has most of its days in the new year is week number 1.
- 7 if the first week which starts in the new year is week number 1.
  
```javascript
  locale.weekStart
```

First day of the week. Common values are

- 0 for Sunday,
- 1 for Monday.

Deprecated and internal fields should not be used since they can change or disappear entirely without notice. They are still documented here for completeness.

```javascript
  locale.date
```

Deprecated, use DATE instead.

```javascript
  locale.dateTime
```

Deprecated, use DATE_TIME instead.

```javascript
  locale.dateTimeFormat
```

The default format used to combine a time (%1$s) and a date (%2$s). Not used yet, will probably disappear.

```javascript
  locale.formats
```

A map from various canonical sets of format fields to the corresponding localized format strings. Used mainly by getFormat(). Maybe remove it from the public interface after loading, since it's internal?

```javascript
  locale.h12
```

A boolean indicating whether the 12h format is used. WANTED: a better name.

```javascript
  locale.intervals
```

A map from various canonical sets of format fields to the corresponding formatting rules. A formatting rule is a map from the largest field, which is different between the start and end of the interval, to the corresponding localized formatting string. The field is specified as a single lower case letter. The formatting string is split at the first repeating field. The first part is formatted using the start of the interval, the second part is formatted using the end of the interval. Used mainly by LocalDate.prototype.getIntervalFormat(). Maybe remove it from the public interface after loading, since it's internal?

```javascript
  locale.intervals.fallback
```

The default format string to combine the start (%1$s) and end (%2$s) of an interval when none of the other members of locale.intervals apply. Maybe remove it from the public interface after loading, since it's internal?

```javascript
  locale.time
```

Deprecated, use TIME instead.

```javascript
  getTimeZone
```

The main entry points of the date API are the class Local which replaces Date for use with the user's default time zone and a function to generate similar classes for arbitrary time zones.

```javascript
  getTimeZone(name)
```

Creates a LocalDate class which operates in the specified time zone. Multiple calls with the same name will return the same object. name String - The name of the requested time zone. It must be one of the values returned by api/config/availableTimeZones. Returns Promise - A promise which resolves to a LocalDate class which uses the requested time zone. Local A convenience LocalDate class which uses the user's current time zone.

## LocalDate

The core of the date API is the abstract class LocalDate which is the superclass of time zone specific classes. The class itself is not publically available, only its subclasses can be created by calling getTimeZone(). The subclasses and their instances are referred to as LocalDate classes and LocalDate objects.

The constructor mimics the behavior of the Date class, but it can't be called as a function.

 ```javascript
new LocalDate()
new LocalDate(timestamp)
new LocalDate(year, month, date, hours, minutes, seconds, ms)
 ```
  
The constructor accepts the same parameters as the Date constructor. The entire functionality of the class is based on a few low level functions. They should not be necessary outside the date module itself, assuming the API is complete. If you find you need these functions, please let's extend the high level APIs instead.

```javascript
  LocalDate.getTTInfo(t)
```

Returns the GMT offset, daylight savings and the abbreviation of the time zone which are in effect at the specified time.

```javascript
  t Timestamp - The timestamp.
```

Returns { gmtoff, isdst, abbr } - An object with the GMT offset in milliseconds, whether daylight savings are in effect (0 or 1, not a real boolean) and the abbreviation like 'CET' (!isdst) or 'CEST' (!!isdst).

```javascript
  LocalDate.getTTInfoLocal(t)
```

- Returns the GMT offset, daylight savings and the abbreviation of the time zone which are in effect at the specified local time. If the local time is ambiguous or invalid, the same fallbacks as for LocalDate.utc() are used. (It is actually implemented as a wrapper for this function.)
- t Number - The local time.
- Returns { gmtoff, isdst, abbr } - An object with the GMT offset in milliseconds, whether daylight savings are in effect (0 or 1, not a real boolean) and the abbreviation like 'CET' (!isdst) or 'CEST' (!!isdst).

```javascript
  LocalDate.localTime(t)
```

- Converts a UTC timestamp to local time.
- t Timestamp - The UTC timestamp to convert.
- Returns Number - A local time which is used in computations of date and time components.

```javascript
  LocalDate.utc(t)
```

- Converts local time to a UTC timestamp. If the local time is ambiguous because of a DST switch, the local time is interpreted as before the switch. E.g. 02:30 at the end of DST is interpreted as DST. If the local time is invalid because of a DST switch, the local time is interpreted as if the switch already occurred. E.g. 02:30 at the start of DST returns the same timestamp as 01:30 before the switch.
- t Number - The local time to convert.
- Returns Timestamp - The corresponsing UTC timestamp.

Metadata about a time zone is stored directly on the LocalDate object.

```javascript
  LocalDate.id
```

- Original name used to retrieve this time zone.
  
```javascript
  LocalDate.displayName
```

- A human-readable name of this time zone as provided by the config module under "availableTimeZones".
- Parsing of date and time strings as entered by a user is done using format flags from Constants. The current implementation expects the string to match the corresponding localized format string pretty closely. Any difficulties with parsing common entered dates and times should be taken as an opportunity to extend the parsing heuristics.

```javascript
  LocalDate.parse(string, format)
```

- Parses a string using either the specified format string or localized version of one of predefined format strings selected by format flags.
- string String - The string to parse.
- format String or Number - Either a format string with the syntax of CLDR date format patterns, or one of the format flag constants. In the second case, the actual format string is localized for the current user's locale according to locale.formats.
- Returns LocalDate or null - A new LocalDate object which represents the parsed date and time or null if the string could not be parsed.
- Methods of LocalDate instances can be grouped into several categories. The first are the setters and getters for individual fields from Date. Since each LocalDate class has its own time zone, There are no UTC variants of each getter and setter. They all work with local time.
 
 ```javascript
LocalDate.prototype.getYear();
LocalDate.prototype.getMonth();
LocalDate.prototype.getDate();
LocalDate.prototype.getHours();
LocalDate.prototype.getMinutes();
LocalDate.prototype.getSeconds();
LocalDate.prototype.getMilliseconds();
 ```
 
- Return the corresponding field of the local date or time.
- Returns Number - The requested field, as a number.

```javascript
LocalDate.prototype.setYear(year, month, date)
LocalDate.prototype.setMonth(month, date)
LocalDate.prototype.setDate(date)
LocalDate.prototype.setHours(hour, min, sec, ms)
LocalDate.prototype.setMinutes(min, sec, ms)
LocalDate.prototype.setSeconds(sec, ms)
LocalDate.prototype.setMilliseconds(ms)
```

- Set the specified date or time fields. Any unspecified fields retain their current value. Values outside of the specified ranges will result in overflow to the neighboring periods and can therefore be used for date arithmetic.
    + year Number - The year.
    + month Number - The month. Values range from 0 for January to 11 for December.
    + date Number - The date. Values range from 1 to 31.
    + hour Number - The hours. Values range from 0 to 23.
    + min Number - The minutes. Values range from 0 to 59.
    + sec Number - The seconds. Values range from 0 to 59.
    + ms Number - The milliseconds. Values range from 0 to 999.

```javascript
LocalDate.prototype.getDay()
```

- Returns Number - The day of the week. Values range from 0 for Sunday to 6 for Saturday.

```javascript
  LocalDate.prototype.getTimeZone()
```

- This method is not present in Date. It returns the abbreviation of the specific time zone. The abbreviation indicate the GMT offset and is therefore different between daylight savings time and standard time.
- Returns String - The abbreviation of the specific time zone.
- Other getters and setters work with the entire timestamp and not just individual fields.

```javascript
LocalDate.prototype.getDays()
```

- Returns the day number of this object. This may be useful to find the start of the same day (by multiplying the result with DAY).
- Returns Number - The number of days since 1970-01-01 in this object's time zone.

```javascript
  LocalDate.prototype.getTime()
```

- Returns Timestamp - The UTC timestamp of this object.

```javascript
  LocalDate.prototype.setTime(time)
```

- Sets the UTC timestamp to a new value.
- time Timestamp - The new UTC timestamp of this object.
- While setters can be used to perform date arithmetic, LocalDate provides convenience functions for the most frequent cases of adding and subtracting a time period and finding the start of a week.
 
```javascript
  LocalDate.prototype.add(time)
```
   
- Adds or subtracts a time period in local time. The results may be invalid if the end result ends up in the middle of a daylight savings switch.
- time Number - The time period to add, in milliseconds. Use negative values to subtract. See also Constants.
- Returns this - This object for chaining.

```javascript
  LocalDate.prototype.addUTC(time)
```
    
- Adds or subtracts a physical time period, i.e. simply increments the timestamp.
- time Number - The time period to add, in milliseconds. Use negative values to subtract. See also Constants.

- Returns this - This object for chaining.

```javascript
    LocalDate.prototype.addMonths(months)
```
    
- Adds or subtracts a number of months in local time. The results may be invalid if the end result ends up in the middle of a daylight savings switch.
- months Number - The number of months to add. Use negative values to subtract. Returns this - This object for chaining.

```javascript
  LocalDate.prototype.addYears(years)
```

- Adds or subtracts a number of years in local time. The results may be invalid if the end result ends up in the middle of a daylight savings switch.
years Number - The number of years to add. Use negative values to subtract.

- Returns this - This object for chaining.

```javascript
LocalDate.prototype.setStartOfWeek()
```

- Sets the date to the start of the same week as determined by locale.weekStart. The time is reset to midnight.
- Returns this - This object for chaining.
- Formatting functions implement the conversion of dates and intervals into localized strings which are suitable for direct presentation to the user.

```javascript
  LocalDate.prototype.format(format)
```
  
- Formats the date according to the specified format flags or format string.
- format String or Number - Either a format string with the syntax of CLDR date format patterns, or one of the format flag constants. In the second case, the actual format string is localized for the current user's locale according to locale.formats. The default value is DATE_TIME.
- Returns String - This object formatted according to the specified format.

```javascript
  LocalDate.prototype.getIntervalFormat(end, format)
```
    
- Returns a format string for a time interval with this object as the start and another LocalDate object as the end.
- end LocalDate - The end of the interval.
- format String or Number - Either a format string with the syntax of CLDR date format patterns, or one of the format flag constants. In the second case, the actual format string is localized for the current user's locale according to locale.intervals and locale.formats. The default value is DATE_TIME.
- Returns String - The format string for the interval accorging to the specified format.

```javascript
  LocalDate.prototype.formatInterval(end, format)
```

- Formats an interval with this object as the start and another LocalDate object as the end.
end LocalDate - The end of the interval. format String or Number - Either a format string with the syntax of CLDR date format patterns, or one of the format flag constants. In the second case, the actual format string is localized for the current user's locale according to locale.intervals and locale.formats. The default value is DATE_TIME.

- Returns String - The interval formatted accorging to the specified format.
- Finally, the JavaScript standard conversion functions allow easy debugging and arithmetic on timestamps.

```javascript
  LocalDate.prototype.toString()
```

- Converts this object to a string using this.format(FULL_DATE).
- Returns String - The string representation of this object.
  
```javascript
LocalDate.prototype.valueOf()
```

-Converts this object to a primitive value by returning the UTC timestamp. This can be used for arithmetic directly on LocalDate objects and as the single parameter to new LocalDate().
- Returns Timestamp - The UTC timestamp of this object.

## Constants

All date classes operate on timestamps expressed as milliseconds since the UNIX epoch, 1970-01-01 00:00 UTC. The date module defines constants for common time intervals with a constant duration.

    SECOND

Number of milliseconds in a second.

    MINUTE

Number of milliseconds in a minute.

    HOUR

Number of milliseconds in an hour.

    DAY

Number of milliseconds in a day.

    WEEK

Number of milliseconds in a week.

Format flags for parsing and formatting functions are defined as constants. Multiple flags can be combined via addition or bitwise ORing.
 
    DAYOFWEEK
    Day of the week
    DATE
    Date
    TIME
    Time
    TIMEZONE
    Timezone

Valid format flag combinations have dedicated constants. In a combination, DAYOFWEEK implies DATE and TIMEZONE implies TIME.
 
    DAYOFWEEK_DATE
    DAYOFWEEK + DATE
    DATE_TIME
    DATE + TIME
    DAYOFWEEK_DATE_TIME
    DAYOFWEEK + DATE + TIME
    TIME_TIMEZONE
    TIME + TIMEZONE
    DATE_TIME_TIMEZONE
    DATE + TIME + TIMEZONE
    FULL_DATE
    DAYOFWEEK + DATE + TIME + TIMEZONE
    Miscellaneous

See Formatting for usage of this function.

```javascript
  getFormat(format)
```

- Returns the localized format string for the specified format flags.
format String or Number - Either a format string with the syntax of CLDR date format patterns, or one of the format flag constants. In the second case, the actual format string is localized for the current user's locale according to locale.formats. The default value is DATE_TIME.
- Returns String - The localized format string which corresponds to the specified format flags. If format is a string, that string is returned unmodified.
