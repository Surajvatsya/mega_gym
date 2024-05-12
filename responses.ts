import Owner from "./api/model/owner";
import { JWToken } from "./requests";

export interface SignUpResponse {
    new_owner: Owner | null,
    token: String | null,
    error: any | null
}

export interface LoginResponse {
    contact: String | null,
    email: String | null,
    token: JWToken | null,
    error: any | null,
    name: String | null
}

export interface AnalysisResponse {
    males: number,
    females: number,
    numberOfPeople: number,
    averageMonth: number,
    earnings: number
}

export interface ExpandedAnalysisResponse {
    titles: string[],
    data: number[],
    average: String,
    total: String,
    maxLimitOfData: number
}

export interface GetUPIIdResponse {
    upiId: String,
    error: String | null
}