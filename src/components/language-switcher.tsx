"use client";

import * as React from "react";
import { Check, Languages } from "lucide-react";
import { setCookie } from "cookies-next";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { locales, localeCookieName, useTranslator, Locale } from "@/lib/i18n";

const languageNames: Record<Locale, string> = {
  "pt-BR": "Português",
  "en-US": "English",
};

export function LanguageSwitcher() {
  const [open, setOpen] = React.useState(false);
  const t = useTranslator("common");
  const currentLocale = t.getLocale();

  const handleSelect = (nextLocale: string) => {
    setCookie(localeCookieName, nextLocale);
    setOpen(false);
    window.location.reload();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[150px] justify-between"
        >
          <Languages className="mr-2 h-4 w-4" />
          {languageNames[currentLocale] || t("language")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {locales.map((locale) => (
                <CommandItem
                  key={locale}
                  value={locale}
                  onSelect={() => handleSelect(locale)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentLocale === locale ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {languageNames[locale]}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
