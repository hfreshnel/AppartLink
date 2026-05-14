import { Text } from '@react-email/components'
import { EmailLayout } from './layout'

type Props = {
    ownerName: string
    assetTitle: string
    commissionAmount: number
    appName?: string
}

export function CommissionRequestedEmail({
    ownerName,
    assetTitle,
    commissionAmount,
    appName = 'AppartLink',
}: Props) {
    return (
        <EmailLayout preview={`Commission de mise en location — ${assetTitle}`} appName={appName}>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Bonjour {ownerName},
            </Text>
            <Text>
                Suite à la signature du bail pour <strong>{assetTitle}</strong>, une demande de paiement de
                commission a été initiée.
            </Text>
            <Text>
                Montant : <strong>{commissionAmount.toLocaleString('fr-FR')} XOF</strong>
            </Text>
            <Text>Vous recevrez un lien de paiement séparé de FedaPay.</Text>
        </EmailLayout>
    )
}

export default CommissionRequestedEmail
