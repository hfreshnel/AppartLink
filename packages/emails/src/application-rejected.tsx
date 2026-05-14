import { Text, Link } from '@react-email/components'
import { EmailLayout } from './layout'

type Props = {
    tenantName: string
    assetTitle: string
    listingUrl: string
    appName?: string
}

export function ApplicationRejectedEmail({ tenantName, assetTitle, listingUrl, appName = 'AppartLink' }: Props) {
    return (
        <EmailLayout preview={`Mise à jour de votre candidature`} appName={appName}>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Bonjour {tenantName},
            </Text>
            <Text>
                Votre dossier pour le bien <strong>{assetTitle}</strong> n'a pas été retenu.
            </Text>
            <Text>Ne vous découragez pas — de nombreux autres biens sont disponibles sur la plateforme.</Text>
            <Link
                href={listingUrl}
                style={{
                    display: 'inline-block',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    marginTop: '16px',
                }}
            >
                Voir les annonces
            </Link>
        </EmailLayout>
    )
}

export default ApplicationRejectedEmail
