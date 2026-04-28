import { redirect } from "next/navigation";
import { MasterPlanningPage } from "@/components/home/master-planning-page";
import type { DimProductoPreviewItem } from "@/lib/fabric-dim-producto";
import { getDimProductoPreview } from "@/lib/fabric-dim-producto";
import {
  getExpiredSessionRedirectPath,
  getInvalidSessionRedirectPath,
  readSession,
} from "@/lib/session";

// export default async function Page() {
//   const session = await readSession();

//   switch (session.status) {
//     case "missing":
//       redirect("/login");
//     case "expired":
//       redirect(getExpiredSessionRedirectPath());
//     case "invalid":
//       redirect(getInvalidSessionRedirectPath());
//     case "authenticated":
//       return <MasterPlanningPage currentUser={session.user} />;
//   }


export const dynamic = "force-dynamic";

type DimProductoPreviewState = {
  readonly rows: DimProductoPreviewItem[];
  readonly errorMessage: string | null;
};

async function loadDimProductoPreview(): Promise<DimProductoPreviewState> {
  try {
    return {
      rows: await getDimProductoPreview(),
      errorMessage: null,
    };
  } catch {
    return {
      rows: [],
      errorMessage: "No se pudo cargar la vista previa de dbo.dim_producto.",
    };
  }
}

export default async function Page() {
  const dimProductoPreview = await loadDimProductoPreview();
  const session = await readSession();

  switch (session.status) {
    case "missing":
      redirect("/login");
    case "expired":
      redirect(getExpiredSessionRedirectPath());
    case "invalid":
      redirect(getInvalidSessionRedirectPath());
    case "authenticated":
      return <MasterPlanningPage currentUser={session.user} dimProductoRows={dimProductoPreview.rows} dimProductoErrorMessage={dimProductoPreview.errorMessage} />;
  }
  // return (
  //   <MasterPlanningPage
  //     dimProductoRows={dimProductoPreview.rows}
  //     dimProductoErrorMessage={dimProductoPreview.errorMessage}
  //   />
  // );
}
