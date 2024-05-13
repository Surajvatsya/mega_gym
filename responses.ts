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
    name: String | null,
    deviceToken: String | null
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

interface CustomerDetails {
    id: string,
    customerName: string,
    age: number,
    gender: string,
    bloodGroup: string,
    address: string,
    contact: string,
    email: string,
    currentBeginDate: string,
    currentFinishDate: string,
    gymId: string,
    expiring: number | null
    expired: number | null
}

export interface GetCustomersResponse {
    current: CustomerDetails[],
    expired: CustomerDetails[]
}

export interface GetCustomerProfileResponse {
    gymId: string | null,
    name: string | null,
    age: number | null,
    gender: string | null,
    bloodGroup: string | null,
    address: string | null,
    contact: string | null,
    email: string | null,
    currentBeginDate: string | null,
    currentFinishDate: string | null,
    error: string | null
}