/*
TODO: REMOVE ME WHEN MERGING INTO RELEASE-7.4.0 OR DEVELOP

Grundlage
==========
+ attachments.js dient als zentrale klasse für attachment handling
+ EditableAttachmentList: genutzt für task, calendar (mit model anbindung)
+ EditableFileList: von mir (frank) eingeführt und bisher nur für file upload (dialog) genutzt

Aufgabe
=========
EditableAttachmentList in mail nutzen

Grund
=====

a) https://bugs.open-xchange.com/show_bug.cgi?id=27966
b) aufhübschen in mail


Arbeitspakete: erledigt
========================
1. mail styles übertragen
- beim initalisieren von EditableAttachmentList können extra klassen angegeben werden, um die
  unterschieldichen styles in mail und files zu ermöglichen (hintergrundfarbe und span)

2. unterstützen von preview (aktuell nur für mail sinvoll, da in files die attachments in einem popup bearbeitet werden)

3. Add Attachment + Icon
392b11b29c5f7473100f9c97cd326e31f622d84d



Arbeitspakete: offen
====================
4. contact per mail
conacts api anbinden (einfach nach contactsAPI in attachments.js suchen)

5. potentiell offene baustellen (läuft, aber noch nicht 100% durchgetestet)
- infostore file per mail
- forward als attachment (nested)
- contact per mail
- dnd

6. ggf. andere Stellen die Mail mit attachments befüttern?

7. alles was nach dem click auf send/save bzw. dem autosave passiert

8. polish, hardening


BEI FRAGEN STEHE ICH IM REGELFALL PER MAIL/MOBILE ZUR VERFÜGUNG. KEINE FALSCHE SCHEU!

*/
