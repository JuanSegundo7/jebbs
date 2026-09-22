"use client";

import Image from "next/image";
import { Minus, Plus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatArs } from "./currency";

interface MenuItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  price: number;
  description: string | null;
  imageUrl?: string | null;
  fallbackIcon: LucideIcon;
  count: number;
  onAdd: () => void;
  onRemove: () => void;
  footnote?: string | null;
  children?: ReactNode;
}

// Detail panel opened by tapping a menu row in burger-picker.tsx/combo-picker.tsx
// -- one Drawer per PICKER (a single local `detail`/`open` useState there),
// not one per row and not new hook state. Shows the item's full, untruncated
// description (the row itself truncates with line-clamp-2) plus whatever the
// caller renders below it (ingredient chips for a burger, the slot breakdown
// for a combo), and a stepper that mirrors the row's own +/-. It deliberately
// stops there: meat/fries/veggie/extras customization stays only in the
// expanded selected-items panel below (indexed by cart instance, not by
// catalog item) -- `footnote` is how callers point down at it once count > 0.
export function MenuItemSheet({
  open,
  onOpenChange,
  name,
  price,
  description,
  imageUrl,
  fallbackIcon: FallbackIcon,
  count,
  onAdd,
  onRemove,
  footnote,
  children,
}: MenuItemSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {/* Same single-scroll-region pattern as cart-drawer.tsx: header,
            hero and children all scroll together inside one
            min-h-0 flex-1 overflow-y-auto region so DrawerFooter (the
            add/stepper action) never ends up below the fold on a short
            phone screen. */}
        <div className="diner-wrap min-h-0 flex-1 overflow-y-auto">
          {/* Altura fija (no aspect-ratio atado al ancho): en pantallas
              anchas un 4:3 a todo el ancho del drawer se volvía enorme y
              empujaba el precio/descripción/botón fuera de vista, forzando
              scroll para llegar a "Agregar al pedido". object-contain (no
              cover) para que la foto se vea completa, no recortada. */}
          <div className="relative h-[180px] w-full overflow-hidden rounded-xl bg-[var(--surface-2)] sm:h-[220px]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes="(max-width:768px) 100vw, 768px"
                className="object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--surface-2)]">
                <FallbackIcon
                  className="size-12 text-[var(--muted-foreground-dim)]"
                  strokeWidth={1.25}
                  aria-hidden
                />
              </div>
            )}
          </div>

          <DrawerHeader className="px-0">
            <DrawerTitle className="font-display text-[clamp(1.6rem,6vw,2.1rem)] leading-[1.05] tracking-[-0.01em] text-[var(--foreground)]">
              {name}
            </DrawerTitle>
            {/* Its own line, no leader dots: those are a list idiom (name
                connected to price across a row of many items) -- this is a
                single item, so a plain price line reads correctly instead. */}
            <p className="numeric font-condensed text-[1.35rem] font-bold text-[var(--accent-brand)]">
              {formatArs(price)}
            </p>
            {description && (
              <DrawerDescription className="font-body text-[1rem] leading-[1.55] text-[var(--muted-foreground)]">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>

          {children}
        </div>

        <DrawerFooter className="diner-wrap">
          {count === 0 ? (
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-[9px] rounded-lg bg-[var(--accent-brand)] px-[22px] py-[13px] font-condensed text-[1.06rem] font-bold tracking-[0.08em] text-[var(--accent-contrast)] uppercase shadow-[var(--shadow-sm)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-md)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45"
              onClick={onAdd}
            >
              Agregar al pedido
            </button>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex shrink-0 items-center gap-0.5 rounded-[3px] border border-[var(--hairline)] bg-[var(--surface-2)]">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center text-[var(--foreground)] transition-[color,transform] duration-150 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:text-[var(--accent-brand)] active:scale-90 disabled:pointer-events-none disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5"
                  onClick={onRemove}
                  aria-label={`Quitar ${name}`}
                >
                  <Minus />
                </button>
                <output className="numeric w-[26px] text-center font-condensed text-[1.1rem] font-bold text-[var(--muted-foreground)]">
                  {count}
                </output>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center text-[var(--foreground)] transition-[color,transform] duration-150 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:text-[var(--accent-brand)] active:scale-90 disabled:pointer-events-none disabled:opacity-40 [&_svg]:h-3.5 [&_svg]:w-3.5"
                  onClick={onAdd}
                  aria-label={`Agregar ${name}`}
                >
                  <Plus />
                </button>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost">Listo</Button>
              </DrawerClose>
            </div>
          )}
          {footnote != null && (
            <p className="mt-2 text-center font-body text-xs text-[var(--muted-foreground)]">
              {footnote}
            </p>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
