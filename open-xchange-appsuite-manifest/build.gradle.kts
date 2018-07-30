install {
    target("pkg") {
        from("build/pkg")
        into(prefixResolve(""))
    }
}
