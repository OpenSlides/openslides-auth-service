#/bin/bash

printf "Autoflake:\n"
autoflake authlib/ tests/
printf "Black:\n"
black authlib/ tests/
printf "Isort:\n"
isort authlib/ tests/
printf "Flake8:\n"
flake8 authlib/ tests/
printf "Mypy:\n"
mypy authlib/ tests/
