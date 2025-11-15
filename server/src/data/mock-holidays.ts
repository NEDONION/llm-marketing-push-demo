/**
 * 节假日和促销活动数据
 */
export interface Holiday {
  name: string;
  startDate: string;
  endDate: string;
  locale: string;
}

export const holidays: Holiday[] = [
  {
    name: 'Black Friday',
    startDate: '2025-11-28',
    endDate: '2025-11-29',
    locale: 'en-US'
  },
  {
    name: 'Cyber Monday',
    startDate: '2025-12-01',
    endDate: '2025-12-02',
    locale: 'en-US'
  },
  {
    name: 'Singles Day',
    startDate: '2025-11-11',
    endDate: '2025-11-11',
    locale: 'en-US'
  },
  {
    name: 'Christmas',
    startDate: '2025-12-24',
    endDate: '2025-12-25',
    locale: 'en-US'
  },
  {
    name: 'New Year',
    startDate: '2025-12-31',
    endDate: '2026-01-01',
    locale: 'en-US'
  },
  {
    name: "Valentine's Day",
    startDate: '2025-02-14',
    endDate: '2025-02-14',
    locale: 'en-US'
  },
  {
    name: 'Prime Day',
    startDate: '2025-07-15',
    endDate: '2025-07-16',
    locale: 'en-US'
  }
];
