import { GeoProvider } from "@/components/search/GeoProvider";
import { GuestFavoritesSync } from "@/components/marketplace/guest-favorites-sync";

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GeoProvider>
      <GuestFavoritesSync />
      {children}
    </GeoProvider>
  );
}
