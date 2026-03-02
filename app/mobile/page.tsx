export const dynamic = "force-dynamic";
import { Suspense } from "react";
import MobileClient from "./mobile-client";

export default function MobilePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <MobileClient />
      </Suspense>
  );
}
