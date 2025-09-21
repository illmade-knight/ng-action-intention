
// Client-side representation of the user object from the backend
export interface UserProfile {
  id: string; // This is the Firestore document ID
  email: string;
  alias: string;
}

export interface AddressBookContact {
  id: string; // The contact's document ID
  email: string;
  alias: string;
}
