import { Text, Link } from '@react-email/components'
import { EmailLayout } from './layout'

type Props = {
    recipientName: string
    assetTitle: string
    startDate: string
    rentAmount: number
    leaseUrl: string
    appName?: string
}

export function LeaseCreatedEmail({
    recipientName,
    assetTitle,
    startDate,
    rentAmount,
    leaseUrl,
    appName = 'AppartLink',
}: Props) {
    return (
        <EmailLayout preview={`Bail créé — ${assetTitle}`} appName={appName}>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Bonjour {recipientName},
            </Text>
            <Text>
                Un bail a été créé pour le bien <strong>{assetTitle}</strong>.
            </Text>
            <Text>
                Date de début : <strong>{startDate}</strong>
                <br />
                Loyer mensuel : <strong>{rentAmount.toLocaleString('fr-FR')} XOF</strong>
            </Text>
            <Link
                href={leaseUrl}
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
                Consulter le bail
            </Link>
        </EmailLayout>
    )
}

export default LeaseCreatedEmail
