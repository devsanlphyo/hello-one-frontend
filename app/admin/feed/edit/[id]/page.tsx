"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AdminEditRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/feed/edit/${params.id}`);
    }
  }, [params?.id, router]);

  return null;
}
