// Číslo dne pro hráče: uložený den + theme.dayShift (−1 od 15. 11.: vnitřní den běží o 1 napřed proti kalendáři uživatele,
// Den 1 = 10. 11.). Stejné pravidlo jako engine/day.js. setDayShift volá main.js po načtení tématu.
let SHIFT = 0;
export const setDayShift = (theme) => { SHIFT = theme?.dayShift ?? 0; };
export const dayNo = (d) => d + SHIFT;
export const dayLabel = (d) => (dayNo(d) > 0 ? `Day ${dayNo(d)}` : 'Mobilization');
