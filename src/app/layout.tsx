import './globals.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import type { Metadata } from 'next';
import ThemeRegistry from '@/theme/ThemeRegistry';
import StoreProvider from '@/store/StoreProvider';
import Container from '@mui/material/Container';
import TopAppBar from '@/components/TopAppBar';
;

export const metadata: Metadata = {
  title: 'Math Editor',
  description: 'Write math reports as Easy as Pi',
  colorScheme: 'dark light',
  themeColor: [{
    media: "(prefers-color-scheme: light)",
    color: "#1976d2"
  },
  {
    media: "(prefers-color-scheme: dark)",
    color: "#121212"
  }]

}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry options={{ key: 'mui', prepend: true }}>
          <StoreProvider>
            <TopAppBar />
            <Container className='editor-container'>
              {children}
            </Container>
          </StoreProvider>
        </ThemeRegistry>
      </body>
    </html>
  )
}
