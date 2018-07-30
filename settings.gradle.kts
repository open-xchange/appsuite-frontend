rootProject.name = "frontend-core"

pluginManagement {
    repositories {
        maven {
            url = uri("https://artifactory.open-xchange.com/artifactory/libs-release")
        }
    }
}

include(
    "open-xchange-appsuite",
    "open-xchange-appsuite-manifest",
    "open-xchange-appsuite-l10n"

    //open-xchange-guidedtours
    //open-xchange-dynamic-theme
    //open-xchange-appsuite-spamexperts
)
