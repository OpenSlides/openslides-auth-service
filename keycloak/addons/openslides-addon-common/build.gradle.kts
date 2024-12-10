plugins {
    id("java")
}

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(platform("org.junit:junit-bom:5.10.0"))
    testImplementation("org.junit.jupiter:junit-jupiter")
}

tasks.test {
    useJUnitPlatform()
}

tasks.register<Jar>("testSourcesJar") {
    from(sourceSets["test"].allSource)
    archiveClassifier.set("test-sources")
}

tasks.named("testSourcesJar").configure {
    dependsOn(tasks.named("testClasses"))
}

// add configuration for testArtifacts
configurations.create("tests") {
    extendsFrom(configurations.testImplementation.get())
}

artifacts {
    add("tests", tasks.named("testSourcesJar"))
}