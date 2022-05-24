import com.openexchange.build.git.GitExtension
import com.openexchange.build.git.GitExtension.NewestVersionTagResult.Success

plugins {
    id("com.openexchange.build.gradle-git") version "3.9.0"
    id("com.openexchange.build.licensing") version "1.0.5"
    id("com.openexchange.build.install") version "3.7.2"
    id("com.openexchange.build.opensuse-build-service-client") version "1.9.1"
    id("com.openexchange.build.packaging") version "5.7.2" apply false
}

subprojects {
    apply {
        plugin("com.openexchange.build.install")
        plugin("com.openexchange.build.packaging")
    }
}

licensing {
    licenses {
        register("core/ui") {
            sourceFile = file("debian/copyright")
        }
    }
}

val backendBranch = "release-7.10.6"

buildservice {
    url = "https://buildapi.open-xchange.com"
    login  = System.getenv("OBS_USERNAME")
    password = System.getenv("OBS_PASSWORD")
    obsProject {
        val gitExtension = extensions.getByType(GitExtension::class.java)
        val versionTag = gitExtension.newestVersionTag
        val branch = gitExtension.branchName
        val regex = Regex("[^A-Za-z0-9-_]")
        val extension = when {
            versionTag is Success && versionTag.versionTag.commitDistance == 0L -> "${versionTag.versionTag.versionWithoutRevision}-rev${versionTag.versionTag.revisionMajor}"
            branch.startsWith("master") or branch.startsWith("release") -> branch
            System.getenv("OBS_PROJECT_EXT") != null -> System.getenv("OBS_PROJECT_EXT")
            else -> regex.replace(branch, "_")
        }
        name = "frontend-$extension"
        repositories {
            create("DebianStretch") {
                depends("Debian:Stretch", "standard")
            }
            create("DebianBuster") {
                depends("Debian:Buster", "standard")
            }
            create("DebianBullseye") {
                depends("Debian:Bullseye", "standard")
            }
            create("RHEL7") {
                // TODO go down to the base RHEL 7 repository
                depends("backend-${backendBranch}", "RHEL7")
            }
        }
        prjconf.set("OX-Sign-ID: release-team@open-xchange.com")
    }
}

install {
    prefix.set(file("/opt/open-xchange"))
}
