import Image from 'next/image';

export default function Logo({ className = "" }: { className?: string }) {
    return (
        <Image
            src="/logo/FullLogo_Transparent_NoBuffer.png"
            alt="Perunio Logo"
            width={180}
            height={60}
            className={className}
            priority
        />
    );
}
