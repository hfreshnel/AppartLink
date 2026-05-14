import { Text } from '@react-email/components'
import { EmailLayout } from './layout'

type Props = {
    tenantName: string
    documentType: string
    appName?: string
}

export function DocumentValidatedEmail({ tenantName, documentType, appName = 'AppartLink' }: Props) {
    return (
        <EmailLayout preview={`Document validé — ${documentType}`} appName={appName}>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Bonjour {tenantName},
            </Text>
            <Text>
                Votre document <strong>{documentType}</strong> a été analysé et validé avec succès.
            </Text>
            <Text>Votre dossier est en cours de traitement par le propriétaire.</Text>
        </EmailLayout>
    )
}

export default DocumentValidatedEmail
