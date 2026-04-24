"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { AuthCTAContent } from "./AuthCTAContent";

export function AuthCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!data.user) setShow(true);
      });
  }, []);

  if (!show) return null;
  return <AuthCTAContent />;
}
