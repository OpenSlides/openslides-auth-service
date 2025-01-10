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
    mainClass.set("org.openslides.keycloak.addons.KeycloakConfigurator")
    environment("KEYCLOAK_URL", "https://localhost:8000/idp/")
    environment("KC_BOOTSTRAP_ADMIN_USERNAME", "admin")
    environment("KC_BOOTSTRAP_ADMIN_PASSWORD", "admin")
}

tasks.withType(JavaExec::class.java) {
    dependsOn("createTrustStore", "classes")
    classpath = sourceSets.main.get().runtimeClasspath

    systemProperty("javax.net.ssl.trustStore", layout.buildDirectory.file("proxy-truststore.jks").get().asFile.path)
    systemProperty("javax.net.ssl.trustStorePassword", "changeit")
}

tasks.register<JavaExec>("runFlowExport") {
    mainClass = "org.openslides.keycloak.addons.NestedAuthFlowCreator"

    environment("KEYCLOAK_URL", "https://localhost:8000/idp/")
    environment("KEYCLOAK_ADMIN", "admin")
    environment("KEYCLOAK_ADMIN_PASSWORD", "admin")
}