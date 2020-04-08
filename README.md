# OpenSlides authentication service

Service for OpenSlides which handles the authentication of users.

## Installation

You can setup the whole project simply by running `make build`.

## Production

For production purposes you can just run the command `make prod`. This will ensures, that a production image is built and then starts the built image in a docker-container.

Now the server runs and is accessible on port `8000`.

## Development

You can run just the command `make dev`.

This command will start the docker container and listen to changes in the `auth/src`-directory. Every time any file has changed, the container restarts and changes are applied immediately.

## Testing

If you want to run all tests, just run the command `make test`.
