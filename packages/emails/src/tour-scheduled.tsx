import { Text } from '@react-email/components'
import { EmailLayout } from './layout'

type Props = {
    ownerName: string
    assetTitle: string
    scheduledDate: string
    appName?: string
}

export function TourScheduledEmail({ ownerName, assetTitle, scheduledDate, appName = 'AppartLink' }: Props) {
    return (
        <EmailLayout preview={`Visite 3D planifiée — ${assetTitle}`} appName={appName}>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Bonjour {ownerName},
            </Text>
            <Text>
                La visite 3D de votre bien <strong>{assetTitle}</strong> est planifiée.
            </Text>
            <Text>
                Date de tournage : <strong>{scheduledDate}</strong>
            </Text>
            <Text>Notre équipe vous contactera pour confirmer les détails.</Text>
        </EmailLayout>
    )
}

export default TourScheduledEmail
