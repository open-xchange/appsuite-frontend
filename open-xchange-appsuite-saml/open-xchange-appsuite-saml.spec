Name:           open-xchange-appsuite-saml
Version:        @OXVERSION@
%define         ox_release 2
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
* Mon Nov 23 2015 Marcus Klein <marcus.klein@open-xchange.com>
Second release candidate for 7.6.3
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
