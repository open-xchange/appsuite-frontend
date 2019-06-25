packaging {
    copyright("core/ui")
}

install {
    target("pkg") {
        from("build/pkg/sbin")
        into(prefixResolve("sbin/"))
    }
    target("htdoc") {
        from("build/pkg/appsuite")
        into("${System.getenv("HTDOC") ?: "/htdoc"}/appsuite")
    }
}
