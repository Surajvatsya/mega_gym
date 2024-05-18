import { S3Bucket } from '../configs';
import Customer from './model/customer';

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

export async function uploadBase64(fileInBase64: string, customerId: string) {

    const fileBuffer = Buffer.from(fileInBase64, 'base64');
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