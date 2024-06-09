import Exercise from "./api/model/exercise";
import mongoose from "mongoose";
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
    experience: string | null,
    currentWeekAttendance: string | null,
    locationLat: number | null,
    locationLon: number | null,
    template: TemplateResponse
}
export interface VerifyReferralCode {
    user: string | null,
    currPlan: mongoose.Schema.Types.ObjectId | null,
    error: string | null
}

export interface ReferralCode {
    referralCode: string | null,
    error: string | null
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
    gymLocationLat: String | null,
    gymLocationLon: String | null,
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


export interface ExerciseForDayResponse {
    exercises: {
        exerciseId: string;
        exerciseName: string;
        sets: {
            setNumber: number;
            weight: number;
            reps: number;
        }[];
    }[];
}

export interface LifeTimeAttendance {
    startMonth: string | null,
    startYear: number | null,
    startDay: number | null
    endMonth: string | null,
    endYear: number | null,
    data: {
        month: string,
        year: number,
        days: number []
    }[]

}

export interface WorkoutLogsResponse {
    message: string
}

export interface WorkoutAnalysisResponse {

    comparisionData: {
        titles: string[],
        data: number[],
        maxLimitOfData: number,
        top: number,
        highlightTitle: number
        minLimitOfData: number
    },

    growthData: {
        titles: string[],
        data: number[],
        maxLimitOfData: number
        minLimitOfData: number
    },

    error: string | null
}

export interface IdCardResponse {

    gymName: String | null,
    gymContact: String | null,
    memberName: String | null,
    planDue: String | null,
    planDuration: number | null,
    planid: String | null,
    customerPic: String | null,
    error: String | null
}

export interface GetTemplateResponse {
    exerciseTemplate: ExerciseTemplate[]
}

export interface ExerciseTemplate {
    exerciseName: String,
    exerciseId: String,
    exerciseInformation: ExerciseSetAndReps[]
}

export interface ExerciseSetAndReps {
    exerciseDescriptionId: String,
    weight: number,
    reps: number,
    doneToday: boolean
}

export interface GetAllExercises {
    exercises: Exercise[]
}

export interface UserExercises {
    exercises: ExerciseIdAndName[]
}

export interface ExerciseIdAndName{
    _id : string,
    name: string
}
