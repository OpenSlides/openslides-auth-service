# DRAFT OpenSlides authentication with SAML

outline of a possible SAML Auth implementation.

Whether SAML is used should be stored in the admin configuration. The necessary data such as certificate, url or attribute mapping should also be stored there.

Procedure:
- In the frontend (login form) there is a button to start the SAML authentication process. (Method `send` in `SamlController`).

- The user authenticates himself at the respective IDP and is returned to the Auth-Service, including defined attributes. (Method `acs` in `SamlController`).

- Via a way to be defined (DatastoreReader?) it is checked if the user already exists in the internal DB based on the username.

- If the user does not exist, a new user must be created via a path to be defined (DatastoreWriter?). Initial data like username, email, groups, etc. are supplied by the IDP.

- If the user is ready, defined attributes should be matched or overwritten in OpenSlides. Here the IDP is the leading system for information like the user's email.

- Session for the user is created - forwarding to the application.

