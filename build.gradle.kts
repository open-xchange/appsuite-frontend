import com.openexchange.build.git.GitExtension
import kotlin.collections.mapOf as kmapOf

buildscript {
    repositories {
        maven {
            url = uri("https://artifactory.open-xchange.com/artifactory/libs-release")
        }
    }
    dependencies {
        classpath("com.openexchange.build", "project-type-scanner", "1.2.1")
        classpath("com.openexchange.build", "gradle-git", "2.2.0")
        classpath("com.openexchange.build", "licensing")
        classpath("com.openexchange.build", "packaging", "3.1.0")
        classpath("com.openexchange.build", "opensuse-build-service-client", "1.4.0")
    }
}

apply {
    plugin("com.openexchange.build.licensing")
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

configure<com.openexchange.build.licensing.LicensingExtension> {
    licenses {
        register("core/ui") {
            this.sourceFile = File(project.projectDir, "LICENSE")
        }
    }
}

configure<com.openexchange.obs.gradle.plugin.BuildserviceExtension> {
    url = "https://buildapi.open-xchange.com"
    login  = System.getenv("OBS_USERNAME")
    password = System.getenv("OBS_PASSWORD")
    project(closureOf<com.openexchange.obs.gradle.plugin.Project> {
        val gitExtension = extensions.getByType(GitExtension::class.java)
        val versionTag = gitExtension.newestVersionTag
        val regex = Regex("[^A-Za-z0-9-_]")
        val extension = when {
            versionTag?.commitDistance == 0L -> "${versionTag.versionWithoutRevision}-rev${versionTag.revisionMajor}"
            System.getenv("CI_COMMIT_REF_SLUG") != null -> System.getenv("CI_COMMIT_REF_SLUG")
            else -> regex.replace(gitExtension.branchName, "_")
        }
        name = "frontend-$extension"
        this.repositories(closureOf<NamedDomainObjectContainer<com.openexchange.obs.gradle.plugin.Repository>> {
            create("DebianStretch") {
                depends(kmapOf("project" to "Debian:Stretch", "repository" to "standard"))
            }
            create("DebianBuster") {
                depends(kmapOf("project" to "Debian:Buster", "repository" to "standard"))
            }
            create("RHEL6") {
                // TODO go down to the base RHEL 6 repository
                depends(kmapOf("project" to "backend-master", "repository" to "RHEL6"))
            }
            create("RHEL7") {
                // TODO go down to the base RHEL 7 repository
                depends(kmapOf("project" to "backend-master", "repository" to "RHEL7"))
            }
            create("SLE_12") {
                // TODO go to SP4
                depends(kmapOf("project" to "backend-master", "repository" to "SLE_12"))
            }
        })
    })
}

configure<com.openexchange.build.install.extension.InstallExtension> {
    prefix.set(file("/opt/open-xchange"))
}
