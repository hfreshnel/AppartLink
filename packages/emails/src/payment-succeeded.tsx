import { Text } from '@react-email/components'
import { EmailLayout } from './layout'

type Props = {
    recipientName: string
    amount: number
    description: string
    appName?: string
}

export function PaymentSucceededEmail({
    recipientName,
    amount,
    description,
    appName = 'AppartLink',
}: Props) {
    return (
        <EmailLayout preview={`Paiement confirmé — ${amount.toLocaleString('fr-FR')} XOF`} appName={appName}>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Bonjour {recipientName},
            </Text>
            <Text>Votre paiement a été confirmé avec succès.</Text>
            <Text>
                Montant : <strong>{amount.toLocaleString('fr-FR')} XOF</strong>
                <br />
                Référence : {description}
            </Text>
        </EmailLayout>
    )
}

export default PaymentSucceededEmail
