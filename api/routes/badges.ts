import express from 'express';
import mongoose from 'mongoose';
const router = express.Router();


router.get('/badge', (req,res)=>{
    const now = new Date();
    const ISTOffset = 5.5 * 60 * 60 * 1000; // Convert hours to milliseconds
    const ISTTime = new Date(now.getTime() + ISTOffset);
    const ISTDate : number = ISTTime.getDate();
    
    
    if (ISTDate == 1) {
        
    }
})