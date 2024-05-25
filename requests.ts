import mongoose from "mongoose"
import { Request } from 'express';

export interface SignUpRequest {
    name: String,
    password: String,
    gymName: String,
    contact: string,
    address: String,
    upiId: String,
    deviceToken: String | null
    trainees: TraineeDetail[]
}

export interface TraineeDetail {
    name: string,
    experience: string
}

export interface LoginRequest {
    contact: string,
    password: String
    deviceToken: String | null
}

export interface JWToken {
    ownerId: mongoose.Types.ObjectId,
    email: String,
    contact: String,
}

export interface RegisterCustomerRequest {
    jwt: JWToken,
    name: string;
    contact: string;
    currentBeginDate: string;
    validTill: number;
    charges: number;
    gymName: string;
    goal: string,
    experience: string,
    mentorName: string,
    profilePic: string | null
}

export interface updateSubscriptionRequest {
    currentBeginDate: string,
    validTill: number,
    charges: number
}