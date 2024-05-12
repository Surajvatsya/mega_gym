import mongoose from "mongoose"

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
