export interface BirthdayCustomer {
  id: number;
  name: string;
  phoneNumber: string;
  birthDate: string; // ISO string
  formattedBirthDate: string; // e.g. "12 Oct"
}