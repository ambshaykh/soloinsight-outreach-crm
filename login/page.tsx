import { redirect } from "next/navigation";

// Legacy entry point — the app now uses a portal selector at "/" with a
// branded login page per portal ("/portal/<slug>/login"). Kept as a thin
// redirect so old bookmarks/links don't 404.
export default function LegacyLoginPage() {
  redirect("/");
}
