import type { Metadata } from "next";
import { Vozes } from "./Vozes";

export const metadata: Metadata = { title: "Vozes · Pietro Games" };

export default function Page() {
  return <Vozes />;
}
