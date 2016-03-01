---
title: Definition of Done
description:
source: http://oxpedia.org/wiki/index.php?title=AppSuite:Definition_of_done
---

Sprints are two weeks (10 work days) long. The first seven days focus on
feature development, the last three focus on quality. The first part
needs a “definition of done”.

# Definition of done

- Tasks of user story are all done
- Tested once on a browser with very small window size to check responsiveness
- Tested once with either an iOS or an Android device
- Documentation in OXpedia (if necessary/required)
- Code has been merged into origin/develop
- i18n and l10n issues are checked
- Code is commented where necessary (what does it, what goes in, what
  comes out)

If done, a user story is marked as “Delivered”. Requestor then accepts
or rejects the user story.

# 3 days

- Tested with all permutations of iOS/Android and smartphone/tablet
- Tested with Firefox, Chrome, Safari and IE9
- At least one smoke test is written, L3 bugs get a test, too
- Checked for responsiveness criteria (e.g. busy(), notifications)
- Slow & fail parameters have been experimented with, ox.load() is used instead of require
- Performance is tested
- Theming works (use the pink theme)
- All software change requests have been started (in case of API changes, new settings...)
- Accessibility checks done
