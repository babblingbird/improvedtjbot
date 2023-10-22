#/bin/bash

echo installing node stuff

export NODE_MAJOR=16
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

echo "deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt update
sudo apt install nodejs
sudo apt install npm
npm install

echo installing python stuff

python -m venv venv
source venv/bin/activate
pip install adafruit-circuitpython-neopixel
pip install webcolors
pip install Adafruit-Blinka
pip install rpi-ws281x
