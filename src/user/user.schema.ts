import { Schema } from 'dynamoose';

const clubSchema = new Schema({
  name: {
    type: String,
  },
});

export const UserSchema = new Schema({
  id: {
    type: String,
    hashKey: true,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  position: {
    type: String,
  },
  currentTeam: {
    type: String,
  },
  yearsOfExperience: {
    type: Number,
  },
  previousClubs: {
    type: Array,
    schema: [clubSchema],
  },
  achievements: {
    type: String,
  },
});
