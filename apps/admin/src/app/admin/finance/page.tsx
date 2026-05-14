import FinanceClient from './FinanceClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function FinancePage(props: any) {
  return <FinanceClient {...props} />
}
