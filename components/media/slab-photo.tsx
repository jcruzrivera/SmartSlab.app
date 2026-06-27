type SlabPhotoProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

/** Server-rendered photo. URLs must be computed on the server before render. */
export function SlabPhoto({
  src,
  alt,
  className,
  loading = "lazy",
}: SlabPhotoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
    />
  );
}
