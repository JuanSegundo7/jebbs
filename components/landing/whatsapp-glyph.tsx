interface WhatsappGlyphProps {
  className?: string;
}

// lucide-react has no WhatsApp icon (brand glyphs were dropped from the
// library) and there's no SVG asset for it in public/ -- this is the
// official WhatsApp glyph path, inlined. fill="currentColor" (not brand
// green) on purpose: the confirm button is orange with --accent-contrast
// text, and a green glyph on it would be the only off-palette element in
// the whole flow.
export function WhatsappGlyph({ className }: WhatsappGlyphProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z" />
      <path d="M12.031 2C6.508 2 2.02 6.488 2.02 12.011c0 1.79.469 3.532 1.36 5.065L2 22l5.045-1.352a9.972 9.972 0 0 0 4.986 1.34h.004c5.522 0 10.011-4.489 10.011-10.012 0-2.676-1.041-5.19-2.933-7.081A9.947 9.947 0 0 0 12.031 2Zm0 18.31h-.003a8.303 8.303 0 0 1-4.236-1.16l-.304-.18-3.045.816.813-2.968-.198-.304a8.293 8.293 0 0 1-1.271-4.407c0-4.585 3.732-8.317 8.317-8.317a8.26 8.26 0 0 1 5.883 2.44 8.259 8.259 0 0 1 2.432 5.881c0 4.585-3.73 8.199-8.318 8.199Z" />
    </svg>
  );
}
