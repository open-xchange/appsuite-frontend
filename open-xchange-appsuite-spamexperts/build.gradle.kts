packaging {
    copyright("core/ui")
}

install {
    target("pkg") {
        from("build/pkg")
        into(prefixResolve(""))
    }
}
