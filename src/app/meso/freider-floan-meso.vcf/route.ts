import { CARDS } from "@/lib/contact";
import { vcard } from "@/lib/vcard";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => vcard(CARDS.meso, request);
