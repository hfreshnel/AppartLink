import { Body, Container, Head, Html, Preview, Section, Text } from '@react-email/components'
import { ReactNode } from 'react'

type Props = {
    preview: string
    children: ReactNode
    appName?: string
}

export function EmailLayout({ preview, children, appName = 'AppartLink' }: Props) {
    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }}>
                <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
                    <Text
                        style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '32px' }}
                    >
                        {appName}
                    </Text>
                    <Section
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            padding: '32px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        }}
                    >
                        {children}
                    </Section>
                    <Text style={{ fontSize: '12px', color: '#8898aa', marginTop: '24px', textAlign: 'center' }}>
                        © {new Date().getFullYear()} {appName}. Tous droits réservés.
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}
