exports.generateSignedUrl = async (req, res) => {
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage();
    const bucket = storage.bucket('poem-to-video');
  
    try {
      const { filename } = req.body;
      
      const [url] = await bucket.file(filename).getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: 'video/mp4',
      });
  
      res.json({ signedUrl: url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };