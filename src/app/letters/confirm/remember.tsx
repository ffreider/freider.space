"use client";

import { useEffect } from "react";
import { rememberSignUp } from "../form";

// Confirmed in this browser: the homepage button can stop asking.
export function Remember() {
  useEffect(rememberSignUp, []);
  return null;
}
