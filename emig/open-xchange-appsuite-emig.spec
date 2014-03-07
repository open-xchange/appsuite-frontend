Name:           open-xchange-appsuite-emig
Version:        7.4.2
%define         ox_release 1
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Packager:       Viktor Pracht <viktor.pracht@open-xchange.com>
License:        CC-BY-NC-SA-3.0
Summary:        Email made in Germany for OX App Suite
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root
BuildRequires:  open-xchange-appsuite-dev

Requires(post): open-xchange-appsuite-manifest

%description
Email made in Germany for OX App Suite

# Uncomment for multiple packages (1/4)
%if 0%{?rhel_version} || 0%{?fedora_version}
%define docroot /var/www/html/appsuite
%else
%define docroot /srv/www/htdocs/appsuite
%endif

%package        static
Group:          Applications/Productivity
Summary:        Email made in Germany for OX App Suite
Requires:       open-xchange-appsuite

%description    static
Email made in Germany for OX App Suite

This package contains the static files for the theme.

%prep
%setup -q

%build

%install
sh /opt/open-xchange-appsuite-dev/bin/build-appsuite app skipLess=1 \
    builddir="%{buildroot}/opt/open-xchange/appsuite"

# Uncomment for multiple packages (2/4)
files=$(find "%{buildroot}/opt/open-xchange/appsuite/" -type f \
             ! -regex '.*\.\(js\|css\|less\|json\)' -printf '%%P ')
for i in $files
do
    mkdir -p "%{buildroot}%{docroot}/$(dirname $i)"
    cp "%{buildroot}/opt/open-xchange/appsuite/$i" "%{buildroot}%{docroot}/$i" 
done

%clean
sh /opt/open-xchange-appsuite-dev/bin/build-appsuite clean skipLess=1 \
    builddir="%{buildroot}/opt/open-xchange/appsuite"

# Uncomment for multiple packages (3/4)
rm -r "%{buildroot}%{docroot}"

%define update /opt/open-xchange/appsuite/share/update-themes.sh

%post
if [ $1 -eq 1 -a -x %{update} ]; then %{update}; fi

%postun
if [ -x %{update} ]; then %{update}; fi

%files
%defattr(-,root,root)
%dir /opt/open-xchange
/opt/open-xchange/appsuite

# Uncomment for multiple packages (4/4)
%files static
%defattr(-,root,root)
%{docroot}
