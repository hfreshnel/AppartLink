import { Text } from '@react-email/components'
import { EmailLayout } from './layout'

type Props = {
    tenantName: string
    documentType: string
    reason?: string
    appName?: string
}

export function DocumentRejectedEmail({ tenantName, documentType, reason, appName = 'AppartLink' }: Props) {
    return (
        <EmailLayout preview={`Document refusé — ${documentType}`} appName={appName}>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Bonjour {tenantName},
            </Text>
            <Text>
                Votre document <strong>{documentType}</strong> n'a pas pu être validé.
            </Text>
            {reason && <Text style={{ color: '#dc2626' }}>Raison : {reason}</Text>}
            <Text>Veuillez soumettre à nouveau un document valide pour compléter votre dossier.</Text>
        </EmailLayout>
    )
}

export default DocumentRejectedEmail
