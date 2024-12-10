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
        implementation("com.fasterxml.jackson.dataformat:jackson-dataformat-yaml")
        implementation("com.nimbusds:nimbus-jose-jwt:9.47")

        implementation("org.slf4j:slf4j-api:1.7.32")
        testImplementation("org.junit.jupiter:junit-jupiter:5.7.0")

        testImplementation("org.testcontainers:junit-jupiter:$versionTestContainers")
//    testImplementation("org.testcontainers:keycloak:$versionTestContainers")
        testImplementation("org.keycloak:keycloak-admin-client:$versionKeycloak")
        testImplementation("ch.qos.logback:logback-classic:1.2.11")
        // assertj
        testImplementation("org.assertj:assertj-core:3.26.3")
        testImplementation("org.wiremock:wiremock:3.9.2")
        testImplementation ("com.microsoft.playwright:playwright:1.48.0")
        testImplementation("org.mockito:mockito-core:5.14.2")
        testImplementation("org.keycloak:keycloak-admin-client:$versionKeycloak")
        testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
    }

    if (project.name != "openslides-addon-common") {
        dependencies {
            implementation(project(":openslides-addon-common"))
            testImplementation(project(path = ":openslides-addon-common", configuration = "tests"))
        }
    }

    tasks.withType<Test> {
        useJUnitPlatform()
    }
}
