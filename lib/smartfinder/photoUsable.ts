export type PhotoMeta = {
  naturalWidth: number;
  naturalHeight: number;
  slabWidthIn: number;
  slabHeightIn: number;
};

/**
 * Whether a listing photo is safe as a nesting background.
 * Fail closed when dimensions are missing or aspect is a poor match
 * for the slab face (yard shots, vertical crops, heavy letterboxing).
 */
export function isPhotoUsableAsBackground(p: PhotoMeta): boolean {
  if (!p.naturalWidth || !p.naturalHeight) return false;
  if (!p.slabWidthIn || !p.slabHeightIn) return false;

  const photoAspect = p.naturalWidth / p.naturalHeight;
  const slabAspect = p.slabWidthIn / p.slabHeightIn;

  // Slabs are typically landscape; reject portrait / near-square yard shots.
  if (photoAspect < 1.1) return false;

  // Photo aspect should resemble the slab; otherwise object-cover distorts nesting.
  const ratioDelta = Math.abs(photoAspect - slabAspect) / slabAspect;
  if (ratioDelta > 0.35) return false;

  return true;
}
