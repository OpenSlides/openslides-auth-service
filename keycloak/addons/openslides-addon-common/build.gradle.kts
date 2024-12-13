plugins {
    id("application")
}

dependencies {
    implementation("org.apache.commons:commons-lang3:3.17.0")
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

application {
    mainClass.set("org.openslides.keycloak.addons.KeycloakConfigurator")
}

tasks.named<JavaExec>("run") {
    dependsOn("createTrustStore")
    systemProperty("javax.net.ssl.trustStore", layout.buildDirectory.file("proxy-truststore.jks").get().asFile.path)
    systemProperty("javax.net.ssl.trustStorePassword", "changeit")

    environment("KEYCLOAK_URL", "https://localhost:8000/idp/")
    environment("KEYCLOAK_ADMIN", "admin")
    environment("KEYCLOAK_ADMIN_PASSWORD", "admin")
}