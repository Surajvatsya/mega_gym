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
    gymName: String | null,
    trainees: any | null,
    lat: string | null,
    lon: string | null,

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
    trainerName: String | null,
    validTill: number | null
    contact: string | null,
    currentBeginDate: string | null,
    currentFinishDate: string | null,
    error: string | null,
    profilePic: string | null,
    goal: string | null,
    experience: string | null
}

export interface DuplicateResponseCheck {
    unique: boolean,
}

export interface MemberLoginResponse {
    contact: String | null,
    error: any | null,
    name: String | null,
    token: String | null
}

export interface OwnerDetails {
    contact: String | null,
    error: any | null,
    name: String | null,
    gymName: String | null,
    trainees: any | null,
    gymLocationLat : String | null,
    gymLocationLon : String | null
}

export interface TemplateResponse {
    templateDesc: {
        day: string;
        targetBody: string;
        allExercise: {
            exerciseName: string;
            setNumber: number;
            weight: number;
            reps: number;
        }[] | null;
    }[] | null;
}