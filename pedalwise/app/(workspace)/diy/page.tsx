import { redirect } from "next/navigation";

/**
 * DIY workspace root (PW-102).
 *
 * Routes to the first step of the 5-step guided fit. The actual workspace
 * lives under `/diy/[step]` so the URL is the source of truth for which
 * step the user is on (refresh-safe).
 */
export default function DIYWorkspacePage(): never {
  redirect("/diy/welcome");
}
