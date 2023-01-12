import setuptools


# see: https://stackoverflow.com/questions/16584552/how-to-state-in-requirements-txt-a-direct-github-source
# and: https://medium.com/@arocketman/creating-a-pip-package-on-a-private-repository-using-setuptools-fff608471e39

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="authlib",
    version="1.0.0",
    author="GabrielInTheWorld",
    author_email="meyergabriel@live.de",
    description="Package for OS4 to provide auth functionalities",
    long_description=long_description,
    url="https://github.com/OpenSlides/openslides-auth-service/auth/libraries/pip-auth",
    packages=setuptools.find_packages(),
    install_requires=[
        "pyjwt",
        "requests",
        "simplejson",
        "pytest",
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
