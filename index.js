require("dotenv").config();
const express = require("express");
const multer = require("multer");
const axios = require("axios");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const KEY_ID = process.env.KEY_ID;
const APP_KEY = process.env.APP_KEY;
const BUCKET_ID = process.env.BUCKET_ID;
const BUCKET_NAME = process.env.BUCKET_NAME;

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    // Step 1: Authorize
    const authRes = await axios.get("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      auth: { username: KEY_ID, password: APP_KEY }
    });
    const { apiUrl, authorizationToken, downloadUrl } = authRes.data;

    // Step 2: Get Upload URL
    const uploadUrlRes = await axios.post(
      `${apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId: BUCKET_ID },
      { headers: { Authorization: authorizationToken } }
    );

    const { uploadUrl, authorizationToken: uploadAuthToken } = uploadUrlRes.data;

    // Step 3: Upload File
    const fileName = Date.now() + "-" + req.file.originalname;
    await axios.post(uploadUrl, req.file.buffer, {
      headers: {
        Authorization: uploadAuthToken,
        "X-Bz-File-Name": encodeURIComponent(fileName),
        "Content-Type": req.file.mimetype,
        "X-Bz-Content-Sha1": "do_not_verify"
      }
    });

    // Step 4: Return Public Link
    const publicUrl = `${downloadUrl}/file/${BUCKET_NAME}/${encodeURIComponent(fileName)}`;
    res.json({ url: publicUrl });

  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).send("Upload failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
