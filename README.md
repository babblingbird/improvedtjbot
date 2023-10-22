# TJBot (Sonja edition)

**Table of contents**

1. Features
2. Differences with the original TJBot
2. Setup
    1. Network
    2. Connecting to TJBot
    3. Conversations
3. Known issues

## Features

## Differences with the original TJBot
- Conversational AI using (i) OpenAI instead of Watson's AI or (ii) a text-based file with responses.
- LED has a diode to reduce $V_{cc}$ voltage.
- Code has been cleaned up and pin numbers are changed.



## Setup
If you want to configure a new TJBot, you can use the `setup.sh` file in the repo. The following commands should be enough on a rpi with internet (see the following sections for connecting to internet):

```
git clone https://github.com/babblingbird/improvedtjbot
cd improvedtjbot
bash setup.sh
```

### Network
TJBot needs access to the internet for understanding and responding (STT and TTS systems), as well as for the conversations (GPT-3). There are a few options to give TJBot access, depending on what is most conventient.

1. **Ethernet**

    Connecting an ethernet cable to the bottom of TJBot should just work, if the network doesn't require mac authentication. 

2. **Wifi setup with screen, keyboard and mouse** (recommended)

    First, connect a screen to the HDMI port on the side and a keyboard and mouse to the USB ports on the bottom. Second, connect the power connection and let TJBot boot up. Third, connect to a wireless network (top left icon on the screen) and provide a password if needed. 

    After this, TJBot will remember the network and keyboard, mouse and screen are not needed anymore. 

    This can also be done to connect to a mobile hotspot, which can be handy when demonstrating TJBot on different locations.

3. **File-based setup**

    This approach requires an sd card reader. More info on this method can be found [here](https://raspberrypi.stackexchange.com/questions/10251/prepare-sd-card-for-wifi-on-headless-pi#57023).

### Connecting to TJBot
When using the TJBot without screen (headless mode), you can connect to it remotely using ssh. This way you can still edit the prompt and config files. 

### Conversations
1. Get an OpenAI key
2. Add the key to the file `.openai.env` in the folder `~/tjbot/conversations/`
3. If wanted, change the `tjbot.prompt` file to include the conversational responses you want. A simple prompt to control the TJBot is:

    ```
    You are a helpful robot called TJBot. You can lower and raise an arm. You get input from a STT system, so please do error correction. If you want to lower your arm, start your message by '%LOWER', if you want to raise it start with '%RAISE'. You can wave by starting with '%WAVE'.
    ```

    Do not change the `%RAISE`, `%WAVE` and `%LOWER` commands, since these are checked and performed by TJBOT.

## Known issues and fixes

1. **Speaker and/or microphone doesn't work**. 
  
    _Reason_: The Raspberry selects random id's for the audio devices on boot. These should have been hardcoded using the identifiers, but might not work with different devices (e.g. a different speaker). The names can be checked with `arecord --list` and `aplay --list`, but are hardcoded in the TJBot's source code.

    _Fix_: Reboot the Raspberry Pi. If this issue persists, check the id's using the above commands.

2. **I can't ssh to TJBot**.

    Check if the username (`tjbot`) and password (`root`) you provided is correct. You also need to enable SSH in the Raspberry Pi Settings. 
