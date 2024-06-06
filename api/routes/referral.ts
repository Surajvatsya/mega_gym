import express, { Request, Response } from 'express';
const bcrypt = require("bcrypt");
import Customer from "../model/customer";
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const verifyToken = require("../middleware/jwt");
import { AnalysisResponse, DuplicateResponseCheck, ExpandedAnalysisResponse, GetUPIIdResponse, LoginResponse, OwnerDetails, ReferralCode, SignUpResponse, VerifyReferralCode } from '../../responses';
import { addValidTillToCurrDate, getMonthFromNumber } from "../utils";
import { SignUpRequest, LoginRequest, JWToken, UpdateLocationRequest } from '../../requests';
import Owner from '../model/owner';
import Plan from '../model/plan'
import Trainee from '../model/trainee';

const router = express.Router();


router.get("/getReferralCode", verifyToken, async (req:any,res:Response<ReferralCode>)=>{

    const userId = req.jwt.ownerId;
    const userReferralCode = await Customer.findById(userId, {_id : 0, referralCode:1});
    if(userReferralCode)
    return res.status(200).json({referralCode:userReferralCode.referralCode, error : null});
    else 
    return res.status(400).json({referralCode:null,error:"userReferralCode is null" });
});

router.post("/verifyReferralCode/:referralCode", verifyToken, async (req:any,res:Response<VerifyReferralCode>)=>{
    const referralCode = req.params.referralCode;
    const gymId = req.jwt.ownerId;
    const user = await Customer.findOne({referralCode: referralCode, gymId: gymId});
    if (user){
        let updatedFinishDate = addValidTillToCurrDate(
            user.currentFinishDate,1
          );
          await Customer.findByIdAndUpdate(user._id, {currentFinishDate:updatedFinishDate});
        const currPlan = await Plan.findOne(user.currentPlanId);
        if(currPlan){
            const updatePlan = {
                endDate: updatedFinishDate,
                duration: currPlan.duration + 1
            }
            await Plan.findByIdAndUpdate(user.currentPlanId, updatePlan);
        }
        else{
            return res.status(404).json({
                user : `userId is ${user._id}`,
                currPlan : null,
                error: null
            })
        }
        return res.status(200).json({
            user : `userId ${user._id} current plan updated successfully`,
            currPlan : user.currentPlanId,
            error: null
        })
    }else{

        return res.status(404).json({
            user : null,
            currPlan : null,
            error: "Didn't find user"
        })
    }
})
module.exports = router;