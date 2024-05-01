const express = require("express");
const router = express.Router();


const qr = require('qr-image');


router.get('/generateCode/:upiID', (req, res) => {
    const upiID = req.params.upiID;
  
    // Generate QR code with the UPI ID
    const qr_png = qr.image(`upi://pay?pa=${upiID}`, { type: 'png' });
  
    // Set response content type
    res.type('png');
  
    // Pipe the QR code image to the response
    qr_png.pipe(res);
  });

module.exports = router;
