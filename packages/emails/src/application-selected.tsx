import { Text, Link } from '@react-email/components'
import { EmailLayout } from './layout'

type Props = {
    tenantName: string
    assetTitle: string
    leaseUrl: string
    appName?: string
}

export function ApplicationSelectedEmail({ tenantName, assetTitle, leaseUrl, appName = 'AppartLink' }: Props) {
    return (
        <EmailLayout preview={`Félicitations — votre dossier a été retenu`} appName={appName}>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Félicitations {tenantName} !
            </Text>
            <Text>
                Votre dossier de candidature pour le bien <strong>{assetTitle}</strong> a été retenu.
            </Text>
            <Text>Le propriétaire va procéder à la création du bail. Vous serez notifié dès sa disponibilité.</Text>
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
                Voir mon dossier
            </Link>
        </EmailLayout>
    )
}

export default ApplicationSelectedEmail
