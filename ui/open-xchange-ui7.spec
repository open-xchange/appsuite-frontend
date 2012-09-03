Name: open-xchange-ui7
Version: 7.0.0
Release: 1
Group: Applications/Productivity
Vendor: Open-Xchange
URL: http://open-xchange.com
Packager: Viktor Pracht <viktor.pracht@open-xchange.com>
License: CC-BY-NC-SA
Summary: Open-Xchange HTML5 client
Source: %{name}_%{version}.orig.tar.bz2

BuildArch: noarch
BuildRoot: %{_tmppath}/%{name}-%{version}-root
BuildRequires: nodejs >= 0.4.0

%if 0%{?suse_version}
Requires:   apache2
%endif
%if 0%{?fedora_version} || 0%{?rhel_version}
Requires:   httpd
%endif

%if 0%{?rhel_version} || 0%{?fedora_version}
%define docroot /var/www/html/ox7
%else
%define docroot /srv/www/htdocs/ox7
%endif

%description
Open-Xchange HTML5 client

%prep
%setup -q

%build

%install
sh build.sh builddir="%{buildroot}%{docroot}" version=%{version} revision=%{release}

%clean
sh build.sh clean builddir="%{buildroot}%{docroot}" version=%{version} revision=%{release}

%files
%defattr(-,root,root)
%{docroot}
%doc readme.txt

%changelog
* Thu Nov 10 2011 viktor.pracht@open-xchange.com
  - Initial release
