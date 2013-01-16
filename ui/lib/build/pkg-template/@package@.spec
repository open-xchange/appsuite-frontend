Name:           @package@
Version:        @version@
Release:        1
Group:          Applications/Productivity
Packager:       @maintainer@
License:        @licenseName@
Summary:        @description@
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
BuildRequires:  open-xchange-appsuite-devel

Requires:       open-xchange-appsuite-manifest

%description
@description@

%prep
%setup -q

%build

%install
sh /opt/open-xchange-appsuite-devel/bin/build-appsuite app \
    builddir="%{buildroot}/opt/open-xchange/appsuite" \
    version=%{version} revision=%{release}

%clean
sh /opt/open-xchange-appsuite-devel/bin/build-appsuite clean \
    builddir="%{buildroot}/opt/open-xchange/appsuite" \
    version=%{version} revision=%{release}

%files
%defattr(-,root,root)
%dir /opt/open-xchange
/opt/open-xchange/appsuite
