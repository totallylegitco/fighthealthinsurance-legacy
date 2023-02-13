#!/bin/bash
set -ex
if [ ! -f "cert.pem" ]; then
  if ! command -v mkcert &> /dev/null; then
    apt-get install -y mkcert
  fi
  mkcert -cert-file cert.pem -key-file key.pem localhost 127.0.0.1
fi
OAUTHLIB_RELAX_TOKEN_SCOPE=1 python manage.py runserver_plus --cert-file cert.pem --key-file key.pem
