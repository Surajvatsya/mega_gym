import mongoose, { Schema, Document } from 'mongoose';

interface customer extends Document {
  gymId: mongoose.Schema.Types.ObjectId,
  name: string,
  contact: string,
  password: string,
  currentBeginDate: string,
  currentFinishDate: string,
  goal: string,
  experience: string,
  traineeId: mongoose.Schema.Types.ObjectId,

  lastUpdatedProfilePic: string,
}

const customerSchema: Schema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  gymId: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: true,
  },
  age: Number,
  gender: String,
  bloodGroup: String,
  address: String,
  contact: {
    type: String,
    required: true,
  },
  email: String,
  password: String,
  currentBeginDate: String,
  currentFinishDate: String,
  gymName: String,
  lastUpdatedProfilePic: String,
  goal: String,
  experience: String,
  traineeId: mongoose.Schema.Types.ObjectId
});

const customer = mongoose.model<customer>('customer', customerSchema);

export default customer;

