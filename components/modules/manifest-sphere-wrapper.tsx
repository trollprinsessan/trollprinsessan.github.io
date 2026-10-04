"use client";

import dynamic from "next/dynamic";

const ManifestSphere = dynamic(() => import("./manifest-sphere"), { ssr: false });

export default function ManifestSphereWrapper({ imageUrls }: { imageUrls: string[] }) {
  return <ManifestSphere imageUrls={imageUrls} />;
}
