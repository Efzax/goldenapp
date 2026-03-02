import { Suspense } from "react";
import MobileClient from "./mobile-client";
export const dynamic = "force-dynamic";

export default function MobilePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <MobileClient />
      </Suspense>
  );
}
