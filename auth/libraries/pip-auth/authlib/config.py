from authlib.dev.keys import key_dict

keys = {}


def is_dev_mode():
    return True


def get_public_token_key():
    return init_key("public_token_key", "rsa-token.key.pub")


def get_public_cookie_key():
    return init_key("public_cookie_key", "rsa-cookie.key.pub")


def get_private_token_key():
    return init_key("private_token_key", "rsa-token.key")


def get_private_cookie_key():
    return init_key("private_cookie_key", "rsa-cookie.key")


def init_key(name, path):
    global keys
    if name not in keys:
        keys[name] = get_file(path)
    return keys[name]


def get_file(name):
    if is_dev_mode():
        return key_dict[name]
    path = f"/tmp/keys/{name}"
    with open(path, "r") as file:
        return file.read()
