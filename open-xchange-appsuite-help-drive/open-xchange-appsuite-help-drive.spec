Name:           open-xchange-appsuite-help-drive
BuildArch:      noarch
BuildRequires:  ant
BuildRequires:  ant-nodeps
BuildRequires:  java-devel >= 1.6.0
BuildRequires:  nodejs >= 0.10.0
Version:        @OXVERSION@
%define         ox_release 22
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Julian Baeume <julian.baeume@open-xchange.com>
License:        CC-BY-NC-SA
Summary:        OX App Suite Drive online help
Source:         %{name}_%{version}.orig.tar.bz2
BuildRoot:      %{_tmppath}/%{name}-%{version}-root

%if 0%{?rhel_version} || 0%{?fedora_version}
%define docroot /var/www/html/
%else
%define docroot /srv/www/htdocs/
%endif

%description
OX App Suite drive help files

%package       common
Group:         Applications/Productivity
Summary:       Language-independent files of online help for OX Drive

%description   common
Language-independent files of online help for OX Drive

%package       de-de
Group:         Applications/Productivity
Summary:       Online help for OX Drive (de_DE)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   de-de
Online help for OX Drive (de_DE)

%package       en-gb
Group:         Applications/Productivity
Summary:       Online help for OX Drive (en_GB)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   en-gb
Online help for OX Drive (en_GB)

%package       en-us
Group:         Applications/Productivity
Summary:       Online help for OX Drive (en_US)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   en-us
Online help for OX Drive (en_US)

%package       es-es
Group:         Applications/Productivity
Summary:       Online help for OX Drive (es_ES)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   es-es
Online help for OX Drive (es_ES)

%package       es-mx
Group:         Applications/Productivity
Summary:       Online help for OX Drive (es_MX)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   es-mx
Online help for OX Drive (es_MX)

%package       fr-fr
Group:         Applications/Productivity
Summary:       Online help for OX Drive (fr_FR)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   fr-fr
Online help for OX Drive (fr_FR)

%package       it-it
Group:         Applications/Productivity
Summary:       Online help for OX Drive (it_IT)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   it-it
Online help for OX Drive (it_IT)

%package       ja-jp
Group:         Applications/Productivity
Summary:       Online help for OX Drive (ja_JP)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   ja-jp
Online help for OX Drive (ja_JP)

%package       nl-nl
Group:         Applications/Productivity
Summary:       Online help for OX Drive (nl_NL)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   nl-nl
Online help for OX Drive (nl_NL)

%package       pl-pl
Group:         Applications/Productivity
Summary:       Online help for OX Drive (pl_PL)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   pl-pl
Online help for OX Drive (pl_PL)

%package       zh-cn
Group:         Applications/Productivity
Summary:       Online help for OX Drive (zh_CN)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   zh-cn
Online help for OX Drive (zh_CN)

%package       zh-tw
Group:         Applications/Productivity
Summary:       Online help for OX Drive (zh_TW)
Provides:      open-xchange-appsuite-help-drive
Requires:      open-xchange-appsuite-help-drive-common

%description   zh-tw
Online help for OX Drive (zh_TW)

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
%{docroot}/appsuite/help-drive

%files de-de
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help-drive/l10n
%{docroot}/appsuite/help-drive/l10n/de_DE

%files en-gb
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help-drive/l10n
%{docroot}/appsuite/help-drive/l10n/en_GB

%files en-us
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help-drive/l10n
%{docroot}/appsuite/help-drive/l10n/en_US

%files es-es
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help-drive/l10n
%{docroot}/appsuite/help-drive/l10n/es_ES

%files es-mx
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help-drive/l10n
%{docroot}/appsuite/help-drive/l10n/es_MX

%files fr-fr
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help-drive/l10n
%{docroot}/appsuite/help-drive/l10n/fr_FR

%files it-it
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help-drive/l10n
%{docroot}/appsuite/help-drive/l10n/it_IT

%files ja-jp
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help-drive/l10n
%{docroot}/appsuite/help-drive/l10n/ja_JP

%files nl-nl
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help-drive/l10n
%{docroot}/appsuite/help-drive/l10n/nl_NL

%files pl-pl
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help-drive/l10n
%{docroot}/appsuite/help-drive/l10n/pl_PL

%files zh-cn
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help-drive/l10n
%{docroot}/appsuite/help-drive/l10n/zh_CN

%files zh-tw
%defattr(-,root,root)
%dir %{docroot}/appsuite
%dir %{docroot}/appsuite/help-drive/l10n
%{docroot}/appsuite/help-drive/l10n/zh_TW

%changelog
* Fri May 15 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-05-26 (2520)
* Tue Apr 14 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-04-13 (2473)
* Fri Mar 27 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-03-29 (2475)
* Wed Mar 25 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-03-30 (2459)
* Mon Mar 23 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-03-30 (2446)
* Fri Mar 13 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-03-16
* Thu Feb 12 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-02-23
* Tue Feb 10 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-02-11
* Tue Feb 03 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-02-09
* Wed Jan 21 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-10-27
* Wed Jan 21 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-01-26
* Wed Jan 07 2015 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2015-01-12
* Tue Dec 16 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-12-22
* Wed Dec 10 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-12-15
* Tue Nov 25 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-12-01
* Thu Nov 13 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-11-17
* Mon Oct 27 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-10-30
* Tue Oct 14 2014 Marcus Klein <marcus.klein@open-xchange.com>
Fifth candidate for 7.6.1 release
* Fri Oct 10 2014 Marcus Klein <marcus.klein@open-xchange.com>
Fourth candidate for 7.6.1 release
* Thu Oct 02 2014 Marcus Klein <marcus.klein@open-xchange.com>
Third candidate for 7.6.1 release
* Tue Sep 30 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-10-06
* Tue Sep 23 2014 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2014-10-02
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
