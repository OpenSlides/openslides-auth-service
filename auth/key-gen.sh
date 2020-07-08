rm -rfv ./src/config/keys/
mkdir -p ./src/config/keys
chown newuser ./src/config/keys

# Create rsa keys
ssh-keygen -f ./src/config/keys/rsa-token.key -t rsa -b 2048 -P ""
ssh-keygen -f ./src/config/keys/rsa-cookie.key -t rsa -b 2048 -P ""