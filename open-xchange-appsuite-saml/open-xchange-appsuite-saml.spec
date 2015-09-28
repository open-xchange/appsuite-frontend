Name:           open-xchange-appsuite-saml
Version:        @OXVERSION@
%define         ox_release 3
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
* Thu Sep 24 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-09-28 (2767)
* Tue Sep 08 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-09-14 (2732)
* Tue Aug 18 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Build for patch 2015-08-24 (2674)
* Mon Mar 30 2015 Francisco Laguna <francisco.laguna@open-xchange.com>
Intitial release.
