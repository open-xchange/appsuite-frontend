---
---

<h1>Date and Time</h1>

<p>The handling of date and time is a complicated mess of historical
conventions, which are still changed from time to time by governments around
the world. To keep this away from day-to-day activities of developers,
the OX App Suite platform provides the module <code>date</code>, which performs
conversion between different time zones, formatting and parsing of date and time
values.</p>

<h2>Time Zones</h2>

<p>The built-in JavaScript class <code>Date</code> supports calculations using
UTC and the operating system's local time zone. Unfortunately, this is not
enough. Examples include using a time zone different from the time zone of
the client system, or displaying times in multiple time zones at once.</p>

<p>The class <code>Local</code> is almost a drop-in replacement for
<code>Date</code>, with the main difference being that it operates in
the default time zone of the OX App Suite user, even if it is different from
the time zone of the browser's operating system. The following code displays
the current date and time. It will show a different time when called after
changing the user's time zone.</p>

<script type="text/example">
alert(new date.Local());
</script>

<p>To work with other time zones, the function <code>getTimeZone()</code> can be
used to create replacement classes similar to <code>Local</code>, which are
all descendants of the private class <code>LocalDate</code> (for which all
methods are documented below). Since the time zone definitions are loaded
on-demand, the function returns a jQuery promise, which is resolved to the class
constructor once the time zone definition is loaded. This class can then be used
to e.g. convert between time zones.</p>

<script type="text/example">
date.getTimeZone('America/New_York').done(function (NewYork) {
    alert(gettext('New York celebrated New Year\'s at %1$s',
                  new date.Local(new NewYork(2012, 0, 1))));
});
</script>

<p>The function <code>getTimeZone()</code> is memoized for performance reasons,
i.e. multiple calls with the same argument will return the same promise and will
therefore resolve to the same class object.</p>

<h2>Formatting</h2>

<p>The default <code>LocalDate.prototype.toString()</code> method displays
the full date and time, including the day of week and the time zone. To allow
better control of the resulting string, the method
<code>LocalDate.prototype.format()</code> accepts a set of format flags.
The flags determine, which fields should be included in the output. Currently,
there are four flags:</p>

<script type="text/example">
var d = new date.Local();
alert(d.format(date.DATE));
alert(d.format(date.TIME));
alert(d.format(date.DAYOFWEEK));
alert(d.format(date.TIMEZONE));
</script>

<p>Multiple flags can be combined by adding them, or by using one of
the predefined combination constants. Not all possible combinations produce
unique results. When <code>DAYOFWEEK</code> is specified together with any other
fields, <code>DATE</code> is automatically included in the output. Similarly,
<code>TIMEZONE</code> implies <code>TIME</code> when used with other fields.</p>

<script type="text/example">
var d = new date.Local();
assert(d.format(date.DAYOFWEEK + date.TIMEZONE) === d.format(date.FULL_DATE);
</script>

<p>The format flags select one of several predefined format strings, which is
stored in the current <a href="#Locale">locale settings</a>. This frees both
the developers and the translators from having to remember arcane letter
combinations.</p>

<p>For the case that even finer control of the generated output is required,
<code>LocalDate.prototype.format()</code> accepts a format string directly.
The syntax of the format strings is a subset of
<a href="http://unicode.org/reports/tr35/#Date_Format_Patterns">CLDR date format
patterns</a>. Format specifiers which are not used in the Gregorian calendar
will be implemented on-demand.</p>

<script type="text/example">
alert(new date.Local().format('EEEE'));
</script>

<p>In general, if format strings are required, this indicates that the current
<code>date</code> API should be extended. Feedback is always welcome.</p>

<p>One situation where direct access to format strings is useful, is
the manipulation of the localized format strings, e.g. to decorate individual
fields in a displayed date with HTML markup. To achieve this, the localized
format string is retrieved with <code>getFormat()</code>, and parts of it passed
individually to <code>LocalDate.prototype.format()</code>.</p>

<script type="text/example">
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
</script>

<p><span class="TODO">Does anybody want this use case as an API
function?</span></p>

<h3>Intervals</h3>

<p>In addition to formatting individual dates, <code>LocalDate</code> instances
can format intervals. The difference to simply inserting two dates into
a translated string is that short intervals may have a compacter representation,
e.g. 'Jan 1&ndash;10, 2012' instead of 'Jan 1, 2012 &ndash; Jan 10, 2012'.</p>

<script type="text/example">
var start = new date.Local(), end = new date.Local(start);
end.add(date.DAY);
alert(start.formatInterval(end, date.DATE));
</script>

<p>The methods <code>LocalDate.prototype.formatInterval()</code> and
<code>LocalDate.prototype.getIntervalFormat()</code> are used like
<code>LocalDate.prototype.format()</code> and
<code>getFormat()</code>, with two differences. First, the interval functions
accept the end of the interval as first parameter before the format flags.
And second, since the format string depends on the actual interval,
<code>LocalDate.prototype.getIntervalFormat()</code> is a member function and
requires the same end value as used later for
<code>LocalDate.prototype.formatInterval()</code>.</p>

<h2>Parsing</h2>

<p>Parsing is the reverse of formatting, except that ideally, users should be
able to enter almost anything, as long as it is not ambiguous. The practice
looks a bit more restricted. The <code>LocalDate.parse()</code> function takes
a format parameter like the formatting functions, and expects the parsed string
to match it very closely.</p>

<script type="text/example">
var input = prompt(gettext('Please enter a date'), '');
var d = date.Local.parse(input, date.DATE);
alert(gettext('I understood %1$s', d);
</script>

<p>If there is demand, we can implement some heuristics. There are a lot of
abstract algorithm descriptions in the standards, which describe how to parse
almost anything while using the format string only as disambiguation help.</p>

<h2>Manipulation of <code>LocalDate</code> objects</h2>

<p>Since the <code>LocalDate</code> class is designed as a drop-in for
the <code>Date</code> class, its instances support getter and setter methods for
all fields of a date. They can be used to modify an existing
<code>LocalDate</code> object, e. g. to round a date to the nearest day or
hour.</p>

<script type="text/example">
var start = new date.Local(), end = new date.Local(start);
start.setHours(0, 0, 0, 0);
end.setHours(24, 0, 0, 0);
alert(gettext('Today is %1$s', start.formatInterval(end)));
</script>

<p>One manipulation, which is often needed in calendars, is iteration over time.
This operation seems simple, at least for iteration steps with a constant
duration like hours, days or weeks. One just needs to add the step duration
to the timestamp. While there is a method to do exactly this,
<code>LocalDate.prototype.addUTC()</code>, you will encounter problems as soon
as the iteration transcends a daylight savings switch. First, days and weeks are
not actually constant. And second, sometimes the iteration might need to follow
the displayed 'wall clock' time instead of the physical time. For these cases,
the method <code>LocalDate.prototype.add()</code> increments the local time
instead of the UTC time. Both methods accept an increment value in milliseconds,
which can also be negative. There are predefined
<a href="#Constants">constants</a> for the most common (almost-)fixed-duration
periods.</p>

<script type="text/example">
var d = new date.Local(2012, 2);
for (; d.getMonth() < 3; d.add(date.DAY)) {
    // Display a day in a month view.
} 
</script>

<p>Iteration with larger intervals like months and years has the additional
difficulty, that a single numeric parameter like <code>30 * date.DAY</code>
cannot be interpreted as a month, because it might be just really 30 days. To
solve this, there are separate methods for months and years:
<code>LocalDate.prototype.addMonths()</code> and
<code>LocalDate.prototype.addYears()</code>. They accept the number of months,
respective years as parameter.</p>

<script type="text/example">
var d = new date.Local(2012, 0);
for (; g.getYear() < 2013; d.addMonths(1)) {
    // Display a month in a year view.
}
</script>

<p>Finally, most calendars default to displaying the current date, and therefore
need to figure out the iteration range based on an arbitrary point inside that
range. In most cases, the start can be computed by simply calling
the appropriate setters with all zeros as parameters to find the start of
the range, and adding the range duration to find the end. One exception is
the week. There is no setter for the day of the week. Instead, the method
<code>LocalDate.prototype.setStartOfWeek()</code> can be used to find the start
of a week.</p>

<script type="text/example">
// Find the start and the end of the current week
var d = new date.Local().setStartOfWeek();
var end = new date.Local(start).add(date.WEEK);
// Iterate over the week
for (; d < end; d.add(date.DAY)) {
    // Display a day in a week view.
}
</script>

<p>In addition to explicit method calls, the JavaScript standard method
<code>LocalDate.prototype.valueOf()</code> allows native comparison, addition
and subtraction operators to work on <code>LocalDate</code> objects. The result
of <code>LocalDate.prototype.valueOf()</code>, and therefore of addition and
subtraction, is a timestamp, which can be passed to the <code>LocalDate</code>
constructor to get a <code>LocalDate</code> object again.</p>

<script type="text/example">
var start = date.Local.parse(prompt(gettext('Start date'), ''));
var end = date.Local.parse(prompt(gettext('End date'), ''));
if (end < start) alert(gettext('Invalid date range!'));
</script>

<h2>Differences between <code>LocalDate</code> and <code>Date</code></h2>

<p>The <code>LocalDate</code> classes duplicate most of the <code>Date</code>
API with a few exceptions:</p>

<ul>
<li>The constructor can not be called as a function. The <code>Date</code>
constructor does in this case nothing useful anyway.</li>

<li><code>Date.UTC()</code> should not be necessary, but since it returns
a numeric timestamp and has nothing to do with time zones, it can still be used
directly.</li>

<li>Except for <code>LocalDate.prototype.toString()</code>, all
<code>to*String()</code> methods are replaced by
<code>LocalDate.prototype.format()</code>.</li>

<li>There are no UTC variants of getters and setters. They should not be
necessary. But just in case, you can still use a <code>LocalDate</code> class
for the time zone 'UTC' instead.</li>

<li>The getter and setter for the year are called <code>getYear</code> and
<code>setYear</code> instead of <code>getFullYear</code> and
<code>setFullYear</code> since we have no legacy code with Y2K issues.</li>

<li>Setters return the modified object instead of the timestamp. This is useful
for chaining of method calls.</li>

<li><code>Date.prototype.getTimeZoneOffset()</code> should not be necessary,
since hiding these details is the whole point of the <code>date</code> module.
If still necessary, <code>LocalDate.getTTInfo()</code> can be used instead.</li>
</ul>

<h2>API Reference</h2>

<p>This section provides a short reference of the <code>date</code> API.</p>

<h3>Locale</h3>

<p>A locale describes the localization settings which usually depend not only
on thelanguage, but also on the region and optionally even on the personal
preferences of the user. The <code>locale</code> object is loaded at startup
and provides various settings and translations.</p>

<p>Various arrays containing translations can be used directly without any other
<code>date</code> function.</p>

<dl>
<dt>locale.dayPeriods</dt><dd>A map from an identifier of a day period to
the corresponding translation. The members <code>am</code> and <code>pm</code>
are used in the 12h time format, but other members may be useful for greetings.
<span class="TODO">Is anyone interested in a function which returns the correct
greeting period for a given time? If not, maybe remove everything except AM and
PM?</span></dd>

<dt>locale.days</dt><dd>An array with translated full names of days of the week,
starting with Sunday. CLDR context: "format", CLDR width: "wide".</dd>

<dt>locale.daysShort</dt><dd>An array with translated abbreviated names of days
of the week, starting with Sunday. CLDR context: "format", CLDR width:
"abbreviated".</dd>

<dt>locale.daysStandalone</dt><dd>An array with translated standalone names of
days of the week, starting with Sunday. CLDR context: "standalone", CLDR width:
"abbreviated".</dd>

<dt>locale.eras</dt><dd>An array with translated abbreviations for the two eras
of the Gregorian calendar: BC and AD (in that order).</dd>

<dt>locale.months</dt><dd>An array with translated full names of months. CLDR
context: "format", CLDR width: "wide".</dd>

<dt>locale.monthsShort</dt><dd>An array with translated abbreviated names of
months. CLDR context: "format", CLDR width: "abbreviated".</dd>
</dl>

<p>Diverse week-based calculations need to know on which day the week starts and
how the first week of the year is defined.</p>

<dl>
<dt>locale.daysInFirstWeek</dt><dd>The lowest number of days of a week which
must be in the new year for that week to be considered week number 1. Common
values are
<ul>
    <li>1 if the week of January 1<sup>st</sup> is week number 1,</li>
    <li>4 if the first week which has most of its days in the new year is week
    number 1.</li>
    <li>7 if the first week which starts in the new year is week number 1.</li>
</ul></dd>

<dt>locale.weekStart</dt><dd>First day of the week. Common values are
<ul>
    <li>0 for Sunday,</li>
    <li>1 for Monday.</li>
</ul></dd>
</dl>

<p>Deprecated and internal fields should not be used since they can change or
disappear entirely without notice. They are still documented here for
completeness.</p>

<dl>
    <dt>locale.date</dt>
    <dd><b>Deprecated</b>, use <code>DATE</code> instead.</dd>
    
    <dt>locale.dateTime</dt>
    <dd><b>Deprecated</b>, use <code>DATE_TIME</code>instead.</dd>
    
    <dt>locale.dateTimeFormat</dt>
    <dd>The default format used to combine a time (<code>%1$s</code>) and a date
    (<code>%2$s</code>). Not used yet, will probably disappear.</dd>
    
    <dt>locale.formats</dt>
    <dd>A map from various canonical sets of format fields to the corresponding
    localized format strings. Used mainly by <code>getFormat()</code>.
    <span class="TODO">Maybe remove it from the public interface after loading,
    since it's internal?</span></dd>
    
    <dt>locale.h12</dt>
    <dd>A boolean indicating whether the 12h format is used.
    <span class="TODO">WANTED: a better name.</span></dd>
    
    <dt>locale.intervals</dt>
    <dd>A map from various canonical sets of format fields to the corresponding
    formatting rules. A formatting rule is a map from the largest field, which
    is different between the start and end of the interval, to the corresponding
    localized formatting string. The field is specified as a single lower case
    letter. The formatting string is split at the first repeating field.
    The first part is formatted using the start of the interval, the second part
    is formatted using the end of the interval. Used mainly by
    <code>LocalDate.prototype.getIntervalFormat()</code>.
    <span class="TODO">Maybe remove it from the public interface after loading,
    since it's internal?</span></dd>
    
    <dt>locale.intervals.fallback</dt>
    <dd>The default format string to combine the start (<code>%1$s</code>) and
    end (<code>%2$s</code>) of an interval when none of the other members of
    <code>locale.intervals</code> apply. <span class="TODO">Maybe remove it from
    the public interface after loading, since it's internal?</span></dd>
    
    <dt>locale.time</dt>
    <dd><b>Deprecated</b>, use <code>TIME</code> instead.</dd>
</dl>

<h3>getTimeZone</h3>

<p>The main entry points of the <code>date</code> API are the class
<code>Local</code> which replaces <code>Date</code> for use with the user's
default time zone and a function to generate similar classes for arbitrary
time zones.</p>

<dl>
    <dt>getTimeZone(name)</dt>
    <dd>Creates a <code>LocalDate</code> class which operates in the specified
    time zone. Multiple calls with the same name will return the same object.
        <ul class="params">
            <li><code>name</code> <i>String</i> - The name of the requested time
            zone. It must be one of the values returned by
            <code>api/config/availableTimeZones</code>.</li>
        
            <li><b>Returns</b> <i>Promise</i> - A promise which resolves to
            a <code>LocalDate</code> class which uses the requested time
            zone.</li>
        </ul>
    </dd>
    
    <dt>Local</dt>
    <dd>A convenience <code>LocalDate</code> class which uses the user's current
    time zone.</dd>
</dl>

<h3>LocalDate</h3>

<p>The core of the <code>date</code> API is the abstract class
<code>LocalDate</code> which is the superclass of time zone specific classes.
The class itself is not publically available, only its subclasses can be created
by calling <code>getTimeZone()</code>. The subclasses and their instances are
referred to as <code>LocalDate</code> classes and <code>LocalDate</code>
objects.</p>

<p>The constructor mimics the behavior of the <code>Date</code> class, but it
can't be called as a function.</p>

<dl>
    <dt>new LocalDate()</dt>
    <dt>new LocalDate(timestamp)</dt>
    <dt>new LocalDate(year, month, date, hours, minutes, seconds, ms)</dt>
    <dd>The constructor accepts the same parameters as the <code>Date</code>
    constructor.</dd>
</dl>

<p>The entire functionality of the class is based on a few low level functions.
They should not be necessary outside the <code>date</code> module itself,
assuming the API is complete. <span class="TODO">If you find you need these
functions, please let's extend the high level APIs instead.</span></p>

<dl>
    <dt>LocalDate.getTTInfo(t)</dt>
    <dd>Returns the GMT offset, daylight savings and the abbreviation of
    the time zone which are in effect at the specified time.
        <ul class="params">
            <li><code>t</code> <i>Timestamp</i> - The timestamp.</li>
            
            <li><b>Returns</b> <i>{ gmtoff, isdst, abbr }</i> - An object with
            the GMT offset in milliseconds, whether daylight savings are in
            effect (0 or 1, not a real boolean) and the abbreviation like 'CET'
            (<code>!isdst</code>) or 'CEST' (<code>!!isdst</code>).</li>
        </ul>
    </dd>
    
    <dt>LocalDate.getTTInfoLocal(t)</dt>
    <dd>Returns the GMT offset, daylight savings and the abbreviation of
    the time zone which are in effect at the specified local time. If the local
    time is ambiguous or invalid, the same fallbacks as for
    <code>LocalDate.utc()</code> are used. (It is actually implemented as
    a wrapper for this function.)
        <ul class="params">
            <li><code>t</code> <i>Number</i> - The local time.</li>
            
            <li><b>Returns</b> <i>{ gmtoff, isdst, abbr }</i> - An object with
            the GMT offset in milliseconds, whether daylight savings are in
            effect (0 or 1, not a real boolean) and the abbreviation like 'CET'
            (<code>!isdst</code>) or 'CEST' (<code>!!isdst</code>).</li>
        </ul>
    </dd>
    
    <dt>LocalDate.localTime(t)</dt>
    <dd>Converts a UTC timestamp to local time.
        <ul class="params">
            <li><code>t</code> <i>Timestamp</i> - The UTC timestamp to
            convert.</li>
            
            <li><b>Returns</b> <i>Number</i> - A local time which is used in
            computations of date and time components.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.utc(t)</dt>
    <dd>Converts local time to a UTC timestamp. If the local time is ambiguous
    because of a DST switch, the local time is interpreted as before the switch.
    E.g. 02:30 at the end of DST is interpreted as DST. If the local time is
    invalid because of a DST switch, the local time is interpreted as if
    the switch already occurred. E.g. 02:30 at the start of DST returns the same
    timestamp as 01:30 before the switch.
        <ul class="params">
            <li><code>t</code> <i>Number</i> - The local time to convert.</li>
            
            <li><b>Returns</b> <i>Timestamp</i> - The corresponsing UTC
            timestamp.</li>
        </ul>
    </dd>
</dl>

<p>Metadata about a time zone is stored directly on the <code>LocalDate</code>
object.</p>

<dl>
    <dt>LocalDate.id</dt><dd>Original name used to retrieve this time zone.</dd>
    <dt>LocalDate.displayName</dt><dd>A human-readable name of this time zone
    as provided by the config module under "availableTimeZones".</dd>
</dl>

<p>Parsing of date and time strings as entered by a user is done using format
flags from <a href="#Constants">Constants</a>. The current implementation
expects the string to match the corresponding localized format string pretty
closely. <span class="TODO">Any difficulties with parsing common entered dates
and times should be taken as an opportunity to extend the parsing
heuristics.</span></p>

<dl>
    <dt>LocalDate.parse(string, format)</dt><dd>Parses a string using either
    the specified format string or localized version of one of predefined format
    strings selected by format flags.
        <ul class="params">
            <li><code>string</code> <i>String</i> - The string to parse.</li>
            
            <li><code>format</code> <i>String or Number</i> - Either a format
            string with the syntax of
            <a href="http://unicode.org/reports/tr35/#Date_Format_Patterns">CLDR
            date format patterns</a>, or one of the <a href="#Constants">format
            flag constants</a>. In the second case, the actual format string is
            localized for the current user's locale according to
            <code>locale.formats</code>.</li>
            
            <li><b>Returns</b> <i>LocalDate or null</i> - A new
            <code>LocalDate</code> object which represents the parsed date and
            time or null if the string could not be parsed.</li>
        </ul>
    </dd>
</dl>

<p>Methods of <code>LocalDate</code> instances can be grouped into several
categories. The first are the setters and getters for individual fields from
<code>Date</code>. Since each <code>LocalDate</code> class has its own time
zone, There are no UTC variants of each getter and setter. They all work with
local time.</p>

<dl>
    <dt>LocalDate.prototype.getYear()</dt>
    <dt>LocalDate.prototype.getMonth()</dt>
    <dt>LocalDate.prototype.getDate()</dt>
    <dt>LocalDate.prototype.getHours()</dt>
    <dt>LocalDate.prototype.getMinutes()</dt>
    <dt>LocalDate.prototype.getSeconds()</dt>
    <dt>LocalDate.prototype.getMilliseconds()</dt>
    <dd>Return the corresponding field of the local date or time.
        <ul class="params">
            <li><b>Returns</b> <i>Number</i> - The requested field, as a
            number.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.prototype.setYear(year, month, date)</dt>
    <dt>LocalDate.prototype.setMonth(month, date)</dt>
    <dt>LocalDate.prototype.setDate(date)</dt>
    <dt>LocalDate.prototype.setHours(hour, min, sec, ms)</dt>
    <dt>LocalDate.prototype.setMinutes(min, sec, ms)</dt>
    <dt>LocalDate.prototype.setSeconds(sec, ms)</dt>
    <dt>LocalDate.prototype.setMilliseconds(ms)</dt>
    <dd>Set the specified date or time fields. Any unspecified fields retain their
    current value. Values outside of the specified ranges will result in overflow
    to the neighboring periods and can therefore be used for date arithmetic.
        <ul class="params">
            <li><code>year</code> <i>Number</i> - The year.</li>
            
            <li><code>month</code> <i>Number</i> - The month. Values range from
            0 for January to 11 for December.</li>
            
            <li><code>date</code> <i>Number</i> - The date. Values range from 1
            to 31.</li>
            
            <li><code>hour</code> <i>Number</i> - The hours. Values range from 0
            to 23.</li>
            
            <li><code>min</code> <i>Number</i> - The minutes. Values range from
            0 to 59.</li>
            
            <li><code>sec</code> <i>Number</i> - The seconds. Values range from
            0 to 59.</li>
            
            <li><code>ms</code> <i>Number</i> - The milliseconds. Values range
            from 0 to 999.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.prototype.getDay()</dt>
    <dd>
        <ul class="params">
            <li><b>Returns</b> <i>Number</i> - The day of the week. Values range
            from 0 for Sunday to 6 for Saturday.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.prototype.getTimeZone()</dt>
    <dd>This method is not present in <code>Date</code>. It returns
    the abbreviation of the specific time zone. The abbreviation indicate
    the GMT offset and is therefore different between daylight savings time and
    standard time.
        <ul class="params">
            <li><b>Returns</b> <i>String</i> - The abbreviation of the specific
            time zone.</li>
        </ul>
    </dd>
</dl>

<p>Other getters and setters work with the entire timestamp and not just
individual fields.</p>  

<dl>
    <dt>LocalDate.prototype.getDays()</dt>
    <dd>Returns the day number of this object. This may be useful to find
    the start of the same day (by multiplying the result with <code>DAY</code>).
        <ul class="params">
            <li><b>Returns</b> <i>Number</i> - The number of days since
            1970-01-01 in this object's time zone.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.prototype.getTime()</dt>
    <dd>
        <ul class="params">
            <li><b>Returns</b> <i>Timestamp</i> - The UTC timestamp of this
            object.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.prototype.setTime(time)</dt>
    <dd>Sets the UTC timestamp to a new value.
        <ul class="params">
            <li><code>time</code> <i>Timestamp</i> - The new UTC timestamp of
            this object.</li>
        </ul>
    </dd>
</dl>

<p>While setters can be used to perform date arithmetic, <code>LocalDate</code>
provides convenience functions for the most frequent cases of adding and
subtracting a time period and finding the start of a week.</p>

<dl>
    <dt>LocalDate.prototype.add(time)</dt>
    <dd>Adds or subtracts a time period in local time. The results may be
    invalid if the end result ends up in the middle of a daylight savings
    switch.
        <ul class="params">
            <li><code>time</code> <i>Number</i> - The time period to add, in
            milliseconds. Use negative values to subtract. See also
            <a href="#Constants">Constants</a>.</li>
            
            <li><b>Returns</b> <i>this</i> - This object for chaining.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.prototype.addUTC(time)</dt>
    <dd>Adds or subtracts a physical time period, i.e. simply increments the
    timestamp.
        <ul class="params">
            <li><code>time</code> <i>Number</i> - The time period to add, in
            milliseconds. Use negative values to subtract. See also
            <a href="#Constants">Constants</a>.</li>
            
            <li><b>Returns</b> <i>this</i> - This object for chaining.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.prototype.addMonths(months)</dt>
    <dd>Adds or subtracts a number of months in local time. The results may be
    invalid if the end result ends up in the middle of a daylight savings
    switch.
        <ul class="params">
            <li><code>months</code> <i>Number</i> - The number of months to add.
            Use negative values to subtract.</li>
            
            <li><b>Returns</b> <i>this</i> - This object for chaining.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.prototype.addYears(years)</dt>
    <dd>Adds or subtracts a number of years in local time. The results may be
    invalid if the end result ends up in the middle of a daylight savings
    switch.
        <ul class="params">
            <li><code>years</code> <i>Number</i> - The number of years to add.
            Use negative values to subtract.</li>
            
            <li><b>Returns</b> <i>this</i> - This object for chaining.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.prototype.setStartOfWeek()</dt>
    <dd>Sets the date to the start of the same week as determined by
    <code>locale.weekStart</code>. The time is reset to midnight.
        <ul class="params">
            <li><b>Returns</b> <i>this</i> - This object for chaining.</li>
        </ul>
    </dd>
</dl>

<p>Formatting functions implement the conversion of dates and intervals into
localized strings which are suitable for direct presentation to the user.</p>

<dl>
    <dt>LocalDate.prototype.format(format)</dt>
    <dd>Formats the date according to the specified format flags or format
    string.
        <ul class="params">
            <li><code>format</code> <i>String or Number</i> - Either a format
            string with the syntax of
            <a href="http://unicode.org/reports/tr35/#Date_Format_Patterns">CLDR
            date format patterns</a>, or one of the <a href="#Constants">format
            flag constants</a>. In the second case, the actual format string is
            localized for the current user's locale according to
            <code>locale.formats</code>. The default value is
            <code>DATE_TIME</code>.</li>
            
            <li><b>Returns</b> <i>String</i> - This object formatted according
            to the specified format.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.prototype.getIntervalFormat(end, format)</dt>
    <dd>Returns a format string for a time interval with this object as
    the start and another <code>LocalDate</code> object as the end.
        <ul class="params">
            <li><code>end</code> <i>LocalDate</i> - The end of
            the interval.</li>
            
            <li><code>format</code> <i>String or Number</i> - Either a format
            string with the syntax of
            <a href="http://unicode.org/reports/tr35/#Date_Format_Patterns">CLDR
            date format patterns</a>, or one of the <a href="#Constants">format
            flag constants</a>. In the second case, the actual format string is
            localized for the current user's locale according to
            <code>locale.intervals</code> and <code>locale.formats</code>.
            The default value is <code>DATE_TIME</code>.</li>
            
            <li><b>Returns</b> <i>String</i> - The format string for
            the interval accorging to the specified format.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.prototype.formatInterval(end, format)</dt>
    <dd>Formats an interval with this object as the start and another
    <code>LocalDate</code> object as the end.
        <ul class="params">
            <li><code>end</code> <i>LocalDate</i> - The end of
            the interval.</li>
            
            <li><code>format</code> <i>String or Number</i> - Either a format
            string with the syntax of
            <a href="http://unicode.org/reports/tr35/#Date_Format_Patterns">CLDR
            date format patterns</a>, or one of the <a href="#Constants">format
            flag constants</a>. In the second case, the actual format string is
            localized for the current user's locale according to
            <code>locale.intervals</code> and <code>locale.formats</code>.
            The default value is <code>DATE_TIME</code>.</li>
            
            <li><b>Returns</b> <i>String</i> - The interval formatted accorging
            to the specified format.</li>
        </ul>
    </dd>
</dl>

<p>Finally, the JavaScript standard conversion functions allow easy debugging
and arithmetic on timestamps.</p>

<dl>
    <dt>LocalDate.prototype.toString()</dt>
    <dd>Converts this object to a string using
    <code>this.format(FULL_DATE)</code>.
        <ul class="params">
            <li><b>Returns</b> <i>String</i> - The string representation of this
            object.</li>
        </ul>
    </dd>
    
    <dt>LocalDate.prototype.valueOf()</dt>
    <dd>Converts this object to a primitive value by returning the UTC
    timestamp. This can be used for arithmetic directly on
    <code>LocalDate</code> objects and as the single parameter to
    <code>new LocalDate()</code>.
        <ul class="params">
            <li><b>Returns</b> <i>Timestamp</i> - The UTC timestamp of this
            object.</li>
        </ul>
    </dd>
</dl>

<h3>Constants</h3>

<p>All date classes operate on timestamps expressed as milliseconds since
the UNIX epoch, 1970-01-01 00:00 UTC. The <code>date</code> module defines
constants for common time intervals with a constant duration.
</p>

<dl>
    <dt>SECOND</dt>
    <dd>Number of milliseconds in a second.</dd>
    
    <dt>MINUTE</dt>
    <dd>Number of milliseconds in a minute.</dd>
    
    <dt>HOUR</dt>
    <dd>Number of milliseconds in an hour.</dd>
    
    <dt>DAY</dt>
    <dd>Number of milliseconds in a day.</dd>
    
    <dt>WEEK</dt>
    <dd>Number of milliseconds in a week.</dd>
</dl>

<p>Format flags for parsing and formatting functions are defined as constants.
Multiple flags can be combined via addition or bitwise ORing.</p>
 
<dl>
    <dt>DAYOFWEEK</dt>
    <dd>Day of the week</dd>
    
    <dt>DATE</dt>
    <dd>Date</dd>
    
    <dt>TIME</dt>
    <dd>Time</dd>
    
    <dt>TIMEZONE</dt>
    <dd>Timezone</dd>
</dl>

<p>Valid format flag combinations have dedicated constants. In a combination,
<code>DAYOFWEEK</code> implies <code>DATE</code> and
<code>TIMEZONE</code> implies <code>TIME</code>.</p>

<dl>
    <dt>DAYOFWEEK_DATE</dt>
    <dd><code>DAYOFWEEK + DATE</code></dd>
    
    <dt>DATE_TIME</dt>
    <dd><code>DATE + TIME</code></dd>
    
    <dt>DAYOFWEEK_DATE_TIME</dt>
    <dd><code>DAYOFWEEK + DATE + TIME</code></dd>
    
    <dt>TIME_TIMEZONE</dt>
    <dd><code>TIME + TIMEZONE</code></dd>
    
    <dt>DATE_TIME_TIMEZONE</dt>
    <dd><code>DATE + TIME + TIMEZONE</code></dd>
    
    <dt>FULL_DATE</dt>
    <dd><code>DAYOFWEEK + DATE + TIME + TIMEZONE</code></dd>
</dl>

<h3>Miscellaneous</h3>

<p>See <a href="#Formatting">Formatting</a> for usage of this function.</p>

<dl>
    <dt>getFormat(format)</dt>
    <dd>Returns the localized format string for the specified format flags.
        <ul class="params">
            <li><code>format</code> <i>String or Number</i> - Either a format
            string with the syntax of
            <a href="http://unicode.org/reports/tr35/#Date_Format_Patterns">CLDR
            date format patterns</a>, or one of the <a href="#Constants">format
            flag constants</a>. In the second case, the actual format string is
            localized for the current user's locale according to
            <code>locale.formats</code>. The default value is
            <code>DATE_TIME</code>.</li>
            
            <li><b>Returns</b> <i>String</i> - The localized format string which
            corresponds to the specified format flags. If <code>format</code> is
            a string, that string is returned unmodified.</li> 
        </ul>
    </dd>
</dl>
