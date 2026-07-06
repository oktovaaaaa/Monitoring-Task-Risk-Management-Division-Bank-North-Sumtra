import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMR Sumut",
  description: "Sign Up page for DMR Sumut",
  icons: {
    icon: "/images/sumut.png",
  },
};

export default function SignUp() {
  return <SignUpForm />;
}
