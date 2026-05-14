import { Text, Link } from '@react-email/components'
import { EmailLayout } from './layout'

type Props = {
    ownerName: string
    tenantName: string
    assetTitle: string
    applicationUrl: string
    appName?: string
}

export function ApplicationSubmittedEmail({
    ownerName,
    tenantName,
    assetTitle,
    applicationUrl,
    appName = 'AppartLink',
}: Props) {
    return (
        <EmailLayout
            preview={`Nouveau dossier de candidature pour ${assetTitle}`}
            appName={appName}
        >
            <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Bonjour {ownerName},
            </Text>
            <Text>
                <strong>{tenantName}</strong> a soumis un dossier de candidature pour votre bien :{' '}
                <strong>{assetTitle}</strong>.
            </Text>
            <Text>
                Vous pouvez consulter et traiter ce dossier en cliquant sur le lien ci-dessous.
            </Text>
            <Link
                href={applicationUrl}
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
                Voir le dossier
            </Link>
        </EmailLayout>
    )
}

export default ApplicationSubmittedEmail
