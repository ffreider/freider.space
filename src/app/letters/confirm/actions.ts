"use server";

import { redirect } from "next/navigation";
import { addSubscriber, checkLink, lettersEnabled } from "@/lib/letters";

// Adding the subscriber happens on POST, not GET, so email link scanners
// pre-fetching the confirmation link can't confirm someone automatically.
export async function confirmSubscription(form: FormData) {
  if (!lettersEnabled()) redirect("/letters/confirm");
  const link = checkLink({
    e: String(form.get("e") ?? ""),
    u: String(form.get("u") ?? ""),
    s: String(form.get("s") ?? ""),
  });
  if (!link.ok) redirect(`/letters/confirm?status=${link.reason}`);
  try {
    await addSubscriber(link.email);
  } catch (err) {
    console.error(err);
    redirect("/letters/confirm?status=failed");
  }
  redirect("/letters/confirm?status=done");
}
