import { Paperclip } from 'lucide-react'
import type { Payment } from '../hrTypes'

type Props = {
    payment: Payment
    onViewReceipt: (url: string) => void
}

export default function PaymentRow({ payment, onViewReceipt }: Props) {
    return (
        <div className="flex items-center justify-between px-4 py-2.5">
            <div>
                <p className="text-xs font-medium text-gray-700">{payment.concept}</p>
                {payment.notes && <p className="text-xs text-gray-400">{payment.notes}</p>}
            </div>
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                        ${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400">
                        {payment.method} · {new Date(payment.date.toString().split('T')[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        console.log('payment.date:', payment.date, typeof payment.date)
                    </p>
                </div>
                {payment.receiptUrl && (
                    <button
                        onClick={() => onViewReceipt(payment.receiptUrl!)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="View receipt"
                    >
                        <Paperclip size={13} />
                    </button>
                )}
            </div>
        </div>
    )
}