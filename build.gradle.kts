buildscript {
    repositories {
        maven {
            url = uri("https://artifactory.open-xchange.com/artifactory/libs-release")
        }
    }
    dependencies {
        classpath("com.openexchange.build", "packaging", "3.1.0")
        classpath("com.openexchange.build", "opensuse-build-service-client", "1.4.0")
    }
}

apply {
    // TODO required by the packaging plugin on the subproject
    plugin("com.openexchange.build.install")
    plugin("com.openexchange.build.gradle-git")
    plugin("com.openexchange.opensuse-build-service-client")
}

subprojects {
    apply {
        plugin("com.openexchange.build.install")
        plugin("com.openexchange.build.packaging")
    }
}

configure<com.openexchange.obs.gradle.plugin.BuildserviceExtension> {
    url = "https://buildapi.open-xchange.com"
    login  = System.getenv("OBS_USERNAME")
    password = System.getenv("OBS_PASSWORD")
    project(closureOf<com.openexchange.obs.gradle.plugin.Project> {
        name = System.getenv("OBS_PROJECT")
        this.repositories(closureOf<NamedDomainObjectContainer<com.openexchange.obs.gradle.plugin.Repository>> {
            create("DebianStretch") {
                depends(kotlin.collections.mapOf("project" to "Debian:Stretch", "repository" to "standard"))
            }
            create("RHEL6") {
                // TODO go down to the base RHEL 6 repository
                depends(kotlin.collections.mapOf("project" to "backend-master", "repository" to "RHEL6"))
            }
            create("RHEL7") {
                // TODO go down to the base RHEL 7 repository
                depends(kotlin.collections.mapOf("project" to "backend-master", "repository" to "RHEL7"))
            }
            create("SLE_12") {
                // TODO go to SP4
                depends(kotlin.collections.mapOf("project" to "backend-master", "repository" to "SLE_12"))
            }
        })
    })
}

configure<com.openexchange.build.install.extension.InstallExtension> {
    prefix.set(file("/opt/open-xchange"))
}
