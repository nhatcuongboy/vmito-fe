import Link from 'next/link';

export default function GlobalNotFound() {
  return (
    <html>
      <body>
        <div
          style={{
            maxWidth: '32rem',
            margin: '0 auto',
            padding: '5rem 1rem',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#1a202c',
            }}
          >
            404
          </h1>
          <p
            style={{
              fontSize: '1.25rem',
              color: '#4a5568',
              marginBottom: '2rem',
            }}
          >
            Page not found
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#179a3b',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            Back to Home
          </Link>
        </div>
      </body>
    </html>
  );
}
