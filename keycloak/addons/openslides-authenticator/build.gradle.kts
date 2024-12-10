import java.nio.file.Files

plugins {
    id("java")
    id("maven-publish")
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

dependencies {
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}

val trustStorePassword = "changeit"

tasks {
    jar {
        archiveBaseName.set("openslides-authenticator")
        manifest {
            attributes["Implementation-Title"] = "OpenSlides Email Template Provider"
            attributes["Implementation-Version"] = version
        }

        from(sourceSets.main.get().output)
    }

    test {
        dependsOn("shadowJar", "createTrustStore")
        useJUnitPlatform()
        // set env variable with path to built addon
        systemProperty("keycloak.addon.path", jar.get().archiveFile.get().asFile.absolutePath)
        val dockerConfigDir = project.projectDir.resolve("../../../docker")
        systemProperty("keycloak.init.script", dockerConfigDir.resolve("configure_keycloak.py").absolutePath);
        systemProperty("docker-compose.configfile", dockerConfigDir.resolve("docker-compose.dev.yml").absolutePath);
        systemProperty("org.slf4j.simpleLogger.defaultLogLevel", "info")
        systemProperty("javax.net.ssl.trustStore", layout.buildDirectory.file("proxy-truststore.jks").get().asFile.path)
        systemProperty("javax.net.ssl.trustStorePassword", trustStorePassword)
        // systemProperty("javax.net.debug", "all")
    }
}

tasks {
    withType<com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar> {
        archiveClassifier.set("")
        dependencies {
            include(dependency("com.nimbusds:nimbus-jose-jwt"))
        }
    }

    build {
        dependsOn(shadowJar)
    }
}

tasks.withType(Test::class.java) {
    javaLauncher.set(javaToolchains.launcherFor {
        languageVersion.set(JavaLanguageVersion.of(21))
    })
}


// Publishing the JAR for easier deployment
publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
        }
    }
}

// Task to copy the built JAR into Keycloak's providers directory for testing
tasks.register<Copy>("copyToKeycloak") {
    val keycloakHome = System.getenv("KEYCLOAK_HOME") ?: "/opt/keycloak" // Change as necessary
    val deployDir = file("$keycloakHome/providers")
    from(tasks.jar)
    into(deployDir)
}


val createTrustStore = tasks.register("createTrustStore") {
    val trustStorePath = layout.buildDirectory.file("proxy-truststore.jks").get().asFile.path
    val certFile = project.projectDir.resolve("../../../../openslides-proxy/certs/cert.pem").absolutePath
    val alias = "proxy"

    // Run the keytool command to import the certificate
    doLast {
        val trustStoreFile = file(trustStorePath)
        if (!trustStoreFile.exists()) {
            println("Creating TrustStore at $trustStorePath")
            exec {
                commandLine("keytool", "-importcert",
                    "-alias", alias,
                    "-file", certFile,
                    "-keystore", trustStorePath,
                    "-storepass", trustStorePassword,
                    "-noprompt"
                )
            }
            println("TrustStore created at $trustStorePath with certificate alias '$alias'")
        } else {
            println("TrustStore already exists at $trustStorePath")
        }
    }
}
