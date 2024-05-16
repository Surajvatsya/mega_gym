import mongoose from "mongoose"
import { Request } from 'express';

export interface SignUpRequest {
    ownerName: String,
    email: String,
    password: String,
    gymName: String,
    contact: String,
    address: String,
    upiId: String,
    deviceToken: String | null
}

export interface LoginRequest {
    email: String,
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
    customerName: string;
    email: string;
    contact: string;
    address: string;
    age: number;
    gender: string;
    bloodGroup: string;
    currentBeginDate: string;
    validTill: number;
    charges: number;
    gymName: string;
    profilePic: string | null
}

export interface updateSubscriptionRequest {
    currentBeginDate: string,
    validTill: number,
    charges: number
}