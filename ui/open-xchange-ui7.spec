Name:           open-xchange-ui7
Version:        7.0.0
Release:        1
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       Viktor Pracht <viktor.pracht@open-xchange.com>
License:        CC-BY-NC-SA
Summary:        Open-Xchange HTML5 client
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
BuildRequires:  nodejs >= 0.4.0

%if 0%{?suse_version}
Requires:       apache2
%endif
%if 0%{?fedora_version} || 0%{?rhel_version}
Requires:       httpd
%endif

%if 0%{?rhel_version} || 0%{?fedora_version}
%define docroot /var/www/html/appsuite
%else
%define docroot /srv/www/htdocs/appsuite
%endif

%description
Open-Xchange HTML5 client

%package        apps
Group:          Applications/Productivity
Summary:        Default applications for the Open-Xchange HTML5 client
Requires:       open-xchange-ui7-backend

%description    apps
Default applications for the Open-Xchange HTML5 client

%prep
%setup -q

%build

%install
sh build.sh builddir="%{buildroot}%{docroot}" version=%{version} revision=%{release}
mkdir -p "%{buildroot}/opt/open-xchange/ui7"
cp -r "%{buildroot}%{docroot}/apps" "%{buildroot}/opt/open-xchange/ui7/apps"

%clean
sh build.sh clean builddir="%{buildroot}%{docroot}" version=%{version} revision=%{release}

%files
%defattr(-,root,root)
%{docroot}
%doc readme.txt

%files apps
%defattr(-,root,root)
%dir /opt/open-xchange
/opt/open-xchange/ui7

%changelog
* Thu Nov 10 2011 viktor.pracht@open-xchange.com
  - Initial release
