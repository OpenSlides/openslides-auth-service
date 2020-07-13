# Create rsa keys
mkdir /tmp/keys

ssh-keygen -f /tmp/keys/rsa-token.key -t rsa -b 2048 -P ""
ssh-keygen -f /tmp/keys/rsa-cookie.key -t rsa -b 2048 -P ""