Name:           open-xchange-appsuite-saml
Version:        @OXVERSION@
%define         ox_release 18
Release:        %{ox_release}
Group:          Applications/Productivity
Packager:       Francisco Laguna <francisco.laguna@open-xchange.com>
License:        CC-BY-NC-SA-3.0
Summary:        Mandatory wizard with custom translations
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
BuildRequires:  ant-nodeps
BuildRequires:  java-devel >= 1.6.0
BuildRequires:  nodejs >= 0.10.0

Requires(post): open-xchange-appsuite-manifest

%description
SAML Login

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

%changelog
* Tue Sep 20 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-09-26 (3569)
* Thu Sep 01 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-09-07 (3527)
* Tue Aug 23 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-08-29 (3519)
* Fri Jul 22 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-08-01 (3464)
* Fri Jul 01 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-06-27 (3358)
* Wed Jun 01 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-06-06 (3317)
* Mon May 23 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-05-20 (3292)
* Fri Apr 29 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-05-09 (3270)
* Mon Apr 25 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-04-25 (3237)
* Fri Apr 08 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-04-11 (3213)
* Tue Mar 22 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-03-29 (3187)
* Tue Mar 08 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-03-14 (3147)
* Mon Feb 22 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-02-29 (3120)
* Mon Feb 01 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-02-08 (3072)
* Tue Jan 19 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-01-25 (3030)
* Mon Jan 04 2016 Marcus Klein <marcus.klein@open-xchange.com>
Build for patch 2016-01-13 (2972)
* Tue Dec 01 2015 Marcus Klein <marcus.klein@open-xchange.com>
Second release candidate for 7.6.3
* Tue Nov 17 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-11-23 (2882)
* Mon Nov 16 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-11-13 (2879)
* Wed Nov 11 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-11-16 (2862)
* Tue Nov 03 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-11-09 (2841)
* Thu Oct 29 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-11-11 (2844)
* Mon Oct 26 2015 Marcus Klein <marcus.klein@open-xchange.com>
First candidate for 7.6.3 release
* Wed Sep 30 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch  2015-10-12 (2784)
* Thu Sep 24 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-09-28 (2767)
* Tue Sep 08 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-09-14 (2732)
* Tue Aug 18 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-08-24 (2674)
* Thu Aug 06 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-08-17 (2666)
* Fri Jul 17 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-07-20 (2637)
* Wed Jun 24 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-06-26 (2573)
* Mon Mar 30 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Intitial release.
* Mon Mar 30 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Intitial release.
* Wed Mar 25 2015 Marcus Klein <marcus.klein@open-xchange.com>
prepare for 7.6.3 release
