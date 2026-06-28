import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';

export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Generated social card. Mirrors the brand mark (rounded A|B split, emerald
// winning side) on the dark default theme so previews match the live app.
export default function OpengraphImage() {
    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '80px',
                background: '#0a0a0a',
                fontFamily: 'sans-serif'
            }}
        >
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div
                    style={{
                        display: 'flex',
                        width: '108px',
                        height: '108px',
                        borderRadius: '26px',
                        border: '6px solid #fafafa',
                        overflow: 'hidden'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            width: '50%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fafafa',
                            fontSize: '46px',
                            fontWeight: 700
                        }}
                    >
                        A
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            width: '50%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#10b981',
                            color: '#ffffff',
                            fontSize: '46px',
                            fontWeight: 700
                        }}
                    >
                        B
                    </div>
                </div>
                <div style={{ fontSize: '40px', fontWeight: 600, color: '#fafafa' }}>{SITE.name}</div>
            </div>

            {/* Headline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', fontSize: '78px', fontWeight: 800, lineHeight: 1.05, color: '#fafafa' }}>
                    Compare system prompts
                    <span style={{ color: '#10b981' }}>.</span>
                </div>
                <div style={{ fontSize: '32px', color: '#a1a1aa', maxWidth: '900px' }}>
                    Run two prompts on the same question, stream both answers, and let AI score them 0–10.
                </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '30px', fontWeight: 600, color: '#10b981' }}>rateaprompt.dibenko.com</div>
                <div style={{ fontSize: '28px', color: '#a1a1aa' }}>Free · Open Source · BYOK</div>
            </div>
        </div>,
        { ...size }
    );
}
