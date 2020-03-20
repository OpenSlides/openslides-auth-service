# OpenSlides authentication service

Service for OpenSlides which handles the authentication of users.

## Installation

You can setup the whole project simply by running `make build`.

## Development

If you've already run `make build` then you can run the command `make run`.

This command will start the docker container and listen to changes in the `./src`-directory. Every time any file has changed, the container restarts and changes are applied immediately.
