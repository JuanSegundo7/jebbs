import { ChevronDown, Minus, Plus, Trash2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatArs } from "./currency";

interface CartItemRowProps {
  icon: LucideIcon;
  name: string;
  quantity: number;
  price: number;
  summary: string | null;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  /** Burgers only in v1: sides have no customization panel mounted anywhere
   * yet, and combos expand per-slot (a different shape) -- see cart-drawer.tsx. */
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  /** The customization panel (e.g. BurgerCustomizePanel), rendered only
   * while `expanded` is true. This component owns no cart state itself --
   * every mutation arrives as a prop, so it stays trivially testable. */
  children?: React.ReactNode;
}

const STEPPER_BUTTON_CLASS =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--accent-brand)] transition-[border-color,transform] duration-150 hover:border-[var(--accent-brand)] active:scale-[0.92] [&_svg]:h-3.5 [&_svg]:w-3.5";

// Read-only in the cart until now (see the old CartLine this replaces,
// inlined in cart-drawer.tsx) -- keeps that row's visual identity (icon,
// "{qty}x {name}" connected to price by leader dots, untruncated name,
// summary paragraph) and adds the controls the owner asked for: a stepper +
// delete row, and for burgers an "Editar" toggle that reopens
// BurgerCustomizePanel (passed in as `children`) via the exact same
// expandedBurger/toggleExpanded slot the picker already uses.
export function CartItemRow({
  icon: Icon,
  name,
  quantity,
  price,
  summary,
  onIncrement,
  onDecrement,
  onRemove,
  expandable = false,
  expanded = false,
  onToggleExpanded,
  children,
}: CartItemRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-1 size-4 shrink-0 text-[var(--accent-brand)]" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline">
          <span className="font-condensed text-[1.05rem] font-bold tracking-[.03em] text-[var(--foreground)] uppercase">
            {quantity}x {name}
          </span>
          <span
            className="mb-[0.3em] min-w-[1rem] flex-1 self-end border-b border-dotted border-[var(--muted-foreground-dim)]"
            aria-hidden
          />
          <span className="numeric shrink-0 font-condensed text-[1.05rem] font-bold text-[var(--accent-brand)]">
            {formatArs(price)}
          </span>

          {/* Stepper + borrar, al lado del precio -- son la misma acción
              (cuánto de esto llevo), no un renglón aparte (feedback real). */}
          <div className="ml-2 flex shrink-0 items-center gap-1">
            <button
              type="button"
              className={STEPPER_BUTTON_CLASS}
              onClick={onDecrement}
              aria-label={`Quitar uno de ${name}`}
            >
              <Minus />
            </button>
            <span className="numeric w-6 text-center text-sm text-[var(--foreground)]">
              {quantity}
            </span>
            <button
              type="button"
              className={STEPPER_BUTTON_CLASS}
              onClick={onIncrement}
              aria-label={`Agregar uno de ${name}`}
            >
              <Plus />
            </button>
            <button
              type="button"
              className="inline-flex size-7 items-center justify-center rounded-full text-[var(--accent-brand)] transition-colors hover:bg-[var(--surface-0)]"
              onClick={onRemove}
              aria-label={`Eliminar ${name}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {/* Oculto mientras está expandido, mismo criterio que
            burger-picker.tsx (su propia fila colapsada oculta este mismo
            resumen una vez abierto el panel) -- BurgerCustomizePanel ya
            muestra su propio resumen en vivo arriba de los steppers, así
            que dejarlo visible acá también lo duplicaba (reportado real,
            con captura: "2 papas" arriba de "Editar" Y "5 carnes · 2 papas"
            de nuevo adentro del panel). */}
        {summary && !expanded && (
          <p className="mt-0.5 font-body text-[13px] leading-snug text-[var(--muted-foreground)]">
            {summary}
          </p>
        )}

        {expandable && (
          <button
            type="button"
            className="mt-1 flex items-center gap-1 font-condensed text-[11px] font-bold tracking-[.08em] text-[var(--accent-brand)] uppercase"
            onClick={onToggleExpanded}
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
              aria-hidden
            />
            Editar
          </button>
        )}

        {expanded && children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}
