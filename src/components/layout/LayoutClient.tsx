'use client'

import { useEffect } from 'react'
import { XPNotifications } from '@/components/notifications/XPNotifications'
import { AtmosphericDecor } from '@/components/layout/AtmosphericDecor'
import { useStore } from '@/lib/store'

const MARCH_JOBS = [
  {date:'2026-03-03',start:'13:00',end:'22:00',label:'Работа в маке'},
  {date:'2026-03-04',start:'13:30',end:'22:30',label:'Работа в маке'},
  {date:'2026-03-06',start:'13:00',end:'21:30',label:'Работа в маке'},
  {date:'2026-03-07',start:'13:00',end:'21:30',label:'Работа в маке'},
  {date:'2026-03-08',start:'13:00',end:'21:00',label:'Работа в маке'},
  {date:'2026-03-10',start:'13:00',end:'21:30',label:'Работа в маке'},
  {date:'2026-03-11',start:'13:00',end:'21:30',label:'Работа в маке'},
  {date:'2026-03-12',start:'12:30',end:'21:00',label:'Работа в маке'},
  {date:'2026-03-13',start:'13:30',end:'22:30',label:'Работа в маке'},
  {date:'2026-03-16',start:'12:00',end:'21:00',label:'Работа в маке'},
  {date:'2026-03-18',start:'13:30',end:'22:30',label:'Работа в маке'},
  {date:'2026-03-19',start:'13:00',end:'21:30',label:'Работа в маке'},
  {date:'2026-03-20',start:'13:00',end:'21:30',label:'Работа в маке'},
  {date:'2026-03-21',start:'13:15',end:'21:00',label:'Работа в маке'},
  {date:'2026-03-23',start:'13:00',end:'21:30',label:'Работа в маке'},
  {date:'2026-03-24',start:'13:00',end:'21:30',label:'Работа в маке'},
  {date:'2026-03-25',start:'13:30',end:'22:30',label:'Работа в маке'},
  {date:'2026-03-27',start:'13:30',end:'22:30',label:'Работа в маке'},
  {date:'2026-03-29',start:'13:00',end:'21:00',label:'Работа в маке'},
  {date:'2026-03-30',start:'13:30',end:'22:30',label:'Работа в маке'},
  {date:'2026-03-31',start:'13:30',end:'22:30',label:'Работа в маке'},
]
const MARCH_ALL_DAYS = [
  '2026-03-01','2026-03-02','2026-03-03','2026-03-04','2026-03-05',
  '2026-03-06','2026-03-07','2026-03-08','2026-03-09','2026-03-10',
  '2026-03-11','2026-03-12','2026-03-13','2026-03-14','2026-03-15',
  '2026-03-16','2026-03-17','2026-03-18','2026-03-19','2026-03-20',
  '2026-03-21','2026-03-22','2026-03-23','2026-03-24','2026-03-25',
  '2026-03-26','2026-03-27','2026-03-28','2026-03-29','2026-03-30','2026-03-31',
]
const FIX_KEY = 'march2026-fix-v2'

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const { updateSchedule, setDayJobs } = useStore()

  useEffect(() => {
    if (localStorage.getItem(FIX_KEY)) return
    localStorage.setItem(FIX_KEY, '1')
    // updateSchedule генерирует задачи для всех дней месяца
    updateSchedule('2026-03', MARCH_ALL_DAYS)
    // setDayJobs переопределяет рабочие смены и перегенерирует задачи
    setDayJobs(MARCH_JOBS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <AtmosphericDecor />
      {children}
      <XPNotifications />
    </>
  )
}
