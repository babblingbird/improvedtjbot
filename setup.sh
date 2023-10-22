#/bin/bash

echo installing node stuff

NODE_MAJOR=16
echo "deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt update
sudo apt install nodejs
npm install

echo installing python stuff

python -m venv venv
source venv/bin/activate
pip install adafruit-circuitpython-neopixel
pip install webcolors
pip install Adafruit-Blinka
pip install rpi-ws281x
