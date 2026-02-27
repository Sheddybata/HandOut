import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HandOut",
    short_name: "HandOut",
    description: "Upload materials, view summaries, and take practice quizzes.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#662b62",
    icons: [
      {
        src: "/handoutlogo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/handoutlogo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
