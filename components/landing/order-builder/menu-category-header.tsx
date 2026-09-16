// Printed-menu category header shared by BurgerPicker/ComboPicker/
// SidePicker's grouped lists (reference site: jebbs-burgers.vercel.app) --
// a condensed uppercase label + a thin horizontal rule filling the rest of
// the row, instead of a plain <h3>. See `diner-category-header` in
// app/globals.css.
export function MenuCategoryHeader({ title }: { title: string }) {
  return <h3 className="diner-category-header">{title}</h3>;
}
