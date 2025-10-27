#/bin/bash

printf "Autoflake:\n"
autoflake osauthlib/ tests/
printf "Black:\n"
black osauthlib/ tests/
printf "Isort:\n"
isort osauthlib/ tests/
printf "Flake8:\n"
flake8 osauthlib/ tests/
printf "Mypy:\n"
mypy osauthlib/ tests/
