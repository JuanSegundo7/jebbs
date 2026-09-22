// Printed-menu category header shared by BurgerPicker/ComboPicker/
// SidePicker's grouped lists (reference site: jebbs-burgers.vercel.app) --
// a condensed uppercase label + a thin horizontal rule filling the rest of
// the row, instead of a plain <h3>. `diner-category-header` (global,
// app/globals.css) sigue definida con la paleta vieja y no tiene otros
// consumidores fuera de esta sección, así que se reemplaza acá por su
// equivalente literal: tipografía "diner" restaurada (font-condensed
// mayúscula) con --foreground/--hairline en vez de --cheddar/--line.
export function MenuCategoryHeader({ title }: { title: string }) {
  return (
    <h3 className="mb-1 flex items-center gap-[14px] font-condensed text-[1.32rem] font-bold tracking-[0.16em] text-[var(--foreground)] uppercase after:h-px after:flex-1 after:bg-[var(--hairline)] after:content-['']">
      {title}
    </h3>
  );
}
