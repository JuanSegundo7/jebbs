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
          <div className="relative h-[180px] w-full overflow-hidden rounded-xl bg-[var(--slab)] sm:h-[220px]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes="(max-width:768px) 100vw, 768px"
                className="object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--slab)]">
                <FallbackIcon
                  className="size-12 text-[var(--ash-dim)]"
                  strokeWidth={1.25}
                  aria-hidden
                />
              </div>
            )}
          </div>

          <DrawerHeader className="px-0">
            <DrawerTitle className="font-display text-[clamp(1.6rem,6vw,2.1rem)] leading-[1.05] tracking-[-0.01em] text-[var(--cream)]">
              {name}
            </DrawerTitle>
            {/* Its own line, no leader dots: those are a list idiom (name
                connected to price across a row of many items) -- this is a
                single item, so a plain price line reads correctly instead. */}
            <p className="numeric font-condensed text-[1.35rem] font-bold text-[var(--cheddar)]">
              {formatArs(price)}
            </p>
            {description && (
              <DrawerDescription className="font-body text-[1rem] leading-[1.55] text-[var(--ash-bright)]">
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
              className="diner-btn diner-btn-primary w-full justify-center"
              onClick={onAdd}
            >
              Agregar al pedido
            </button>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="diner-stepper">
                <button
                  type="button"
                  className="diner-st"
                  onClick={onRemove}
                  aria-label={`Quitar ${name}`}
                >
                  <Minus />
                </button>
                <output className="diner-qty">{count}</output>
                <button
                  type="button"
                  className="diner-st"
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
            <p className="mt-2 text-center font-body text-xs text-[var(--ash)]">
              {footnote}
            </p>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
