import { Text, Link } from '@react-email/components'
import { EmailLayout } from './layout'

type Props = {
    ownerName: string
    assetTitle: string
    assetUrl: string
    appName?: string
}

export function TourPublishedEmail({ ownerName, assetTitle, assetUrl, appName = 'AppartLink' }: Props) {
    return (
        <EmailLayout preview={`Visite 3D publiée — ${assetTitle}`} appName={appName}>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                Bonjour {ownerName},
            </Text>
            <Text>
                La visite virtuelle 3D de votre bien <strong>{assetTitle}</strong> est maintenant en ligne !
            </Text>
            <Text>Votre annonce est désormais visible par tous les locataires potentiels.</Text>
            <Link
                href={assetUrl}
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
                Voir l'annonce
            </Link>
        </EmailLayout>
    )
}

export default TourPublishedEmail
