const { DeepgramClient } = require('@deepgram/sdk');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// Note: This is an English stream, update accordingly for other languages
const STREAM_URL = process.env.STREAM_URL || 'https://playerservices.streamtheworld.com/api/livestream-redirect/CSPANRADIOAAC.aac';

const live = async () => {
  const deepgram = new DeepgramClient({ apiKey: DEEPGRAM_API_KEY });

  const socket = await deepgram.listen.v1.createConnection({
    model: 'nova-3',
    language: 'en',
  });

  socket.on('message', (data) => {
    if (data.type === 'Results' && data.channel?.alternatives?.[0]) {
      const transcript = data.channel.alternatives[0].transcript;
      if (transcript) {
        console.log(transcript);
      }
    }
  });

  socket.on('close', () => {
    console.log('Connection closed.');
  });

  socket.on('error', (err) => {
    console.error(err);
  });

  socket.connect();
  await socket.waitForOpen();

  console.log(`Transcribing ${STREAM_URL}...`);

  const response = await fetch(STREAM_URL, { redirect: 'follow' });
  const reader = response.body.getReader();

  const pump = async () => {
    const { done, value } = await reader.read();
    if (done) return;
    socket.sendMedia(value);
    return pump();
  };
  pump().catch(console.error);
}

live().catch(console.error);

module.exports = { live };