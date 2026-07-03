import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMR Sumut",
  description: "Sign In page for DMR Sumut",
};

export default function SignIn() {
  return <SignInForm />;
}
