Name:           open-xchange-dynamic-theme
Version:        @OXVERSION@
%define         ox_release 45
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Packager:       Viktor Pracht <viktor.pracht@open-xchange.com>
License:        CC-BY-NC-SA-3.0
Summary:        Dynamic theme with colors read from ConfigCascade
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
%if 0%{?rhel_version} && 0%{?rhel_version} >= 700
BuildRequires:  ant
%else
BuildRequires:  ant-nodeps
%endif
%if 0%{?rhel_version} && 0%{?rhel_version} == 600
BuildRequires: java7-devel
%else
BuildRequires: java-devel >= 1.7.0
%endif
%if 0%{?suse_version}
BuildRequires:  nodejs6
BuildRequires:  npm6
%else
BuildRequires:  nodejs >= 0.10.0
%endif
Requires(post): open-xchange-appsuite-manifest
Requires:       nodejs >= 0.10

%description
Dynamic theme with colors read from ConfigCascade

%if 0%{?rhel_version} || 0%{?fedora_version}
%define docroot /var/www/html/
%else
%define docroot /srv/www/htdocs/
%endif

%prep
%setup -q

%build

%install
export NO_BRP_CHECK_BYTECODE_VERSION=true
ant -Dbasedir=build -DdestDir=%{buildroot} -DpackageName=%{name} -Dhtdoc=%{docroot} -DkeepCache=true -f build/build.xml build

%clean
%{__rm} -rf %{buildroot}

%define update /opt/open-xchange/appsuite/share/update-themes.sh

%post
if [ $1 -eq 1 -a -x %{update} ]; then %{update} --later; fi

%postun
if [ -x %{update} ]; then %{update} --later; fi

%files
%defattr(-,root,root)
%dir /opt/open-xchange
/opt/open-xchange/appsuite
/opt/open-xchange/dynamic-theme
%config(noreplace) /opt/open-xchange/etc/settings/open-xchange-dynamic-theme.properties

%changelog
* Mon Nov 12 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-11-19 (4964)
* Mon Aug 13 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-08-20 (4861)
* Tue Jun 19 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-06-25 (4790)
* Wed May 09 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-05-09 (4744)
* Mon Apr 16 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-04-23 (4669)
* Mon Mar 05 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-03-12 (4601)
* Mon Feb 19 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-02-26 (4582)
* Tue Jan 30 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-02-05 (4554)
* Mon Jan 15 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-01-22 (4537)
* Thu Jan 04 2018 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2018-01-08 (4515)
* Fri Dec 08 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-12-11 (hotfix-4472)
* Thu Nov 16 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-11-20 (4440)
* Wed Oct 25 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for Patch 2017-10-30 (4414)
* Mon Oct 09 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-10-16 (4393)
* Tue Sep 26 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-10-02 (4376)
* Mon Sep 11 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-09-18 (4353)
* Mon Aug 28 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-09-04 (4327)
* Mon Aug 14 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-08-21 (4317)
* Mon Jul 31 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-08-07
* Mon Jul 17 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-07-24 (4284)
* Mon Jul 03 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-07-10 (4256)
* Mon Jun 19 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-06-26 (4223)
* Tue Jun 06 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-06-12 (4186)
* Wed May 17 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-05-29 (4161)
* Tue May 09 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-05-15 (4132)
* Wed Apr 26 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-05-02 (4113)
* Thu Apr 06 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-04-18 (4084)
* Wed Mar 29 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-04-03 (4050)
* Tue Mar 14 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-03-20 (4016)
* Mon Mar 13 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-03-17 (4020)
* Mon Mar 06 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-03-06 (3985)
* Wed Feb 22 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-02-22 (3969)
* Fri Feb 17 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-02-20 (3952)
* Fri Jan 27 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-02-06 (3918)
* Mon Jan 16 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-01-23 (3879)
* Mon Jan 09 2017 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-01-12 (3866)
* Thu Dec 22 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2017-01-09 (3849)
* Wed Dec 14 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2016-12-19 (3814)
* Tue Dec 13 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2016-12-14 (3806)
* Tue Dec 06 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2016-12-12 (3775)
* Tue Nov 29 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Second release candidate for 7.8.3 release
* Thu Nov 24 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for 7.8.3 release
* Tue Nov 15 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Third preview for 7.8.3 release
* Sat Oct 29 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Second preview for 7.8.3 release
* Fri Oct 14 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
First preview of 7.8.3 release
* Tue Sep 06 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.8.3 release
* Tue Jul 12 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Second candidate for 7.8.2 release
* Wed Jul 06 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
First candidate for 7.8.2 release
* Wed Jun 29 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Second preview for 7.8.2 release
* Tue Jun 14 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for 7.8.2
* Fri Apr 08 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.8.2 release
* Wed Mar 30 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Second candidate for 7.8.1 release
* Fri Mar 25 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
First candidate for 7.8.1 release
* Tue Mar 15 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Fifth preview of 7.8.1 release
* Fri Mar 04 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Fourth preview of 7.8.1 release
* Sat Feb 20 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Third candidate for 7.8.1 release
* Tue Feb 02 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Second candidate for 7.8.1 release
* Tue Jan 26 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
First candidate for 7.8.1 release
* Wed Nov 11 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-16 (2862)
* Fri Nov 06 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-09 (2840)
* Tue Nov 03 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-09 (2841)
* Thu Oct 29 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-11 (2844)
* Tue Oct 20 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-10-26 (2816)
* Mon Oct 19 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-10-26 (2812)
* Thu Oct 08 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.8.1 release
* Tue Oct 06 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Sixth candidate for 7.8.0 release
* Wed Sep 30 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-10-12 (2784)
* Fri Sep 25 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Fith candidate for 7.8.0 release
* Thu Sep 24 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-09-28 (2767)
* Fri Sep 18 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Fourth candidate for 7.8.0 release
* Tue Sep 08 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-09-14 (2732)
* Mon Sep 07 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Third candidate for 7.8.0 release
* Fri Aug 21 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Second candidate for 7.8.0 release
* Tue Aug 18 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-08-24 (2674)
* Wed Aug 05 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
First candidate for 7.8.0 release
* Wed Aug 05 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
First candidate for 7.8.0 release
* Wed Aug 05 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-08-10
* Tue Aug 04 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-08-03 (2650)
* Fri Jul 17 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-07-20 (2614)
* Tue Jun 30 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-06-29 (2569)
* Wed Jun 10 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-06-08 (2540)
* Tue May 19 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-05-26 (2521)
* Tue May 05 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-05-04 (2496)
* Fri Apr 24 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-09-09 (2495)
* Thu Apr 23 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-04-17 (2491)
* Tue Apr 14 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-04-13 (2474)
* Fri Mar 13 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Twelfth candidate for 7.6.2 release
* Fri Mar 06 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Eleventh candidate for 7.6.2 release
* Wed Mar 04 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Tenth candidate for 7.6.2 release
* Tue Mar 03 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Nineth candidate for 7.6.2 release
* Tue Feb 24 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Eighth candidate for 7.6.2 release
* Wed Feb 11 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Seventh candidate for 7.6.2 release
* Fri Jan 30 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Sixth candidate for 7.6.2 release
* Tue Jan 27 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Fifth candidate for 7.6.2 release
* Wed Dec 17 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Moved open-xchange-dynamic-theme to the core repository
* Wed Dec 17 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Follow-up release for rpost theme
* Tue Dec 16 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Follow-up release for rpost theme
* Wed Nov 05 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.8.0 release
* Mon Oct 20 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Follow-up release candidate for 7.6.1.
* Wed Oct 15 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Follow-up build.
* Tue Oct 14 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Second release candidate for 7.6.1.
* Thu Oct 02 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for 7.6.1.
* Wed Oct 01 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Prepare backend and appsuite custom plugins for 7.6.1 release
* Thu Sep 25 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Follow-up build with new open-xchange-rpost-theme.
* Wed Sep 24 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
add package open-xchange-rpost-theme
* Wed Aug 06 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
enable provisioning of imap
* Tue Aug 05 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
removed provisioning method from auth method
* Mon Jul 21 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
proxy servlet: better logging, disable admin user
* Fri Jul 18 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Follow-up release for dropping specifc java6 dependency artefacts
* Wed Jul 16 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Second release candidate for hotfix release for ptf 2091
* Wed Jul 16 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Hotfix release for ptf 2091
* Tue Jul 15 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Fourth release candidate for OX 7.6.0
* Mon Jul 14 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Third release candidate for OX 7.6.0
* Fri Jul 11 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Second release candidate for OX 7.6.0
* Mon Jun 23 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
First release candidate for OX 7.6.0
* Wed Jun 11 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Prepare backend and appsuite custom plugins for 7.6.0 release
* Mon May 19 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Release build to fix static theming
* Thu May 08 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Release build for PTF 2005
* Wed Apr 23 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Release build for PTF 2000
* Tue Apr 08 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Bugfix build for ptf 1984
* Thu Apr 03 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Follow-up release for bugfix 31524
* Mon Mar 17 2014 Viktor Pracht <viktor.pracht@open-xchange.com>
Initial Release.
