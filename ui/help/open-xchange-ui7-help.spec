Name:           open-xchange-ui7-help
Version:        7.0.0
%define         ox_release 8
Release:        %{ox_release}
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Viktor Pracht <viktor.pracht@open-xchange.com>
License:        CC-BY-NC-SA
Summary:        Online help for OX App Suite
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root

%if 0%{?rhel_version} || 0%{?fedora_version}
%define docroot /var/www/html/appsuite
%else
%define docroot /srv/www/htdocs/appsuite
%endif

%description
Online help for OX App Suite

%package        en-us
Group:          Applications/Productivity
Summary:        en_US online help for OX App Suite
Provides:       open-xchange-ui7-help

%description    en-us
en_US online help for OX App Suite

%package        de-de
Group:          Applications/Productivity
Summary:        de_DE online help for OX App Suite
Provides:       open-xchange-ui7-help

%description    de-de
de_DE online help for OX App Suite

%prep
%setup -q

%build

%install
mkdir -p "%{buildroot}%{docroot}/help"
cp -r en_US de_DE "%{buildroot}%{docroot}/help"

%clean
rm -r "%{buildroot}%{docroot}"

%files en-us
%defattr(-,root,root)
%dir %{docroot}/help/en_US
%{docroot}/help/en_US

%files de-de
%defattr(-,root,root)
%dir %{docroot}/help/de_DE
%{docroot}/help/de_DE
