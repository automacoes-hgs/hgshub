export interface BdrMember {
  id: string
  profile_id: string | null
  name: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BdrGoal {
  id: string
  bdr_id: string
  year: number
  month: number
  attempts_goal: number
  attendances_goal: number
  decision_makers_goal: number
  qualifications_goal: number
  meetings_scheduled_goal: number
  meetings_done_goal: number
  lead_time_goal: number
  created_at: string
  updated_at: string
}

export interface BdrDailyLog {
  id: string
  bdr_id: string
  log_date: string
  attempts: number
  attendances: number
  decision_makers: number
  qualifications: number
  meetings_scheduled: number
  meetings_done: number
  lead_time_days: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface BdrSummary {
  attempts: number
  attendances: number
  decision_makers: number
  qualifications: number
  meetings_scheduled: number
  meetings_done: number
  lead_time_avg: number
  show_rate: number
}

export function sumLogs(logs: BdrDailyLog[]): BdrSummary {
  if (logs.length === 0) {
    return {
      attempts: 0,
      attendances: 0,
      decision_makers: 0,
      qualifications: 0,
      meetings_scheduled: 0,
      meetings_done: 0,
      lead_time_avg: 0,
      show_rate: 0,
    }
  }
  const attempts = logs.reduce((s, l) => s + l.attempts, 0)
  const attendances = logs.reduce((s, l) => s + l.attendances, 0)
  const decision_makers = logs.reduce((s, l) => s + l.decision_makers, 0)
  const qualifications = logs.reduce((s, l) => s + l.qualifications, 0)
  const meetings_scheduled = logs.reduce((s, l) => s + l.meetings_scheduled, 0)
  const meetings_done = logs.reduce((s, l) => s + l.meetings_done, 0)
  const lead_time_sum = logs.reduce((s, l) => s + Number(l.lead_time_days), 0)
  const lead_time_avg = logs.length > 0 ? lead_time_sum / logs.length : 0
  const show_rate = meetings_scheduled > 0 ? (meetings_done / meetings_scheduled) * 100 : 0
  return { attempts, attendances, decision_makers, qualifications, meetings_scheduled, meetings_done, lead_time_avg, show_rate }
}

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
