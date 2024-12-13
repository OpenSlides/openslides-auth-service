plugins {
    id("java")
    id("maven-publish")
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

val versionKeycloak = "26.0.2"
val versionTestContainers = "1.20.3"

group = "org.openslides.keycloak.addons"
version = "1.0.0"

repositories {
    mavenCentral()
}

subprojects {
    apply(plugin = "java")
    apply(plugin = "maven-publish")
    apply(plugin = "com.github.johnrengelman.shadow")

    repositories {
        mavenCentral()
    }

    java {
        toolchain {
            languageVersion.set(JavaLanguageVersion.of(17))
        }
    }

    dependencies {
        implementation("org.keycloak:keycloak-server-spi:$versionKeycloak")
        implementation("org.keycloak:keycloak-services:$versionKeycloak")
        implementation("org.keycloak:keycloak-server-spi-private:$versionKeycloak")
        implementation("org.keycloak:keycloak-admin-client:$versionKeycloak")
        implementation("com.fasterxml.jackson.dataformat:jackson-dataformat-yaml")
        implementation("com.nimbusds:nimbus-jose-jwt:9.47")

        implementation("org.slf4j:slf4j-api:1.7.32")

        testImplementation("org.testcontainers:junit-jupiter:$versionTestContainers")
        testImplementation("ch.qos.logback:logback-classic:1.2.11")
        testImplementation("org.assertj:assertj-core:3.26.3")
        testImplementation("org.wiremock:wiremock:3.9.2")
        testImplementation ("com.microsoft.playwright:playwright:1.48.0")
        testImplementation("org.mockito:mockito-core:5.14.2")
        testImplementation("org.keycloak:keycloak-admin-client:$versionKeycloak")
        testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
    }

    val trustStorePassword = "changeit"

    tasks.register("createTrustStore") {
        val trustStorePath = layout.buildDirectory.file("proxy-truststore.jks").get().asFile.path
        val certFile = rootProject.projectDir.resolve("../../../openslides-proxy/certs/cert.pem").absolutePath
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


    if (project.name != "openslides-addon-common") {
        dependencies {
            implementation(project(":openslides-addon-common"))
            testImplementation(project(path = ":openslides-addon-common", configuration = "tests"))
        }

        tasks {
            jar {
                archiveBaseName.set(project.name)
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
                val dockerConfigDir = rootProject.projectDir.resolve("../../../dev/docker")
                systemProperty("keycloak.init.script", dockerConfigDir.resolve("configure_keycloak.py").absolutePath);
                systemProperty("docker-compose.configfile", dockerConfigDir.resolve("docker-compose.dev.yml").absolutePath);
                systemProperty("org.slf4j.simpleLogger.defaultLogLevel", "info")
                systemProperty("javax.net.ssl.trustStore", layout.buildDirectory.file("proxy-truststore.jks").get().asFile.path)
                systemProperty("javax.net.ssl.trustStorePassword", trustStorePassword)
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

//        tasks.withType(Test::class.java) {
//            javaLauncher.set(javaToolchains.launcherFor {
//                languageVersion.set(JavaLanguageVersion.of(21))
//            })
//        }


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

    }

    tasks.withType<Test> {
        useJUnitPlatform()
    }

}
