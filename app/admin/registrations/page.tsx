import type { Metadata } from "next";
import { RegistrationReview } from "./registration-review";

export const metadata: Metadata = {
  title: "Registration review · SSC COMELEC",
  description: "Admin registration review interface preview.",
};

export default function RegistrationsPage() {
  return <RegistrationReview />;
}
