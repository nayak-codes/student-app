// types/College.ts
export interface College {
  id: string;
  name: string;
  location: string;
  image: string;
  // Add more optional fields as needed
  [key: string]: any;
}
