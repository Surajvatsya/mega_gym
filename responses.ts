import Owner from "./api/model/owner";
import { JWToken } from "./requests";

export interface SignUpResponse {
    owner: Owner | null,
    token: String | null,
    error: any | null,
    trainees: any | null
}

export interface LoginResponse {
    contact: String | null,
    email: String | null,
    token: JWToken | null,
    error: any | null,
    name: String | null,
    deviceToken: String | null,
    gymName: String | null
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

export interface CustomerDetails {
    id: string,
    customerName: string,
    contact: string,
    currentBeginDate: string,
    goal: string,
    experience: string,
    currentFinishDate: string,
    gymId: string,
    expiring: number | null
    expired: number | null,
    profilePic: String | null
}

export interface GetCustomersResponse {
    current: CustomerDetails[],
    expired: CustomerDetails[]
}

export interface GetCustomerProfileResponse {
    gymId: string | null,
    name: string | null,
    contact: string | null,
    currentBeginDate: string | null,
    currentFinishDate: string | null,
    error: string | null,
    profilePic: string | null,
    goal: string| null,
    experience: string | null
}

export interface DuplicateResponseCheck {
    unique: boolean,
}