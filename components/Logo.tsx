import Image from 'next/image';

export default function Logo({ className = "" }: { className?: string }) {
    return (
        <Image
            src="/logo/fulllogo_transparent_nobuffer.png"
            alt="Perunio Logo"
            width={180}
            height={60}
            className={className}
            priority
        />
    );
}
