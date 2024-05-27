import { S3Bucket } from '../configs';
import Customer from './model/customer';
const sharp = require('sharp');

export function convertUtcToLongDateFormat(utcTime: Date): string {
    const indianDate = utcTime.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
    });
    const format: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    const formattedDate = new Date(indianDate).toLocaleDateString(
        "en-IN",
        format,
    );

    return formattedDate;
};

export function addValidTillToCurrDate(currentBeginDate: string, validTill: number): string {
    const [day, month, year] = currentBeginDate.split(" ");
    const monthNameAndNumber: { [key: string]: number } = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const monthNumber = monthNameAndNumber[month];
    const date = new Date(parseInt(year), monthNumber, parseInt(day));
    date.setMonth(date.getMonth() + validTill);
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

export function calculateValidTill(startDate: string, endDate: string): number {
    const [startDay, startMonth, startYear] = startDate.split(" ");
    const [endYear, endMonth, endDay] = endDate.split(" ");

    const start = new Date(`${startYear}-${getMonthNumber(startMonth)}-${startDay}`);
    const end = new Date(`${endYear}-${endMonth}-${endDay}`);

    const diffInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    return diffInMonths;
}

function getMonthNumber(month: string): string {
    const monthNameAndNumber: { [key: string]: string } = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
        Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
    };

    return monthNameAndNumber[month];
}


export function getMonthFromNumber(number: number): string {
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), number).toLocaleString("en-US", {
        month: "long",
    });
}

export async function getProfilePic(customerId: string): Promise<string | null> {
    const customer = await Customer.findById(customerId);


    const params = {
        Bucket: process.env.S3_BUCKET_NAME ?? "",
        Key: customerId
    };

    try {
        await S3Bucket.headObject(params).promise();
        return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${customerId}?time=${customer?.lastUpdatedProfilePic}`;
    } catch (err: any) {
        if (err.code === 'NotFound') {
            return null;
        }
        throw err;
    }
}

export async function uploadBase64(customerId: string, fileInBase64: string | null) {

    if (fileInBase64 == null) {
        return null;
    }

    const fileBuffer = Buffer.from(fileInBase64, 'base64');
    const compressedImageBuffer = await sharp(fileBuffer)
        .resize({ fit: 'inside', width: 500, height: 500 })
        .toBuffer();

    const params = {
        Bucket: process.env.S3_BUCKET_NAME ?? "",
        Key: customerId,
        ContentEncoding: 'base64',
        Body: fileBuffer,
        ContentType: 'image/jpeg'
    };

    try {
        const data = await S3Bucket.upload(params).promise();
        console.log("Upload successful:", data);
        return data.Location;
    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
}

export function deleteFromS3(customerId: string) {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME ?? "",
        Key: customerId
    };
    try {
        S3Bucket.deleteObject(params, (err, data) => {
            if (err) {
                return err.message
            }
            return 'File deleted successfully';
        });
        return 'File deleted successfully';
    }
    catch (e) {
        return e;
    }

}