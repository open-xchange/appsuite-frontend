packaging {
    copyright("core/ui")
}

install {
    target("htdoc") {
        from("build/pkg/appsuite")
        into("${System.getenv("HTDOC") ?: "/htdoc"}/appsuite")
    }
}
