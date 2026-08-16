import { differenceInCalendarDays, parseISO } from 'date-fns';
import { ATRASO_LIMITE_DIAS } from '@/config/hubspot';

export interface TaskForDelay {
  due_date: string | null; // ISO date
  completion_date: string | null; // ISO date
  status: string | null;
}

export interface DelayResult {
  atraso: boolean;
  maiorAtrasoDias: number;
}

const COMPLETED_STATUSES = new Set(['COMPLETED']);

/**
 * Calcula o indicador de atraso de um deal a partir de suas tasks e da data
 * em que foi marcado como perdido (closedate).
 *
 * Um lead é considerado com atraso se QUALQUER tarefa associada:
 *   (a) foi concluída mais de `ATRASO_LIMITE_DIAS` dias após o vencimento, OU
 *   (b) ficou em aberto (não concluída) com vencimento mais de
 *       `ATRASO_LIMITE_DIAS` dias antes da data em que o lead foi perdido.
 */
export function computeDealDelay(tasks: TaskForDelay[], closedate: string | null): DelayResult {
  let maiorAtrasoDias = 0;
  let atraso = false;

  const closedDate = closedate ? parseISO(closedate) : null;

  for (const task of tasks) {
    if (!task.due_date) continue;
    const dueDate = parseISO(task.due_date);
    const isCompleted = task.status ? COMPLETED_STATUSES.has(task.status) : false;

    if (isCompleted && task.completion_date) {
      const completionDate = parseISO(task.completion_date);
      const atrasoDias = differenceInCalendarDays(completionDate, dueDate);
      if (atrasoDias > ATRASO_LIMITE_DIAS) {
        atraso = true;
        maiorAtrasoDias = Math.max(maiorAtrasoDias, atrasoDias);
      }
      continue;
    }

    if (!isCompleted && closedDate) {
      const diasAntesDoFechamento = differenceInCalendarDays(closedDate, dueDate);
      if (diasAntesDoFechamento > ATRASO_LIMITE_DIAS) {
        atraso = true;
        maiorAtrasoDias = Math.max(maiorAtrasoDias, diasAntesDoFechamento);
      }
    }
  }

  return { atraso, maiorAtrasoDias };
}
