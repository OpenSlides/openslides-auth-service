plugins {
    id("application")
    id("org.springframework.boot") version "3.4.1"
}

dependencies {
    implementation("org.apache.commons:commons-lang3:3.17.0")
    implementation("org.apache.httpcomponents.client5:httpclient5:5.4.1")
}

tasks.register<Jar>("testClassesJar") {
    archiveClassifier.set("tests")
    from(sourceSets["test"].output)
}

configurations.create("tests") {
    extendsFrom(configurations.testImplementation.get())
}

artifacts {
    add("tests", tasks.named("testClassesJar"))
}

tasks {
    bootJar {
        mainClass.set("org.openslides.keycloak.addons.KeycloakConfigurator")
        archiveClassifier.set("app")
    }
    jar {
        enabled = true
    }
}

tasks.named<JavaExec>("run") {
    dependsOn("createTrustStore")
    systemProperty("javax.net.ssl.trustStore", layout.buildDirectory.file("proxy-truststore.jks").get().asFile.path)
    systemProperty("javax.net.ssl.trustStorePassword", "changeit")

    environment("KEYCLOAK_URL", "https://localhost:8000/idp/")
    environment("KEYCLOAK_ADMIN", "admin")
    environment("KEYCLOAK_ADMIN_PASSWORD", "admin")
}

tasks.register<JavaExec>("runFlowExport") {
    mainClass = "org.openslides.keycloak.addons.NestedAuthFlowCreator"
    classpath = sourceSets.main.get().runtimeClasspath
    dependsOn("createTrustStore", "classes")
    systemProperty("javax.net.ssl.trustStore", layout.buildDirectory.file("proxy-truststore.jks").get().asFile.path)
    systemProperty("javax.net.ssl.trustStorePassword", "changeit")

    environment("KEYCLOAK_URL", "https://localhost:8000/idp/")
    environment("KEYCLOAK_ADMIN", "admin")
    environment("KEYCLOAK_ADMIN_PASSWORD", "admin")
}