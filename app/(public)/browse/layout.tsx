import { GeoProvider } from "@/components/search/GeoProvider";

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GeoProvider>{children}</GeoProvider>;
}
