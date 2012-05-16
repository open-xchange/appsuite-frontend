<label for='io-ox-calendar-edit-title'><%= LABEL_SUBJECT %>
    <input type='text' class='discreet input-large io-ox-calendar-edit-title abs' />
</label>

<label for='io-ox-calendar-edit-location'><%= LABEL_LOCATION %>
    <input type='text' class='discreet input-large io-ox-calendar-edit-location' />
</label>

<label><%= LABEL_STARTS_AT %>
    <input type='text' class='discreet io-ox-calendar-edit-startsat-date' />
    <input type='text' class='discreet io-ox-calendar-edit-startsat-time' />
    <input type='checkbox' class='io-ox-calendar-edit-fulltime' />
</label>

<label><%= LABEL_ENDS_AT %>
    <input type='text' class='discreet io-ox-calendar-edit-endsat-date' />
    <input type='text' class='discreet io-ox-calendar-edit-endsat-time' disabled='true'/>
</label>

<label><%= LABEL_REMINDER %>
    <select class='io-ox-calendar-edit-notification'>
    </select>
    <input type='checkbox' class='io-ox-calendar-edit-notifyall' />
</label>

<label><%= LABEL_NOTE %>
    <textarea class='io-ox-calendar-edit-note'>
    </textarea>
</label>
