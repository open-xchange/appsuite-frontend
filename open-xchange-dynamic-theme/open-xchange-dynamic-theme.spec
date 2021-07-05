Name:           open-xchange-dynamic-theme
Version:        @OXVERSION@
%define         ox_release @OXREVISION@
Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Packager:       Viktor Pracht <viktor.pracht@open-xchange.com>
License:        AGPL-3.0-only
Summary:        Dynamic theme with colors read from ConfigCascade
Source:         %{name}_%{version}.orig.tar.bz2

BuildArch:      noarch
BuildRoot:      %{_tmppath}/%{name}-%{version}-root

Requires(post): open-xchange-appsuite-manifest
Requires:       nodejs >= 0.10

%description
Dynamic theme with colors read from ConfigCascade

%define docroot /var/www/html/

%prep
%setup -q

%build

%install
cp -rv --preserve=mode * %{buildroot}

%clean
%{__rm} -rf %{buildroot}

%define update /opt/open-xchange/appsuite/share/update-themes.sh

%post
if [ $1 -eq 1 -a -x %{update} ]; then %{update} --later; fi
. /opt/open-xchange/lib/oxfunctions.sh
if [ ${1:-0} -eq 2 ]; then
    # only when updating

    # prevent bash from expanding, see bug 13316
    GLOBIGNORE='*'

    SCR=SCR-606
    if ox_scr_todo ${SCR}
    then
        pfile=/opt/open-xchange/etc/settings/open-xchange-dynamic-theme.properties
        VALUE=$(ox_read_property io.ox/dynamic-theme//logoWidth $pfile)
        if [ "auto" = "${VALUE//[[:space:]]/}" ]
        then
            cat <<EOF | (cd /opt/open-xchange/etc/settings && patch --strip=1 --forward --no-backup-if-mismatch --reject-file=- --fuzz=3 >/dev/null)
diff --git a/open-xchange-dynamic-theme.properties b/open-xchange-dynamic-theme.properties
index b8c0130..3ae4d73 100644
--- a/open-xchange-dynamic-theme.properties
+++ b/open-xchange-dynamic-theme.properties
@@ -25,15 +25,17 @@ io.ox/dynamic-theme//headerLogo=
 # URL of the logo in the top left corner of the top bar.
 io.ox/dynamic-theme//logoURL=

-# Optional width of the logo as number of pixels or any CSS length unit.
+# Width of the logo as number of pixels or any CSS length unit.
 # For best display on high-resolution screens, it is recommended to use
 # a bigger image and specify a smaller size here.
-# Default: auto
-io.ox/dynamic-theme//logoWidth=auto
+# Set to "auto" to use the native width of the image.
+# Default: 60
+io.ox/dynamic-theme//logoWidth=60

 # Optional height of the logo as number of pixels or any CSS length unit.
 # The maximum value is 64. For best display on high-resolution screens,
 # it is recommended to use a bigger image and specify a smaller size here.
+# Set to "auto" to use the native height of the image.
 # Default: auto
 io.ox/dynamic-theme//logoHeight=auto
EOF
        ox_set_property io.ox/dynamic-theme//logoWidth 60 $pfile
        fi
        ox_scr_done ${SCR}
    fi

    # OXUIB-98
    if contains "[“”]" /opt/open-xchange/etc/settings/open-xchange-dynamic-theme.properties; then
        sed -i 's/[“”]/"/g' /opt/open-xchange/etc/settings/open-xchange-dynamic-theme.properties
    fi
fi

%postun
if [ -x %{update} ]; then %{update} --later; fi

%files
%defattr(-,root,root)
%dir /opt/open-xchange
/opt/open-xchange/appsuite
/opt/open-xchange/dynamic-theme
%config(noreplace) /opt/open-xchange/etc/settings/open-xchange-dynamic-theme.properties

@OXCHANGELOG@
