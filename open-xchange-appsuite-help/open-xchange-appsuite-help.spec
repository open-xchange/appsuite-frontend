Name:           open-xchange-appsuite-help
BuildArch:      noarch
%if 0%{?rhel_version} && 0%{?rhel_version} >= 700
BuildRequires:  ant
%else
BuildRequires:  ant-nodeps
%endif
BuildRequires:  java-devel >= 1.6.0
%if 0%{?suse_version}
BuildRequires:  nodejs6
BuildRequires:  npm6
%else
BuildRequires:  nodejs >= 0.10.0
%endif
Version:        @OXVERSION@
%define         ox_release 68
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Julian Baeume <julian.baeume@open-xchange.com>
License:        CC-BY-NC-SA
Summary:        OX App Suite online help
Source:         %{name}_%{version}.orig.tar.bz2
BuildRoot:      %{_tmppath}/%{name}-%{version}-root

%if 0%{?rhel_version} || 0%{?fedora_version}
%define docroot /var/www/html/
%else
%define docroot /srv/www/htdocs/
%endif

%description
OX App Suite help files

%package        common
Group:          Applications/Productivity
Summary:        Language-independent files of online help for OX App Suite

%description    common
Language-independent files of online help for OX App Suite

%package       de-de
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (de_DE)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   de-de
Online help for OX App Suite (de_DE)

%package       en-gb
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (en_GB)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   en-gb
Online help for OX App Suite (en_GB)

%package       en-us
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (en_US)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   en-us
Online help for OX App Suite (en_US)

%package       es-es
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (es_ES)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   es-es
Online help for OX App Suite (es_ES)

%package       es-mx
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (es_MX)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   es-mx
Online help for OX App Suite (es_MX)

%package       fr-fr
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (fr_FR)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   fr-fr
Online help for OX App Suite (fr_FR)

%package       it-it
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (it_IT)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   it-it
Online help for OX App Suite (it_IT)

%package       ja-jp
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (ja_JP)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   ja-jp
Online help for OX App Suite (ja_JP)

%package       nl-nl
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (nl_NL)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   nl-nl
Online help for OX App Suite (nl_NL)

%package       pl-pl
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (pl_PL)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   pl-pl
Online help for OX App Suite (pl_PL)

%package       zh-cn
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (zh_CN)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   zh-cn
Online help for OX App Suite (zh_CN)

%package       zh-tw
Group:         Applications/Productivity
Summary:       Online help for OX App Suite (zh_TW)
Provides:      open-xchange-appsuite-help
Requires:      open-xchange-appsuite-help-common

%description   zh-tw
Online help for OX App Suite (zh_TW)

%prep

%setup -q

%build

%install
export NO_BRP_CHECK_BYTECODE_VERSION=true
ant -Dbasedir=build -DdestDir=%{buildroot} -DpackageName=%{name} -Dhtdoc=%{docroot} -Dlanguages=false -DkeepCache=true -f build/build.xml build
for LANG in de_DE en_GB en_US es_ES es_MX fr_FR it_IT ja_JP nl_NL pl_PL zh_CN zh_TW; do
    ant -Dbasedir=build -DdestDir=%{buildroot} -DpackageName=%{name} -Dhtdoc=%{docroot} -DinstallTarget=${LANG} -DkeepCache=true -Dnoclean=true -f build/build.xml clean build
done

%clean
%{__rm} -rf %{buildroot}

%files common
%defattr(-,root,root)
%dir %{docroot}/appsuite
%{docroot}/appsuite/help
%exclude %{docroot}/appsuite/help/l10n

%files de-de
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/de_DE

%files en-gb
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/en_GB

%files en-us
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/en_US

%files es-es
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/es_ES

%files es-mx
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/es_MX

%files fr-fr
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/fr_FR

%files it-it
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/it_IT

%files ja-jp
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/ja_JP

%files nl-nl
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/nl_NL

%files pl-pl
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/pl_PL

%files zh-cn
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/zh_CN

%files zh-tw
%defattr(-,root,root)
%dir %{docroot}/appsuite/help/l10n
%{docroot}/appsuite/help/l10n/zh_TW

%changelog
* Thu Dec 02 2021 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2021-12-13 (6057)
* Wed Aug 25 2021 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2021-08-30 (6018)
* Tue Apr 20 2021 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2021-04-26 (5985)
* Wed Jun 24 2020 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2020-06-30 (5779)
* Fri Jun 05 2020 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2020-06-15 (5763)
* Mon May 04 2020 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2020-05-11 (5717)
* Wed Feb 26 2020 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2020-03-02 (5624)
* Mon Feb 03 2020 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2020-02-10 (5578)
* Mon Nov 18 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-11-25 (5482)
* Thu Oct 24 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-10-28 (5460)
* Tue Oct 08 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-10-14 (5437)
* Mon Sep 23 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-09-30 (5418)
* Mon Sep 02 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-09-09 (5395)
* Mon Aug 12 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-08-22 (5369)
* Tue Jul 23 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-07-29 (5339)
* Tue Jun 04 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-06-11 (5275)
* Mon May 06 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-05-13 (5233)
* Fri Apr 26 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-04-29 (5209)
* Mon Mar 25 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-04-01 (5178)
* Fri Feb 22 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-02-25 (5131)
* Mon Feb 04 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-02-11 (5106)
* Tue Jan 22 2019 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2019-01-28 (5074)
* Mon Dec 10 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-12-17 (5017)
* Thu Nov 15 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-11-19 (4965)
* Tue Oct 30 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-11-05 (4932)
* Thu Oct 11 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-10-15 (4917)
* Tue Sep 25 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-10-01 (4896)
* Mon Aug 27 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-09-03 (4869)
* Mon Aug 13 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-08-20 (4862)
* Mon Jul 30 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-08-06 (4850)
* Tue Jul 17 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-07-23 (4834)
* Fri Jul 06 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-07-09 (4819)
* Fri Jun 29 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-06-28 (4822)
* Tue Jun 26 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-07-03 (4817)
* Wed Jun 20 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-06-25 (4791)
* Mon Jun 11 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-06-20 (4783)
* Wed Jun 06 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-06-11 (4771)
* Tue May 22 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-05-28 (4758)
* Mon May 07 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-05-07 (4685)
* Mon Apr 23 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-04-26 (4682)
* Mon Apr 16 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-04-23 (4670)
* Thu Apr 12 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-04-23 (4673)
* Wed Apr 11 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-04-11 (4646)
* Tue Apr 03 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-04-09 (4642)
* Tue Mar 20 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-03-26 (4619)
* Mon Mar 05 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-03-12 (4602)
* Wed Feb 28 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-03-09 (4597)
* Mon Feb 19 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-02-26 (4583)
* Tue Jan 30 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-02-05 (4555)
* Mon Jan 15 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-01-22 (4538)
* Thu Jan 04 2018 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2018-01-08 (hotfix-4516)
* Fri Dec 08 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-12-11 (hotfix-4473)
* Mon Nov 20 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-11-20 (4441)
* Wed Oct 25 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-10-30 (4415)
* Fri Oct 13 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-10-16 (4394)
* Thu Sep 28 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-10-02 (4377)
* Thu Sep 21 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-09-22 (4373)
* Tue Sep 12 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-09-18 (4354)
* Wed Aug 30 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-09-04 (4328)
* Tue Aug 15 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-08-21 (4318)
* Tue Aug 01 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-08-07 (4304)
* Mon Jul 17 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-07-24 (4285)
* Fri Jul 07 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-07-10 (4257)
* Wed Jun 21 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-06-26 (4233)
* Tue Jun 06 2017 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2017-06-08 (4180)
* Fri May 19 2017 Marcus Klein <marcus.klein@open-xchange.com>
First candidate for 7.8.4 release
* Thu May 04 2017 Marcus Klein <marcus.klein@open-xchange.com>
Second preview of 7.8.4 release
* Mon Apr 03 2017 Marcus Klein <marcus.klein@open-xchange.com>
First preview of 7.8.4 release
* Fri Dec 02 2016 Marcus Klein <marcus.klein@open-xchange.com>
prepare for 7.8.4 release
* Tue Nov 29 2016 Marcus Klein <marcus.klein@open-xchange.com>
Second release candidate for 7.8.3 release
* Thu Nov 24 2016 Marcus Klein <marcus.klein@open-xchange.com>
First release candidate for 7.8.3 release
* Tue Nov 15 2016 Marcus Klein <marcus.klein@open-xchange.com>
Third preview for 7.8.3 release
* Sat Oct 29 2016 Marcus Klein <marcus.klein@open-xchange.com>
Second preview for 7.8.3 release
* Fri Oct 14 2016 Marcus Klein <marcus.klein@open-xchange.com>
First preview of 7.8.3 release
* Tue Sep 06 2016 Marcus Klein <marcus.klein@open-xchange.com>
prepare for 7.8.3 release
* Tue Jul 12 2016 Marcus Klein <marcus.klein@open-xchange.com>
Second candidate for 7.8.2 release
* Wed Jul 06 2016 Marcus Klein <marcus.klein@open-xchange.com>
First candidate for 7.8.2 release
* Wed Jun 29 2016 Marcus Klein <marcus.klein@open-xchange.com>
Second preview for 7.8.2 release
* Tue Jun 14 2016 Marcus Klein <marcus.klein@open-xchange.com>
First release candidate for 7.8.2
* Fri Apr 08 2016 Marcus Klein <marcus.klein@open-xchange.com>
prepare for 7.8.2 release
* Wed Mar 30 2016 Marcus Klein <marcus.klein@open-xchange.com>
Second candidate for 7.8.1 release
* Fri Mar 25 2016 Marcus Klein <marcus.klein@open-xchange.com>
First candidate for 7.8.1 release
* Tue Mar 15 2016 Marcus Klein <marcus.klein@open-xchange.com>
Fifth preview of 7.8.1 release
* Fri Mar 04 2016 Marcus Klein <marcus.klein@open-xchange.com>
Fourth preview of 7.8.1 release
* Sat Feb 20 2016 Marcus Klein <marcus.klein@open-xchange.com>
Third candidate for 7.8.1 release
* Tue Feb 02 2016 Marcus Klein <marcus.klein@open-xchange.com>
Second candidate for 7.8.1 release
* Tue Jan 26 2016 Marcus Klein <marcus.klein@open-xchange.com>
First candidate for 7.8.1 release
* Wed Nov 11 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-11-16 (2862)
* Fri Nov 06 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-11-09 (2840)
* Tue Nov 03 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-11-09 (2841)
* Thu Oct 29 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-11-11 (2844)
* Tue Oct 20 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-10-26 (2816)
* Mon Oct 19 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-10-26 (2812)
* Thu Oct 08 2015 Marcus Klein <marcus.klein@open-xchange.com>
prepare for 7.8.1 release
* Tue Oct 06 2015 Marcus Klein <marcus.klein@open-xchange.com>
Sixth candidate for 7.8.0 release
* Wed Sep 30 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-10-12 (2784)
* Fri Sep 25 2015 Marcus Klein <marcus.klein@open-xchange.com>
Fith candidate for 7.8.0 release
* Thu Sep 24 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-09-28 (2767)
* Fri Sep 18 2015 Marcus Klein <marcus.klein@open-xchange.com>
Fourth candidate for 7.8.0 release
* Tue Sep 08 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-09-14 (2732)
* Mon Sep 07 2015 Marcus Klein <marcus.klein@open-xchange.com>
Third candidate for 7.8.0 release
* Fri Aug 21 2015 Marcus Klein <marcus.klein@open-xchange.com>
Second candidate for 7.8.0 release
* Tue Aug 18 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-08-24 (2674)
* Thu Aug 06 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-08-17 (2666)
* Wed Aug 05 2015 Marcus Klein <marcus.klein@open-xchange.com>
First candidate for 7.8.0 release
* Wed Aug 05 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-08-10
* Tue Aug 04 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-08-03 (2650)
* Fri Jul 17 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-07-20 (2637)
* Fri Jul 17 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-07-20 (2614)
* Tue Jun 30 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-06-29 (2569)
* Wed Jun 24 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-06-26 (2573)
* Wed Jun 10 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-06-08 (2540)
* Tue Jun 09 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-06-08 (2539)
* Tue May 19 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-05-26 (2521)
* Fri May 15 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-05-26 (2520)
* Tue May 05 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-05-04 (2496)
* Fri Apr 24 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-09-09 (2495)
* Thu Apr 23 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-04-17 (2491)
* Tue Apr 14 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-04-13 (2473)
* Tue Apr 14 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-04-13 (2474)
* Fri Mar 27 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-03-29 (2475)
* Wed Mar 25 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-03-30 (2459)
* Mon Mar 23 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-03-30 (2446)
* Fri Mar 13 2015 Marcus Klein <marcus.klein@open-xchange.com>
Twelfth candidate for 7.6.2 release
* Fri Mar 13 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-03-16
* Fri Mar 06 2015 Marcus Klein <marcus.klein@open-xchange.com>
Eleventh candidate for 7.6.2 release
* Wed Mar 04 2015 Marcus Klein <marcus.klein@open-xchange.com>
Tenth candidate for 7.6.2 release
* Tue Mar 03 2015 Marcus Klein <marcus.klein@open-xchange.com>
Nineth candidate for 7.6.2 release
* Tue Feb 24 2015 Marcus Klein <marcus.klein@open-xchange.com>
Eighth candidate for 7.6.2 release
* Thu Feb 12 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-02-23
* Wed Feb 11 2015 Marcus Klein <marcus.klein@open-xchange.com>
Seventh candidate for 7.6.2 release
* Tue Feb 10 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-02-11
* Tue Feb 03 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-02-09
* Fri Jan 30 2015 Marcus Klein <marcus.klein@open-xchange.com>
Sixth candidate for 7.6.2 release
* Tue Jan 27 2015 Marcus Klein <marcus.klein@open-xchange.com>
Fifth candidate for 7.6.2 release
* Wed Jan 21 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-10-27
* Wed Jan 21 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-01-26
* Wed Jan 07 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-01-12
* Tue Dec 16 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-12-22
* Fri Dec 12 2014 Marcus Klein <marcus.klein@open-xchange.com>
Fourth candidate for 7.6.2 release
* Wed Dec 10 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-12-15
* Fri Dec 05 2014 Marcus Klein <marcus.klein@open-xchange.com>
Third candidate for 7.6.2 release
* Tue Nov 25 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-12-01
* Fri Nov 21 2014 Marcus Klein <marcus.klein@open-xchange.com>
Second candidate for 7.6.2 release
* Thu Nov 13 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-11-17
* Wed Nov 05 2014 Marcus Klein <marcus.klein@open-xchange.com>
prepare for 7.8.0 release
* Fri Oct 31 2014 Marcus Klein <marcus.klein@open-xchange.com>
First candidate for 7.6.2 release
* Tue Oct 28 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-11-03
* Mon Oct 27 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-10-30
* Wed Oct 22 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-10-22
* Tue Oct 14 2014 Marcus Klein <marcus.klein@open-xchange.com>
Fifth candidate for 7.6.1 release
* Mon Oct 13 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-10-20
* Fri Oct 10 2014 Marcus Klein <marcus.klein@open-xchange.com>
Fourth candidate for 7.6.1 release
* Thu Oct 02 2014 Marcus Klein <marcus.klein@open-xchange.com>
Third candidate for 7.6.1 release
* Tue Sep 30 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-10-06
* Tue Sep 23 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-10-02
* Wed Sep 17 2014 Marcus Klein <marcus.klein@open-xchange.com>
prepare for 7.6.2 release
* Tue Sep 16 2014 Marcus Klein <marcus.klein@open-xchange.com>
Second candidate for 7.6.1 release
* Thu Sep 11 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-09-15
* Fri Sep 05 2014 Marcus Klein <marcus.klein@open-xchange.com>
First release candidate for 7.6.1
* Fri Sep 05 2014 Marcus Klein <marcus.klein@open-xchange.com>
prepare for 7.6.1
* Wed Aug 20 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-08-25
* Mon Aug 11 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-08-11
* Wed Jul 23 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-07-30
* Mon Jul 21 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-07-21
* Wed Jun 25 2014 Marcus Klein <marcus.klein@open-xchange.com>
Seventh candidate for 7.6.0 release
* Fri Jun 20 2014 Marcus Klein <marcus.klein@open-xchange.com>
Sixth candidate for 7.6.0 release
* Fri Jun 13 2014 Marcus Klein <marcus.klein@open-xchange.com>
Fifth candidate for 7.6.0 release
* Fri May 30 2014 Marcus Klein <marcus.klein@open-xchange.com>
Fourth candidate for 7.6.0 release
* Fri May 16 2014 Marcus Klein <marcus.klein@open-xchange.com>
Third candidate for 7.6.0 release
* Mon May 05 2014 Marcus Klein <marcus.klein@open-xchange.com>
Second release candidate for 7.6.0
* Tue Apr 22 2014 Marcus Klein <marcus.klein@open-xchange.com>
First release candidate for 7.6.0
* Thu Apr 03 2014 Marcus Klein <marcus.klein@open-xchange.com>
prepare for 7.6.0
* Fri Mar 21 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-03-24
* Fri Mar 21 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-03-24
* Wed Mar 19 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-03-24
* Fri Mar 14 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-03-14
* Tue Mar 04 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-03-04
* Tue Mar 04 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-03-05
* Thu Feb 27 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-03-05
* Thu Feb 27 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-03-05
* Tue Feb 25 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-02-24
* Tue Feb 25 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-02-26
* Tue Feb 25 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-02-26
* Thu Feb 20 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-02-20
* Tue Feb 11 2014 Markus Wagner <markus.wagner@open-xchange.com>
Sixth candidate for 7.4.2 release
* Fri Feb 07 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-02-07
* Thu Feb 06 2014 Markus Wagner <markus.wagner@open-xchange.com>
Fifth candidate for 7.4.2 release
* Tue Feb 04 2014 Markus Wagner <markus.wagner@open-xchange.com>
Fourth candidate for 7.4.2 release
* Tue Jan 28 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-01-30
* Fri Jan 24 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2014-01-22
* Thu Jan 23 2014 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.4.2 release
* Fri Jan 10 2014 Markus Wagner <markus.wagner@open-xchange.com>
Second candidate for 7.4.2 release
* Thu Jan 02 2014 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-12-09
* Mon Dec 23 2013 Markus Wagner <markus.wagner@open-xchange.com>
First candidate for 7.4.2 release
* Thu Dec 19 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-12-23
* Thu Dec 19 2013 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.4.2
* Tue Dec 10 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-11-29
* Thu Dec 05 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-12-09
* Wed Nov 20 2013 Markus Wagner <markus.wagner@open-xchange.com>
Fifth candidate for 7.4.1 release
* Mon Nov 18 2013 Markus Wagner <markus.wagner@open-xchange.com>
Fourth candidate for 7.4.1 release
* Tue Nov 12 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-11-13
* Mon Nov 11 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-11-08
* Thu Nov 07 2013 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.4.1 release
* Wed Oct 30 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-10-28
* Wed Oct 23 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-10-28
* Wed Oct 23 2013 Markus Wagner <markus.wagner@open-xchange.com>
Second candidate for 7.4.1 release
* Thu Oct 10 2013 Markus Wagner <markus.wagner@open-xchange.com>
First sprint increment for 7.4.1 release
* Wed Oct 09 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-10-09
* Wed Oct 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-10-03
* Wed Sep 25 2013 Markus Wagner <markus.wagner@open-xchange.com>
Eleventh candidate for 7.4.0 release
* Fri Sep 20 2013 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.4.1 release
* Fri Sep 20 2013 Markus Wagner <markus.wagner@open-xchange.com>
Tenth candidate for 7.4.0 release
* Tue Sep 17 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-09-26
* Fri Sep 13 2013 Markus Wagner <markus.wagner@open-xchange.com>
Ninth candidate for 7.4.0 release
* Wed Sep 11 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2013-09-12
* Wed Sep 11 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-09-12
* Mon Sep 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-09-26
* Mon Sep 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Eighth candidate for 7.4.0 release
* Tue Aug 27 2013 Markus Wagner <markus.wagner@open-xchange.com>
Seventh candidate for 7.4.0 release
* Mon Aug 26 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-08-26
* Fri Aug 23 2013 Markus Wagner <markus.wagner@open-xchange.com>
Sixth candidate for 7.4.0 release
* Tue Aug 20 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-08-19
* Mon Aug 19 2013 Markus Wagner <markus.wagner@open-xchange.com>
Fifth candidate for 7.4.0 release
* Tue Aug 13 2013 Markus Wagner <markus.wagner@open-xchange.com>
Fourth candidate for 7.4.0 release
* Tue Aug 06 2013 Markus Wagner <markus.wagner@open-xchange.com>
Third release candidate for 7.4.0
* Mon Aug 05 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-08-09
* Fri Aug 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Second release candidate for 7.4.0
* Mon Jul 22 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-07-22
* Wed Jul 17 2013 Markus Wagner <markus.wagner@open-xchange.com>
First release candidate for 7.4.0
* Tue Jul 16 2013 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.4.0
* Mon Jul 15 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-07-25
* Thu Jul 11 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-07-09
* Tue Jul 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.2.2 release
* Fri Jun 28 2013 Markus Wagner <markus.wagner@open-xchange.com>
Second candidate for 7.2.2 release
* Wed Jun 26 2013 Markus Wagner <markus.wagner@open-xchange.com>
Release candidate for 7.2.2 release
* Fri Jun 21 2013 Markus Wagner <markus.wagner@open-xchange.com>
Second feature freeze for 7.2.2 release
* Thu Jun 20 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-06-20
* Tue Jun 18 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-06-17
* Wed Jun 12 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-06-14
* Mon Jun 03 2013 Markus Wagner <markus.wagner@open-xchange.com>
Sprint increment for 7.2.2 release
* Mon Jun 03 2013 Markus Wagner <markus.wagner@open-xchange.com>
First sprint increment for 7.2.2 release
* Wed May 29 2013 Markus Wagner <markus.wagner@open-xchange.com>
First candidate for 7.2.2 release
* Wed May 22 2013 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.2.1 release
* Wed May 15 2013 Markus Wagner <markus.wagner@open-xchange.com>
Second candidate for 7.2.1 release
* Wed May 15 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-05-10
* Thu May 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Build for patch 2013-04-23
* Mon Apr 22 2013 Markus Wagner <markus.wagner@open-xchange.com>
First candidate for 7.2.1 release
* Mon Apr 15 2013 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.2.1
* Wed Apr 10 2013 Markus Wagner <markus.wagner@open-xchange.com>
Fourth candidate for 7.2.0 release
* Mon Apr 08 2013 Markus Wagner <markus.wagner@open-xchange.com>
Third candidate for 7.2.0 release
* Tue Apr 02 2013 Markus Wagner <markus.wagner@open-xchange.com>
Second candidate for 7.2.0 release
* Tue Mar 26 2013 Markus Wagner <markus.wagner@open-xchange.com>
First release candidate for 7.2.0
* Fri Mar 15 2013 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.2.0
* Fri Mar 15 2013 Markus Wagner <markus.wagner@open-xchange.com>
prepare for 7.2.0
* Thu Feb 28 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2013-03-01
* Tue Feb 19 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
Fourth release candidate for 7.0.1
* Tue Feb 19 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
Third release candidate for 7.0.1
* Thu Feb 14 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
Second release candiate for 7.0.1
* Fri Feb 01 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for 7.0.1
* Fri Feb 01 2013 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.0.1
* Tue Dec 18 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Third release candidate for 7.0.0
* Mon Dec 17 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Second release candidate for 7.0.0
* Thu Dec 13 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Pre release candidate for 7.0.0
* Tue Dec 11 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for 7.0.0
* Tue Nov 13 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for EDP drop #6
* Mon Oct 22 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Third release candidate for EDP drop #5
* Mon Oct 22 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Second release candidate for EDP drop #5
* Fri Oct 12 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for EDP drop #5
* Tue Sep 04 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for EDP drop #4
* Tue Aug 07 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Release build for 7.0.0
* Tue Aug 07 2012 Viktor Pracht <viktor.pracht@open-xchange.com>
Release build for EDP drop #3
* Wed Nov 09 2011 Viktor Pracht <viktor.pracht@open-xchange.com>
Initial Release.
