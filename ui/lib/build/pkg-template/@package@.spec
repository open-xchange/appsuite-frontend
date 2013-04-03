Name:           @package@
Version:        @version@
%define         ox_release 1
Release:        %{ox_release}
Group:          Applications/Productivity
Packager:       @maintainer@
License:        @licenseName@
Summary:        @description@
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
BuildRequires:  open-xchange-appsuite-dev

Requires:       open-xchange-appsuite-manifest

%description
@description@

%prep
%setup -q

%build

%install
sh /opt/open-xchange-appsuite-dev/bin/build-appsuite app \
    builddir="%{buildroot}/opt/open-xchange/appsuite"

%clean
sh /opt/open-xchange-appsuite-dev/bin/build-appsuite clean \
    builddir="%{buildroot}/opt/open-xchange/appsuite"

%files
%defattr(-,root,root)
%dir /opt/open-xchange
/opt/open-xchange/appsuite
