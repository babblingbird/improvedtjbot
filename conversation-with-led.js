/* 
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import TJBot from 'tjbot';
import config from './config.js';
import { parse } from 'dotenv';
import { exec } from 'child_process';
import { readFile, readFileSync } from 'node:fs';

import { Configuration, OpenAIApi } from 'openai';

const prompt = readFileSync('tjbot.prompt', 'utf8');

const data = readFileSync('openai-credentials.env', 'utf8');
const openaiconfig = parse(data)

const configuration = new Configuration({
    apiKey: config.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

// these are the hardware capabilities that TJ needs for this recipe
const hardware = [TJBot.HARDWARE.MICROPHONE, TJBot.HARDWARE.SPEAKER];

if (config.hasCamera) {
    hardware.push(TJBot.HARDWARE.CAMERA);
}

// set up TJBot's configuration
const tjConfig = {
    robot: {
        name: 'TJBot',
        homophones: ['T J Bot'],
        gender: 'male'
    },
    verboseLogging: true,
    log: {
        level: 'silly', // change to 'verbose' or 'silly' for more detail about what TJBot is doing
    },
    listen: {
        language: 'en-GB',
        microphoneDeviceId: 'plughw:CARD=Device,DEV=0',
    },
    speak: {
        language: 'en-GB',
        //speakerDeviceId: 'plughw:2,0',	
        speakerDeviceId: 'plughw:CARD=UACDemoV10,DEV=0',
    },
    wave: {
        servoPin: 7, // default pin is GPIO 7 (physical pin 26)
    },
};

// uncomment to change the pin for the servo
// tjConfig.wave = {
//     servoPin: 7
// };

// instantiate our TJBot!
const tj = new TJBot(tjConfig);
tj.initialize(hardware);

tj.SERVO = {
    ARM_BACK: 2500,
    ARM_UP: 1700,
    ARM_DOWN: 500,
};

const USE_GPT = false;

console.log('You can ask me to introduce myself or tell you a joke.');
console.log(`Try saying, "${config.robotName}, please introduce yourself" or "${config.robotName}, what can you do?"`);
console.log(`You can also say, "${config.robotName}, tell me a joke!"`);
console.log("Say 'stop' or press ctrl-c to exit this recipe.");

while (true) {
    const msg = await tj.listen();

    if (USE_GPT) {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ "role": "system", "content": prompt }, { role: "user", content: msg }],
        });

    } else {

        readFile('./responses.json', 'utf8', (err, data) => {
            if (err) {
                console.log(`Error reading file from disk: ${err}`)
            } else {
                // parse JSON string to JSON object
                const responses = JSON.parse(data)
                if (msg in responses) {
                    tj.speak(responses[msg].response);
                    if ("color" in responses[msg]) {
                        exec('sudo python control_neopixel.py ' + responses[msg].color);
                    }
                } else {
                    tj.speak("I didn't understand you, could you try again?")
                }
            }
        });
    }
    if (msg === 'stop') {
        console.log('Goodbye!');
        process.exit(0);
    }
}