export interface UserKey {
  id: string;
}

export interface User extends UserKey {
  name?: string;
  email?: string;
  password?: string;
  profilePicture?: string;
}
