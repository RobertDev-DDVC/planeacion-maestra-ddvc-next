import { redirect } from "next/navigation";

import { MasterPlanningPage } from "@/components/home/master-planning-page";
import {
  getExpiredSessionRedirectPath,
  getInvalidSessionRedirectPath,
  readSession,
} from "@/lib/session";

export default async function Page() {
  const session = await readSession();

  switch (session.status) {
    case "missing":
      redirect("/login");
    case "expired":
      redirect(getExpiredSessionRedirectPath());
    case "invalid":
      redirect(getInvalidSessionRedirectPath());
    case "authenticated":
      return <MasterPlanningPage currentUser={session.user} />;
  }
}
