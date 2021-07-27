#!/bin/sh

TIMEOUT=1
HOST=""
PORT=""

while [ "$1" != "" ]; do
    PARAM=`echo $1 | awk -F= '{print $1}'`
    VALUE=`echo $1 | awk -F= '{print $2}'`
    case $PARAM in
        *:* )
            HOST=${PARAM%:*}
            PORT=${PARAM#*:}
            ;;
        -t | --timeout)
            if [ "$VALUE" -gt 0 ]; then
                TIMEOUT=$VALUE
            fi
            ;;
    esac
    shift
done

while ! nc -z "$HOST" "$PORT"; do
    echo "waiting for $HOST:$PORT for $TIMEOUT seconds..."
    sleep $TIMEOUT
done

echo "$HOST:$PORT is available"