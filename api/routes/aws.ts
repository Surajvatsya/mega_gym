import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
const verifyToken = require("../middleware/jwt");
import mime from 'mime-types';
import { S3Bucket } from '../../configs';
import Customer from '../model/customer'
const sharp = require('sharp');

const router = express.Router();

require('dotenv').config();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', verifyToken, upload.single('file'), async (req: any, res) => {

    const file = req.file;
    const compressedImageBuffer = await sharp(file.buffer)
        .resize({ fit: 'inside', width: 500, height: 500 }) // Adjust dimensions as needed
        .toBuffer();

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const params = {
        Bucket: process.env.S3_BUCKET_NAME ?? "",
        Key: `${req.body.customerId}`,
        Body: compressedImageBuffer,
        ContentType: mime.lookup(file.originalname) || 'application/octet-stream'
    };

    S3Bucket.upload(params, async (err: any, data: any) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        await Customer.findByIdAndUpdate(
            req.body.customerId,
            {
                lastUpdatedProfilePic: new Date().getTime().toString()
            },
            {
                new: true,
            },
        );

        res.status(200).json({ message: 'File uploaded successfully' });
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

    S3Bucket.deleteObject(params, (err, data) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'File deleted successfully', data });
    });
});


router.get('/image/:customerId', verifyToken, (req, res) => {
    const { customerId } = req.params;

    const params = {
        Bucket: process.env.S3_BUCKET_NAME ?? "",
        Key: customerId
    };

    S3Bucket.headObject(params, (err, data) => {
        if (err) {
            if (err.code === 'NotFound') {
                return res.status(404).json({ message: 'Key not found' });
            }
            return res.status(500).json({ message: err.message });
        }

        const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${customerId}`;
        return res.status(200).json({ url: url });
    });
});
module.exports = router;
