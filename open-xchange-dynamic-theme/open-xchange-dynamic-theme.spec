Name:           open-xchange-dynamic-theme
Version:        @OXVERSION@
%define         ox_release 6
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Packager:       Viktor Pracht <viktor.pracht@open-xchange.com>
License:        CC-BY-NC-SA-3.0
Summary:        Dynamic theme with colors read from ConfigCascade
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
BuildRequires:  ant-nodeps
BuildRequires:  java-devel >= 1.6.0
BuildRequires:  nodejs >= 0.10.0

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
if [ $1 -eq 1 -a -x %{update} ]; then %{update}; fi

%postun
if [ -x %{update} ]; then %{update}; fi

%files
%defattr(-,root,root)
%dir /opt/open-xchange
/opt/open-xchange/appsuite
/opt/open-xchange/dynamic-theme
%config(noreplace) /opt/open-xchange/etc/settings/open-xchange-dynamic-theme.properties

%changelog
* Mon Feb 22 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2016-02-29 (3120)
* Mon Feb 01 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2016-02-08 (3072)
* Tue Jan 19 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2016-01-25 (3030)
* Mon Jan 04 2016 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2016-01-13 (2972)
* Tue Dec 01 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Second release candidate for 7.6.3
* Tue Nov 17 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-23 (2882)
* Mon Nov 16 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-13 (2879)
* Wed Nov 11 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-16 (2862)
* Tue Nov 03 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-09 (2841)
* Thu Oct 29 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-11-11 (2844)
* Mon Oct 26 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
First candidate for 7.6.3 release
* Wed Sep 30 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch  2015-10-12 (2784)
* Thu Sep 24 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-09-28 (2767)
* Tue Sep 08 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-09-14 (2732)
* Tue Aug 18 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
Build for patch 2015-08-24 (2674)
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
* Wed Mar 25 2015 Viktor Pracht <viktor.pracht@open-xchange.com>
prepare for 7.6.3 release
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
