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
import 'dotenv/config.js'
import { exec } from 'child_process';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

// these are the hardware capabilities that TJ needs for this recipe
const hardware = [TJBot.HARDWARE.MICROPHONE, TJBot.HARDWARE.SPEAKER, TJBot.HARDWARE.SERVO];
if (config.hasCamera) {
    hardware.push(TJBot.HARDWARE.CAMERA);
}

// set up TJBot's configuration
const tjConfig = {
    robot: { name: 'Pieter',
	     homophones: ['Peter'],
	     gender: 'male'
	},
    verboseLogging: true,
    log: {
        level: 'silly', // change to 'verbose' or 'silly' for more detail about what TJBot is doing
    },

   listen: {
    microphoneDeviceId: 'plughw:CARD=Device,DEV=0',
},
    speak: {
    	language: 'en-US',
	    //speakerDeviceId: 'plughw:2,0',	
	    speakerDeviceId: 'plughw:CARD=UACDemoV10,DEV=0',	
    }
};

// uncomment to change the pins for the LED
tjConfig.shine = {
     neopixel: {
         gpioPin: 21
     },
//     commonAnode: {
//         redPin: 19,
//         greenPin: 13,
//         bluePin: 12
//     }
 };

// uncomment to change the pin for the servo
// tjConfig.wave = {
//     servoPin: 7
// };

// instantiate our TJBot!
const tj = new TJBot(tjConfig);
tj.initialize(hardware);

console.log('You can ask me to introduce myself or tell you a joke.');
console.log(`Try saying, "${config.robotName}, please introduce yourself" or "${config.robotName}, what can you do?"`);
console.log(`You can also say, "${config.robotName}, tell me a joke!"`);
console.log("Say 'stop' or press ctrl-c to exit this recipe.");

// listen for utterances with our attentionWord and send the result to
// the Assistant service
//tj.speak('I am Pieter. My favorite color is blue. I am 30 days old. I wish T J Bot had better documentation.');
exec('sudo python /home/plaughed/improvedtjbot/control_neopixel.py ' + 'purple');

tj.speak('Sonja is amazing');
tj.wave();

while (true) {
    const msg = await tj.listen();

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{"role": "system", "content": "You are a helpful robot called Pieter. You can lower and raise an arm. You get input from a STT system, so please do error correction. If you want to lower your arm, start your message by '%LOWER', if you want to raise it start with '%RAISE'. You can wave by starting with '%WAVE'."}, {role: "user", content: msg}],
      });

      tj.speak( completion.data.choices[0].message['content'].replace("%LOWER", "").replace("%RAISE", "").replace("%WAVE", "") );

      
    if (msg === 'stop') {
        console.log('Goodbye!');
        process.exit(0);
    }

    if (completion.data.choices[0].message['content'].includes('%LOWER')) {
	    tj.lowerArm();
    }
    else if (completion.data.choices[0].message['content'].includes('%RAISE')) {
        tj.raiseArm();
    }
    else if (completion.data.choices[0].message['content'].includes('%WAVE')) {
        tj.wave();
    }
   

   if (msg ==='what can I call you') {
	tj.speak('My name is Pieter');
   }

   if (msg === 'what can you do') {
	tj.speak('I can wave to you and I can talk to you.');
   }

   if (msg === 'what is your favorite color') {
	tj.speak('My favorite color is blue');
   }

  if (msg === 'are you hungry') {
	tj.speak('I would not mind eating a snack');
  }
    // check to see if they are talking to TJBot
    if (msg.toLowerCase().startsWith(config.robotName.toLowerCase())) {
        // remove our name from the message
        const utterance = msg.toLowerCase().replace(config.robotName.toLowerCase(), '').substr(1);
        // const utterance = msg.toLowerCase();

        // send to the assistant service
        const response = await tj.converse(utterance);
        let spoken = false;

        // check if an intent to control the bot was found
        if (response.object.intents !== undefined) {
            console.log(`found intent(s): ${JSON.stringify(response.object.intents)}`);

            // choose the most confident intent
            const intent = response.object.intents.reduce((max, i) => {
                return (i.confidence > max.confidence) ? i : max;
            }, {intent: '', confidence: 0.0});

            console.log(`selecting intent with maximum confidence: ${JSON.stringify(intent)}`);
            switch (intent.intent) {
            case 'lower-arm':
                await tj.speak(response.description);
                tj.lowerArm();
                spoken = true;
                break;
            case 'raise-arm':
                await tj.speak(response.description);
                tj.raiseArm();
                spoken = true;
                break;
            case 'wave':
                await tj.speak(response.description);
                tj.wave();
                spoken = true;
                break;
            case 'greeting':
                await tj.speak(response.description);
                tj.wave();
                spoken = true;
                break;
            case 'shine':
                {
                    let misunderstood = false;
                    if (response.object.entities !== undefined) {
                        const entity = response.object.entities[0];
                        if (entity !== undefined && entity.value !== undefined) {
                            const color = entity.value;
                            await tj.speak(response.description);
                            tj.shine(color);
                            spoken = true;
                        } else {
                            misunderstood = true;
                        }
                    } else {
                        misunderstood = true;
                    }

                    if (misunderstood === true) {
                        await tj.speak("I'm sorry, I didn't understand your color");
                        spoken = true;
                    }
                }
                break;
            case 'see':
                if (config.hasCamera === false) {
                    await tj.speak("I'm sorry, I don't have a camera so I can't see anything");
                    spoken = true;
                } else {
                    await tj.speak(response.description);
                    const objects = await tj.see();

                    if (objects.length === 0) {
                        await tj.speak("I'm not sure I see anything");
                    } else if (objects.length === 1) {
                        await tj.speak(`I see ${objects[0].class}`);
                    } else if (objects.length === 2) {
                        await tj.speak(`I'm looking at ${objects[0].class} and ${objects[1].class}`);
                    } else {
                        await tj.speak(`I'm looking at ${objects[0].class}, ${objects[1].class}, ${objects[2].class}, and a few other things too`);
                    }
                    spoken = true;
                }
                break;
            default:
                break;
            }
        }

        // if we didn't speak a response yet, speak it now
        if (spoken === false) {
            await tj.speak(response.description);
        }
    }
}

/*
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
import TJBot from 'tjbot';
import config from './config.js';


async function query(data) {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/timdettmers/guanaco-33b-merged",
        {
            headers: { Authorization: "Bearer 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" },
            method: "POST",
            body: JSON.stringify(data),
        }
   );
    const result = await response.json();
    return result;
}

// these are the hardware capabilities that TJ needs for this recipe
const hardware = [TJBot.HARDWARE.MICROPHONE, TJBot.HARDWARE.SPEAKER, TJBot.HARDWARE.LED_NEOPIXEL, TJBot.HARDWARE.SERVO];
if (config.hasCamera) {
    hardware.push(TJBot.HARDWARE.CAMERA);
}

// set up TJBot's configuration
const tjConfig = {
    log: {
        level: 'verbose', // change to 'verbose' or 'silly' for more detail about what TJBot is doing
    },
//    converse: {
//        assistantId: config.assistantId,
//    },
    speak: {
	speakerDeviceId: 'plughw:1,0',
    },
    listen: {
	microphoneDeviceId: 'plughw:1,0',
    }
};

// uncomment to change the pins for the LED
// tjConfig.shine = {
//     neopixel: {
//         gpioPin: 18
//     },
//     commonAnode: {
//         redPin: 19,
//         greenPin: 13,
//         bluePin: 12
//     }
// };

// uncomment to change the pin for the servo
// tjConfig.wave = {
//     servoPin: 7
// };

// instantiate our TJBot!
const tj = new TJBot(tjConfig);
tj.initialize(hardware);

console.log('You can ask me to introduce myself or tell you a joke.');
console.log(`Try saying, "${config.robotName}, please introduce yourself" or "${config.robotName}, what can you do?"`);
console.log(`You can also say, "${config.robotName}, tell me a joke!"`);
console.log("Say 'stop' or press ctrl-c to exit this recipe.");

// listen for utterances with our attentionWord and send the result to
// the Assistant service
tj.speak('Hello, I am your friend Peter. I am writing something to see if you can talk.');
//tj.converse('Hello');
while (true) {
    	console.log('test');
	const msg = await tj.listen();

    if (msg === 'stop') {
        console.log('Goodbye!');
        process.exit(0);
    }

    // check to see if they are talking to TJBot
    if (msg.toLowerCase().startsWith(config.robotName.toLowerCase())) {
        // remove our name from the message
        const utterance = msg.toLowerCase().replace(config.robotName.toLowerCase(), '').substr(1);
        // const utterance = msg.toLowerCase();

        // send to the assistant service
//        const response = await tj.converse(utterance);
        const response = await query({"inputs": "You are a helpful assistant called T J Bot. Human: Hi, what's your name? Assistant:"})
	let spoken = false;
//	console.log(`selecting intent with maximum confidence: ${JSON.stringify(intent)}`);
	console.log(JSON.stringify(response));
        // check if an intent to control the bot was found
        if (response.object.intents !== undefined) {
            console.log(`found intent(s): ${JSON.stringify(response.object.intents)}`);

            // choose the most confident intent
            const intent = response.object.intents.reduce((max, i) => {
                return (i.confidence > max.confidence) ? i : max;
            }, {intent: '', confidence: 0.0});

            console.log(`selecting intent with maximum confidence: ${JSON.stringify(intent)}`);
            switch (intent.intent) {
            case 'lower-arm':
                await tj.speak(response.description);
                tj.lowerArm();
                spoken = true;
                break;
            case 'raise-arm':
                await tj.speak(response.description);
                tj.raiseArm();
                spoken = true;
                break;
            case 'wave':
                await tj.speak(response.description);
                tj.wave();
                spoken = true;
                break;
            case 'greeting':
                await tj.speak(response.description);
                tj.wave();
                spoken = true;
                break;
            case 'shine':
                {
                    let misunderstood = false;
                    if (response.object.entities !== undefined) {
                        const entity = response.object.entities[0];
                        if (entity !== undefined && entity.value !== undefined) {
                            const color = entity.value;
                            await tj.speak(response.description);
                            tj.shine(color);
                            spoken = true;
                        } else {
                            misunderstood = true;
                        }
                    } else {
                        misunderstood = true;
                    }

                    if (misunderstood === true) {
                        await tj.speak("I'm sorry, I didn't understand your color");
                        spoken = true;
                    }
                }
                break;
            case 'see':
                if (config.hasCamera === false) {
                    await tj.speak("I'm sorry, I don't have a camera so I can't see anything");
                    spoken = true;
                } else {
                    await tj.speak(response.description);
                    const objects = await tj.see();

                    if (objects.length === 0) {
                        await tj.speak("I'm not sure I see anything");
                    } else if (objects.length === 1) {
                        await tj.speak(`I see ${objects[0].class}`);
                    } else if (objects.length === 2) {
                        await tj.speak(`I'm looking at ${objects[0].class} and ${objects[1].class}`);
                    } else {
                        await tj.speak(`I'm looking at ${objects[0].class}, ${objects[1].class}, ${objects[2].class}, and a few other things too`);
                    }
                    spoken = true;
                }
                break;
            default:
                break;
            }
        }

        // if we didn't speak a response yet, speak it now
        if (spoken === false) {
            await tj.speak(response.description);
        }
    }
}
*/
