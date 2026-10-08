import type { Shop } from '../types';

// Справочник цехов: полное название ↔ короткое
export const SHOPS: Shop[] = [
  { fullName: 'АО "ВМЗ" - ТЭСЦ-1', shortName: 'ТЭСЦ-1' },
  { fullName: 'АО "ВМЗ" - ТЭСЦ-2', shortName: 'ТЭСЦ-2' },
  { fullName: 'АО "ВМЗ" - ТЭСЦ-3', shortName: 'ТЭСЦ-3' },
  { fullName: 'АО "ВМЗ" - ТЭСЦ-4', shortName: 'ТЭСЦ-4' },
  { fullName: 'АО "ВМЗ" - ТЭСЦ-5', shortName: 'ТЭСЦ-5' },
  { fullName: 'АО "ВМЗ" - МКС-5000', shortName: 'МКС-5000' },
  { fullName: 'АО "ВМЗ" - КПЦ ДЖДК', shortName: 'КПЦ ДЖДК' },
  { fullName: 'АО "ВМЗ" - СПЦ ДЖДК', shortName: 'СПЦ ДЖДК' },
  { fullName: 'АО "ВМЗ" - ЛПК', shortName: 'ЛПК' },
  { fullName: 'АО "ВМЗ" - ТПЦ', shortName: 'ТПЦ' },
  { fullName: 'АО "ВМЗ" - Спецтехника', shortName: 'Спецтехника' },
  { fullName: 'АО "ВМЗ" - ЦАПТ', shortName: 'ЦАПТ' },
  { fullName: 'АО "ВМЗ" - ЦЗЛ', shortName: 'ЦЗЛ' },
  { fullName: 'АО "ВМЗ" - ЦПМ', shortName: 'ЦПМ' },
  { fullName: 'ООО "ВМЗ-Техно" - КРЦ', shortName: 'ВМЗ-Техно КРЦ' },
  { fullName: 'ООО "ВМЗ-Техно" - МРЦ', shortName: 'ВМЗ-Техно МРЦ' },
  { fullName: 'ООО "Эколант" - ЭМК', shortName: 'Эколант ЭМК' },
  { fullName: 'ВлФ "МК ОМК-ЭкоМеталл" - Вязники', shortName: 'МК ОМК-ЭкоМеталл Вязники' },
  { fullName: 'ВлФ "МК ОМК-ЭкоМеталл" - Гусев', shortName: 'МК ОМК-ЭкоМеталл Гусев' },
];

export function getShopShortName(fullName: string): string {
  const shop = SHOPS.find((s) => s.fullName === fullName);
  return shop?.shortName || fullName;
}

export function getShopFullName(shortName: string): string {
  const shop = SHOPS.find((s) => s.shortName === shortName);
  return shop?.fullName || shortName;
}
