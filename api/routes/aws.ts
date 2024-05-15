import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
const verifyToken = require("../middleware/jwt");
import mime from 'mime-types';

const router = express.Router();

require('dotenv').config();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
})

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', verifyToken, upload.single('file'), (req:any, res) => {
    const file = req.file;
    console.log("uploading")
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const params = {
        Bucket: process.env.S3_BUCKET_NAME ?? "",
        Key: `${req.body.customerId}`,
        Body: file.buffer,
        ContentType: mime.lookup(file.originalname) || 'application/octet-stream'
    };

    s3.upload(params, (err: any, data: any) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'File uploaded successfully', data });
    });
});

router.delete('/delete', verifyToken, (req, res) => {

    if (!req.body.customerId) {
        return res.status(400).send('No customerId provided.');
    }

    const params = {
        Bucket: process.env.S3_BUCKET_NAME ?? "",
        Key: req.body.customerId
    };

    s3.deleteObject(params, (err, data) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'File deleted successfully', data });
    });
});

module.exports = router;
