import mongoose, { Schema, Document } from 'mongoose';

interface Owner extends Document {
    name: string;
    email?: string;
    password?: string;
    gymName: string;
    contact: string;
    address: string;
    upiId?: string;
    deviceToken: string;
}

const ownerSchema: Schema = new Schema({
    _id: Schema.Types.ObjectId,
    name: {
        type: String,
        required: true,
    },
    email: String,
    password: String,
    gymName: {
        type: String,
        required: true,
    },
    contact: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    upiId: String,
    deviceToken: String,
});

const Owner = mongoose.model<Owner>('Owner', ownerSchema);

export default Owner;
