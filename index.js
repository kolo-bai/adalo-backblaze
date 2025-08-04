
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Init Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'ward-c.appspot.com',
});

const bucket = admin.storage().bucket();
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Upload endpoint
app.post('/upload', async (req, res) => {
  const { base64Image, propIDAuto } = req.body;

  if (!base64Image || !propIDAuto) {
    return res.status(400).json({ error: 'Missing base64Image or propIDAuto' });
  }

  try {
    const buffer = Buffer.from(base64Image, 'base64');
    const timestamp = Date.now();
    const fileName = `${propIDAuto}-${timestamp}.jpg`;
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
      },
    });

    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    res.status(200).json({ url: publicUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Firebase Image Upload API is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
