// Printed-menu category header shared by BurgerPicker/ComboPicker/
// SidePicker's grouped lists (reference site: jebbs-burgers.vercel.app) --
// a bold label + a thin horizontal rule filling the rest of the row,
// instead of a plain <h3>. Re-estilo a la identidad real de jebbs-dashboard:
// `diner-category-header` (global, app/globals.css) usaba font-condensed
// mayúscula + color cheddar -- reemplazado acá por su equivalente literal
// (font-sans, sin mayúscula/tracking, --foreground/--hairline) en vez de
// editar la utility global, porque esta sigue definida con la paleta vieja
// y no tiene otros consumidores fuera de esta sección.
export function MenuCategoryHeader({ title }: { title: string }) {
  return (
    <h3 className="mb-1 flex items-center gap-[14px] font-sans text-[1.32rem] font-bold text-[var(--foreground)] after:h-px after:flex-1 after:bg-[var(--hairline)] after:content-['']">
      {title}
    </h3>
  );
}
