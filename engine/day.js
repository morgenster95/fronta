// Číslo dne, jak ho vidí hráči (Gazette, deníky, web, videa). Vnitřní state.day běží o 1 napřed proti kalendáři,
// který uživatel počítá (Den 1 = 10. 11., vydání 15. 11. = Day 6); theme.dayShift = −1 to srovná jen v zobrazení,
// uložená čísla dnů ve stavu se nemění (pravidlo uživatele 15. 11.).
export const showDay = (theme, d) => d + (theme?.dayShift ?? 0);
