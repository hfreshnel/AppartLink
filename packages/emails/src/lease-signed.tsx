import { Text, Link } from '@react-email/components'
import { EmailLayout } from './layout'

type Props = {
    recipientName: string
    assetTitle: string
    leaseUrl: string
    appName?: string
}

export function LeaseSignedEmail({ recipientName, assetTitle, leaseUrl, appName = 'AppartLink' }: Props) {
    return (
        <EmailLayout preview={`Bail signé — ${assetTitle}`} appName={appName}>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Bonjour {recipientName},
            </Text>
            <Text>
                Le bail pour le bien <strong>{assetTitle}</strong> a été signé et archivé.
            </Text>
            <Text>Vous pouvez télécharger le PDF du bail en cliquant ci-dessous.</Text>
            <Link
                href={leaseUrl}
                style={{
                    display: 'inline-block',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    marginTop: '16px',
                }}
            >
                Télécharger le bail
            </Link>
        </EmailLayout>
    )
}

export default LeaseSignedEmail
