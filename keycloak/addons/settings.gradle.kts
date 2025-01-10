rootProject.name = "openslides-keycloak-addons"

include("openslides-addon-common")
include("openslides-authenticator", "openslides-email-template-provider")

project(":openslides-addon-common").projectDir = file("openslides-addon-common")
project(":openslides-authenticator").projectDir = file("openslides-authenticator")
project(":openslides-email-template-provider").projectDir = file("openslides-email-template-provider")
