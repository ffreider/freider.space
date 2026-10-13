import { shortLinkMetadata, shortLinkPage } from "../short-link";

export const dynamic = "force-dynamic";
export const metadata = shortLinkMetadata;
export default shortLinkPage(3);
