// Shared by the contact pages (/contact and /meso) and their downloadable cards.
export const CONTACT = {
  name: "Freider Fløan",
  givenName: "Freider",
  familyName: "Fløan",
  phone: "+4798655256",
  displayPhone: "+47 986 55 256",
  website: "https://freider.space",
  linkedin: "https://www.linkedin.com/in/freider/",
  birthday: "2000-01-24",
  // Opens a Signal chat with the phone number above.
  signal: "https://signal.me/#p/+4798655256",
  // Fixed, and the same on both cards, so saving a card again (or the other
  // one) updates the contact instead of adding a second one.
  uid: "urn:uuid:af20516d-f5ae-4409-954f-22473a009c15",
};

export type Card = {
  path: string; // the page; the card downloads from `${path}/${file}`
  file: string;
  email: string;
  title: string;
  company?: string;
  companyUrl?: string;
  intro: string; // the line under the name on the page
};

export const CARDS = {
  personal: {
    path: "/contact",
    file: "freider-floan.vcf",
    email: "freider.floan@gmail.com",
    title: "Your friendly neighbourhood spaceman",
    intro: "I like starting things, mostly about space.",
  },
  meso: {
    path: "/meso",
    file: "freider-floan-meso.vcf",
    email: "freider@mesomanufacturing.com",
    title: "Co-founder",
    company: "Meso Manufacturing",
    companyUrl: "https://www.mesomanufacturing.com/",
    intro: "Co-founder of Meso Manufacturing.",
  },
} satisfies Record<string, Card>;
